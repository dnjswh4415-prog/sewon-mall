import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { PaymentsService } from '../payments/payments.service';
import { buildPayPayAuthHeader } from './paypay-sign';

@Injectable()
export class PayPayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly paymentsService: PaymentsService,
  ) {}

  private getConfig() {
    const apiKey = (process.env.PAYPAY_API_KEY ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');

    const apiSecret = (process.env.PAYPAY_API_SECRET ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');

    const merchantId = (process.env.PAYPAY_MERCHANT_ID ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');

    const baseUrl = (process.env.PAYPAY_BASE_URL ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');

    const redirectUrl = (process.env.PAYPAY_REDIRECT_URL ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');

    const bufferPercent = Number(process.env.PAYPAY_JPY_BUFFER_PERCENT ?? 0);
    const roundupUnit = Number(process.env.PAYPAY_JPY_ROUNDUP_UNIT ?? 10);

    if (!apiKey || !apiSecret || !merchantId || !baseUrl || !redirectUrl) {
      throw new BadRequestException('PayPay 환경변수가 누락되었습니다.');
    }

    return {
      apiKey,
      apiSecret,
      merchantId,
      baseUrl,
      redirectUrl,
      bufferPercent,
      roundupUnit,
    };
  }

  private async getOrderForPayPay(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: Number(orderId),
        userId: Number(userId),
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new BadRequestException('주문을 찾을 수 없습니다.');
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('결제 가능한 주문 상태가 아닙니다.');
    }

    const krwAmount = Number(order.totalPrice);

    if (!Number.isFinite(krwAmount) || krwAmount <= 0) {
      throw new BadRequestException('주문 금액이 올바르지 않습니다.');
    }

    return order;
  }

  private appendQueryParams(
    baseUrl: string,
    params: Record<string, string | number>,
  ) {
    try {
      const url = new URL(baseUrl);

      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });

      return url.toString();
    } catch {
      const [withoutHash, hash = ''] = baseUrl.split('#');
      const hasQuery = withoutHash.includes('?');
      const query = Object.entries(params)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        )
        .join('&');

      return `${withoutHash}${hasQuery ? '&' : '?'}${query}${
        hash ? `#${hash}` : ''
      }`;
    }
  }

  async createCodeForOrder(
    userId: number,
    orderId: number,
    userAgent?: string,
  ) {
    const order = await this.getOrderForPayPay(userId, orderId);
    const config = this.getConfig();

    const converted = await this.exchangeRateService.convertLatestKrwToJpy(
      Number(order.totalPrice),
      {
        bufferPercent: config.bufferPercent,
        roundupUnit: config.roundupUnit,
      },
    );

    const result = await this.createCode({
      merchantPaymentId: order.orderNumber,
      orderId: order.id,
      amount: converted.targetAmount,
      orderDescription: `${order.orderNumber} PayPay 결제`,
      userAgent,
    });

    return {
      ...result,
      merchantPaymentId: order.orderNumber,
      orderId: order.id,
      krwAmount: Number(order.totalPrice),
      jpyAmount: converted.targetAmount,
      exchangeMeta: converted,
    };
  }

  async createCode(params: {
    merchantPaymentId: string;
    orderId: number;
    amount: number;
    orderDescription: string;
    userAgent?: string;
  }) {
    const { apiKey, apiSecret, merchantId, baseUrl, redirectUrl } =
      this.getConfig();

    const requestUri = '/v2/codes';

    const finalRedirectUrl = this.appendQueryParams(redirectUrl, {
      merchantPaymentId: params.merchantPaymentId,
      orderId: params.orderId,
    });

    const body = {
      merchantPaymentId: params.merchantPaymentId,
      amount: {
        amount: Number(params.amount),
        currency: 'JPY',
      },
      orderDescription: params.orderDescription,
      codeType: 'ORDER_QR',
      redirectUrl: finalRedirectUrl,
      redirectType: 'WEB_LINK',
      requestedAt: Math.floor(Date.now() / 1000),
      ...(params.userAgent ? { userAgent: params.userAgent } : {}),
    };

    const bodyString = JSON.stringify(body);

    const signed = buildPayPayAuthHeader({
      apiKey,
      apiSecret,
      requestUri,
      method: 'POST',
      body: bodyString,
      contentType: 'application/json;charset=UTF-8',
    });

    const response = await axios.post(`${baseUrl}${requestUri}`, body, {
      headers: {
        Authorization: signed.authorization,
        'Content-Type': signed.contentType,
        'X-ASSUME-MERCHANT': merchantId,
      },
      timeout: 30000,
    });

    return response.data;
  }

  async getPaymentDetails(merchantPaymentId: string) {
    const { apiKey, apiSecret, merchantId, baseUrl } = this.getConfig();

    const requestUri = `/v2/codes/payments/${merchantPaymentId}`;

    const signed = buildPayPayAuthHeader({
      apiKey,
      apiSecret,
      requestUri,
      method: 'GET',
    });

    const response = await axios.get(`${baseUrl}${requestUri}`, {
      headers: {
        Authorization: signed.authorization,
        'X-ASSUME-MERCHANT': merchantId,
      },
      timeout: 15000,
    });

    return response.data;
  }

  async confirmOrder(userId: number, merchantPaymentId: string) {
    const paymentDetails = await this.getPaymentDetails(merchantPaymentId);

    return this.paymentsService.confirmPayPayPayment(userId, {
      merchantPaymentId,
      paymentDetails,
    });
  }
}