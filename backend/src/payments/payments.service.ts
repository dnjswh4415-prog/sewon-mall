import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface ConfirmPaymentDto {
  paymentKey: string;
  orderId: string;
  amount: number;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async confirmPayment(userId: number, dto: ConfirmPaymentDto) {
    const normalizedUserId = Number(userId);
    const normalizedAmount = Number(dto.amount);

    if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
      throw new BadRequestException('유효하지 않은 사용자입니다.');
    }

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

    const order = await this.prisma.order.findFirst({
      where: {
        userId: normalizedUserId,
        orderNumber: dto.orderId,
      },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('주문 정보를 찾을 수 없습니다.');
    }

    if (Number(order.totalPrice) !== normalizedAmount) {
      throw new BadRequestException('결제 금액이 주문 금액과 일치하지 않습니다.');
    }

    if (order.status === 'PAYMENT_COMPLETE') {
      return {
        message: '이미 결제 완료된 주문입니다.',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        payment: {
          paymentKey: order.paymentKey,
          totalAmount: Number(order.totalPrice),
          method: null,
        },
      };
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
      return {
        message: '이미 처리된 결제 요청입니다.',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        payment: {
          paymentKey: existingPaymentByKey.paymentKey,
          totalAmount: Number(existingPaymentByKey.amount),
          method: null,
        },
      };
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
          requestJson: requestBody,
          responseJson: result,
        },
        create: {
          orderId: order.id,
          provider: 'TOSS',
          status: 'FAILED',
          paymentKey: dto.paymentKey,
          amount: normalizedAmount,
          failCode: result?.code ?? null,
          failMessage: result?.message ?? '토스 결제 승인 실패',
          requestJson: requestBody,
          responseJson: result,
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
          requestJson: requestBody,
          responseJson: result,
        },
        create: {
          orderId: order.id,
          provider: 'TOSS',
          status: 'FAILED',
          paymentKey: dto.paymentKey,
          amount: normalizedAmount,
          failCode: 'INVALID_CONFIRM_RESPONSE',
          failMessage: '토스 승인 응답 검증에 실패했습니다.',
          requestJson: requestBody,
          responseJson: result,
        },
      });

      throw new BadRequestException('결제 승인 응답이 주문 정보와 일치하지 않습니다.');
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
            '결제 승인 가능한 주문 상태가 아닙니다.',
          );
        }

        await tx.paymentLog.upsert({
          where: {
            paymentKey: dto.paymentKey,
          },
          update: {
            orderId: currentOrder.id,
            provider: 'TOSS',
            status: 'CONFIRMED',
            amount: Number(result.totalAmount ?? normalizedAmount),
            failCode: null,
            failMessage: null,
            requestJson: requestBody,
            responseJson: result,
          },
          create: {
            orderId: currentOrder.id,
            provider: 'TOSS',
            status: 'CONFIRMED',
            paymentKey: result.paymentKey ?? dto.paymentKey,
            amount: Number(result.totalAmount ?? normalizedAmount),
            requestJson: requestBody,
            responseJson: result,
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
                note: '결제 완료로 옵션 재고 차감',
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
                note: '결제 완료로 상품 재고 차감',
              },
            });
          }
        }

        await tx.cartItem.deleteMany({
          where: {
            userId: normalizedUserId,
            OR: currentOrder.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
            })),
          },
        });

        return tx.order.update({
          where: { id: currentOrder.id },
          data: {
            status: 'PAYMENT_COMPLETE',
            paymentKey: result.paymentKey ?? dto.paymentKey,
            paidAt: new Date(),
          },
        });
      },
    );

    return {
      message: '결제가 정상 승인되었습니다.',
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      payment: {
        paymentKey: result.paymentKey ?? dto.paymentKey,
        totalAmount: Number(result.totalAmount ?? normalizedAmount),
        method: result.method ?? null,
      },
    };
  }
}