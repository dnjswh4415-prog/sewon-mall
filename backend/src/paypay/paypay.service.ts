import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { buildPayPayAuthHeader } from './paypay-sign';

@Injectable()
export class PayPayService {
  private getConfig() {
    const apiKey = (process.env.PAYPAY_API_KEY ?? "").trim().replace(/^["']|["']$/g, "");
    const apiSecret = (process.env.PAYPAY_API_SECRET ?? "").trim().replace(/^["']|["']$/g, "");
    const merchantId = (process.env.PAYPAY_MERCHANT_ID ?? "").trim().replace(/^["']|["']$/g, "");
    const baseUrl = (process.env.PAYPAY_BASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
    const redirectUrl = (process.env.PAYPAY_REDIRECT_URL ?? "").trim().replace(/^["']|["']$/g, "");
    if (!apiKey || !apiSecret || !merchantId || !baseUrl || !redirectUrl) {
      throw new BadRequestException('PayPay 환경변수가 누락되었습니다.');
    }

    return {
      apiKey,
      apiSecret,
      merchantId,
      baseUrl,
      redirectUrl,
    };
  }

  async createCode(params: {
    merchantPaymentId: string;
    amount: number;
    orderDescription: string;
    userAgent?: string;
  }) {
    const { apiKey, apiSecret, merchantId, baseUrl, redirectUrl } =
      this.getConfig();

    const requestUri = '/v2/codes';

    const body = {
      merchantPaymentId: params.merchantPaymentId,
      amount: {
        amount: params.amount,
        currency: 'JPY',
      },
      orderDescription: params.orderDescription,
      codeType: 'ORDER_QR',
      redirectUrl,
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
}