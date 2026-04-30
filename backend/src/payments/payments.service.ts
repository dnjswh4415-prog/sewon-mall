import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface ConfirmTossPaymentDto {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface ConfirmPayPayPaymentDto {
  merchantPaymentId: string;
  paymentDetails: any;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeUserId(userId: number) {
    const normalizedUserId = Number(userId);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

    return normalizedUserId;
  }

  private toJson(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) return undefined;
    if (value === null) return Prisma.JsonNull;
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private parsePaidAt(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return new Date();
  }

  private async getOrderForConfirmation(userId: number, orderNumber: string) {
    const normalizedUserId = this.normalizeUserId(userId);

    const order = await this.prisma.order.findFirst({
      where: {
        userId: normalizedUserId,
        orderNumber: String(orderNumber),
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
    }

    return order;
  }

  private buildSuccessResponse(params: {
    order: {
      id: number;
      orderNumber: string;
      status: string;
      paymentKey: string | null;
      totalPrice: number;
    };
    message: string;
    totalAmount: number;
    method?: string | null;
  }) {
    return {
      message: params.message,
      orderId: params.order.id,
      orderNumber: params.order.orderNumber,
      status: params.order.status,
      payment: {
        paymentKey: params.order.paymentKey,
        totalAmount: Number(params.totalAmount),
        method: params.method ?? null,
      },
    };
  }

  private async finalizeExternalPayment(params: {
    userId: number;
    orderNumber: string;
    paymentKey: string;
    provider: PaymentProvider;
    totalAmount: number;
    method?: string | null;
    paidAt?: Date;
    requestJson?: unknown;
    responseJson?: unknown;
  }) {
    const normalizedUserId = this.normalizeUserId(params.userId);
    const normalizedAmount = Number(params.totalAmount);

    if (
      !params.paymentKey ||
      !String(params.paymentKey).trim() ||
      !params.orderNumber ||
      !String(params.orderNumber).trim() ||
      !Number.isFinite(normalizedAmount) ||
      normalizedAmount <= 0
    ) {
      throw new BadRequestException('결제 확정 정보가 올바르지 않습니다.');
    }

    const order = await this.getOrderForConfirmation(
      normalizedUserId,
      params.orderNumber,
    );

    if (Number(order.totalPrice) !== normalizedAmount) {
      throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다.');
    }

    if (order.status === 'PAYMENT_COMPLETE') {
      return this.buildSuccessResponse({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentKey: order.paymentKey,
          totalPrice: Number(order.totalPrice),
        },
        message: '이미 결제 완료된 주문입니다.',
        totalAmount: Number(order.totalPrice),
        method: params.method ?? null,
      });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('결제 확정 가능한 주문 상태가 아닙니다.');
    }

    const existingPaymentByKey = await this.prisma.paymentLog.findUnique({
      where: {
        paymentKey: params.paymentKey,
      },
      include: {
        order: true,
      },
    });

    if (existingPaymentByKey && existingPaymentByKey.orderId !== order.id) {
      throw new BadRequestException('이미 다른 주문에 사용된 결제 키입니다.');
    }

    const updatedOrder = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const currentOrder = await tx.order.findFirst({
          where: {
            id: order.id,
            userId: normalizedUserId,
          },
          include: {
            items: true,
            payments: true,
          },
        });

        if (!currentOrder) {
          throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
        }

        if (currentOrder.status === 'PAYMENT_COMPLETE') {
          return currentOrder;
        }

        if (currentOrder.status !== 'PENDING_PAYMENT') {
          throw new BadRequestException(
            '결제 확정 가능한 주문 상태가 아닙니다.',
          );
        }

        await tx.paymentLog.upsert({
          where: {
            paymentKey: params.paymentKey,
          },
          update: {
            orderId: currentOrder.id,
            provider: params.provider,
            status: 'CONFIRMED',
            amount: normalizedAmount,
            failCode: null,
            failMessage: null,
            requestJson: this.toJson(params.requestJson),
            responseJson: this.toJson(params.responseJson),
          },
          create: {
            orderId: currentOrder.id,
            provider: params.provider,
            status: 'CONFIRMED',
            paymentKey: params.paymentKey,
            amount: normalizedAmount,
            requestJson: this.toJson(params.requestJson),
            responseJson: this.toJson(params.responseJson),
          },
        });

        for (const item of currentOrder.items) {
          const quantity = Number(item.quantity);

          if (item.variantId) {
            const variantUpdateResult = await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                productId: item.productId,
                isActive: true,
                stock: {
                  gte: quantity,
                },
              },
              data: {
                stock: {
                  decrement: quantity,
                },
              },
            });

            if (variantUpdateResult.count === 0) {
              throw new BadRequestException(
                `옵션 재고가 부족합니다. variantId=${item.variantId}`,
              );
            }

            const updatedVariant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
            });

            const afterStock = Number(updatedVariant?.stock ?? 0);
            const beforeStock = afterStock + quantity;

            await tx.stockHistory.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                orderId: currentOrder.id,
                orderItemId: item.id,
                quantity: -quantity,
                changeType: 'ORDER_PAID',
                beforeStock,
                afterStock,
                note:
                  params.provider === PaymentProvider.PAYPAY
                    ? 'PayPay 결제 완료로 옵션 재고 차감'
                    : '결제 완료로 옵션 재고 차감',
              },
            });
          } else {
            const productUpdateResult = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: {
                  gte: quantity,
                },
              },
              data: {
                stock: {
                  decrement: quantity,
                },
              },
            });

            if (productUpdateResult.count === 0) {
              throw new BadRequestException(
                `상품 재고가 부족합니다. productId=${item.productId}`,
              );
            }

            const updatedProduct = await tx.product.findUnique({
              where: { id: item.productId },
            });

            const afterStock = Number(updatedProduct?.stock ?? 0);
            const beforeStock = afterStock + quantity;

            await tx.stockHistory.create({
              data: {
                productId: item.productId,
                orderId: currentOrder.id,
                orderItemId: item.id,
                quantity: -quantity,
                changeType: 'ORDER_PAID',
                beforeStock,
                afterStock,
                note:
                  params.provider === PaymentProvider.PAYPAY
                    ? 'PayPay 결제 완료로 상품 재고 차감'
                    : '결제 완료로 상품 재고 차감',
              },
            });
          }
        }

        if (currentOrder.items.length > 0) {
          await tx.cartItem.deleteMany({
            where: {
              userId: normalizedUserId,
              OR: currentOrder.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId ?? null,
              })),
            },
          });
        }

        return tx.order.update({
          where: { id: currentOrder.id },
          data: {
            status: 'PAYMENT_COMPLETE',
            paymentKey: params.paymentKey,
            paidAt: params.paidAt ?? new Date(),
          },
        });
      },
    );

    return this.buildSuccessResponse({
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        paymentKey: updatedOrder.paymentKey,
        totalPrice: Number(updatedOrder.totalPrice),
      },
      message: '결제가 정상 승인되었습니다.',
      totalAmount: normalizedAmount,
      method: params.method ?? null,
    });
  }

  async confirmPayment(userId: number, dto: ConfirmTossPaymentDto) {
    const normalizedUserId = this.normalizeUserId(userId);
    const normalizedAmount = Number(dto.amount);

    if (
      !dto.paymentKey ||
      !String(dto.paymentKey).trim() ||
      !dto.orderId ||
      !String(dto.orderId).trim() ||
      !Number.isFinite(normalizedAmount) ||
      normalizedAmount <= 0
    ) {
      throw new BadRequestException('결제 승인 정보가 올바르지 않습니다.');
    }

    const order = await this.getOrderForConfirmation(
      normalizedUserId,
      dto.orderId,
    );

    if (Number(order.totalPrice) !== normalizedAmount) {
      throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다.');
    }

    if (order.status === 'PAYMENT_COMPLETE') {
      return this.buildSuccessResponse({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentKey: order.paymentKey,
          totalPrice: Number(order.totalPrice),
        },
        message: '이미 결제 완료된 주문입니다.',
        totalAmount: Number(order.totalPrice),
        method: null,
      });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('결제 승인 가능한 주문 상태가 아닙니다.');
    }

    const existingPaymentByKey = await this.prisma.paymentLog.findUnique({
      where: {
        paymentKey: dto.paymentKey,
      },
      include: {
        order: true,
      },
    });

    if (existingPaymentByKey && existingPaymentByKey.orderId !== order.id) {
      throw new BadRequestException('이미 다른 주문에 사용된 결제 키입니다.');
    }

    if (
      existingPaymentByKey &&
      existingPaymentByKey.orderId === order.id &&
      existingPaymentByKey.status === 'CONFIRMED'
    ) {
      return this.buildSuccessResponse({
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentKey: existingPaymentByKey.paymentKey,
          totalPrice: Number(order.totalPrice),
        },
        message: '이미 처리된 결제 요청입니다.',
        totalAmount: Number(existingPaymentByKey.amount),
        method: null,
      });
    }

    const secretKey = process.env.TOSS_SECRET_KEY;

    if (!secretKey) {
      throw new InternalServerErrorException(
        'TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.',
      );
    }

    const encodedKey = Buffer.from(`${secretKey}:`).toString('base64');

    const requestBody = {
      paymentKey: dto.paymentKey,
      orderId: dto.orderId,
      amount: normalizedAmount,
    };

    const response = await fetch(
      'https://api.tosspayments.com/v1/payments/confirm',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      await this.prisma.paymentLog.upsert({
        where: {
          paymentKey: dto.paymentKey,
        },
        update: {
          orderId: order.id,
          provider: 'TOSS',
          status: 'FAILED',
          amount: normalizedAmount,
          failCode: result?.code ?? null,
          failMessage: result?.message ?? '토스 결제 승인 실패',
          requestJson: this.toJson(requestBody),
          responseJson: this.toJson(result),
        },
        create: {
          orderId: order.id,
          provider: 'TOSS',
          status: 'FAILED',
          paymentKey: dto.paymentKey,
          amount: normalizedAmount,
          failCode: result?.code ?? null,
          failMessage: result?.message ?? '토스 결제 승인 실패',
          requestJson: this.toJson(requestBody),
          responseJson: this.toJson(result),
        },
      });

      throw new BadRequestException(
        result?.message ?? '토스 결제 승인에 실패했습니다.',
      );
    }

    if (
      String(result?.orderId ?? '') !== String(dto.orderId) ||
      Number(result?.totalAmount ?? 0) !== normalizedAmount
    ) {
      await this.prisma.paymentLog.upsert({
        where: {
          paymentKey: dto.paymentKey,
        },
        update: {
          orderId: order.id,
          provider: 'TOSS',
          status: 'FAILED',
          amount: normalizedAmount,
          failCode: 'INVALID_CONFIRM_RESPONSE',
          failMessage: '토스 승인 응답 검증에 실패했습니다.',
          requestJson: this.toJson(requestBody),
          responseJson: this.toJson(result),
        },
        create: {
          orderId: order.id,
          provider: 'TOSS',
          status: 'FAILED',
          paymentKey: dto.paymentKey,
          amount: normalizedAmount,
          failCode: 'INVALID_CONFIRM_RESPONSE',
          failMessage: '토스 승인 응답 검증에 실패했습니다.',
          requestJson: this.toJson(requestBody),
          responseJson: this.toJson(result),
        },
      });

      throw new BadRequestException('결제 승인 응답이 주문 정보와 일치하지 않습니다.');
    }

    return this.finalizeExternalPayment({
      userId: normalizedUserId,
      orderNumber: dto.orderId,
      paymentKey: result.paymentKey ?? dto.paymentKey,
      provider: PaymentProvider.TOSS,
      totalAmount: normalizedAmount,
      method: result.method ?? null,
      paidAt: this.parsePaidAt(result.approvedAt ?? result.requestedAt),
      requestJson: requestBody,
      responseJson: result,
    });
  }

  async confirmPayPayPayment(
    userId: number,
    dto: ConfirmPayPayPaymentDto,
  ) {
    const normalizedUserId = this.normalizeUserId(userId);

    if (!dto?.merchantPaymentId || !String(dto.merchantPaymentId).trim()) {
      throw new BadRequestException('merchantPaymentId가 필요합니다.');
    }

    const order = await this.getOrderForConfirmation(
      normalizedUserId,
      dto.merchantPaymentId,
    );

    const paymentData = dto.paymentDetails?.data ?? {};
    const status = String(paymentData?.status ?? '');

    if (status !== 'COMPLETED') {
      await this.prisma.paymentLog.upsert({
        where: {
          paymentKey: dto.merchantPaymentId,
        },
        update: {
          orderId: order.id,
          provider: 'PAYPAY',
          status: 'FAILED',
          amount: Number(order.totalPrice),
          failCode: status || 'PAYPAY_NOT_COMPLETED',
          failMessage: 'PayPay 결제가 완료 상태가 아닙니다.',
          requestJson: this.toJson({
            merchantPaymentId: dto.merchantPaymentId,
          }),
          responseJson: this.toJson(dto.paymentDetails),
        },
        create: {
          orderId: order.id,
          provider: 'PAYPAY',
          status: 'FAILED',
          paymentKey: dto.merchantPaymentId,
          amount: Number(order.totalPrice),
          failCode: status || 'PAYPAY_NOT_COMPLETED',
          failMessage: 'PayPay 결제가 완료 상태가 아닙니다.',
          requestJson: this.toJson({
            merchantPaymentId: dto.merchantPaymentId,
          }),
          responseJson: this.toJson(dto.paymentDetails),
        },
      });

      throw new BadRequestException(
        `PayPay 결제 완료 상태가 아닙니다. 현재 상태: ${status || 'UNKNOWN'}`,
      );
    }

    return this.finalizeExternalPayment({
      userId: normalizedUserId,
      orderNumber: order.orderNumber,
      paymentKey: dto.merchantPaymentId,
      provider: PaymentProvider.PAYPAY,
      totalAmount: Number(order.totalPrice),
      method: 'PAYPAY',
      paidAt: this.parsePaidAt(
        paymentData?.acceptedAt ??
          paymentData?.completedAt ??
          paymentData?.updatedAt,
      ),
      requestJson: {
        merchantPaymentId: dto.merchantPaymentId,
      },
      responseJson: dto.paymentDetails,
    });
  }
}