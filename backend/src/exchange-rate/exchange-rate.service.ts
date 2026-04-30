import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

type JpyRateInfo = {
  currency: 'JPY';
  baseUnit: number; // 보통 100
  krwPerBaseUnit: number; // 예: 928.73 (100엔당 원화)
  searchDate: string; // yyyyMMdd
  fetchedAt: string; // ISO
  raw: any;
};

@Injectable()
export class ExchangeRateService {
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
    parseTagValue: true,
  });

  private getConfig() {
    const authKey = (process.env.KOREA_EXIM_AUTH_KEY ?? '')
      .trim()
      .replace(/^["']|["']$/g, '');

    const baseUrl = (
      process.env.KOREA_EXIM_BASE_URL ??
      'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'
    )
      .trim()
      .replace(/^["']|["']$/g, '');

    if (!authKey) {
      throw new BadRequestException('KOREA_EXIM_AUTH_KEY가 없습니다.');
    }

    return { authKey, baseUrl };
  }

  private getKstDateString(date: Date) {
    const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private parseNumeric(value: unknown) {
    const cleaned = String(value ?? '')
      .replace(/,/g, '')
      .trim();

    const num = Number(cleaned);

    if (!Number.isFinite(num)) {
      throw new BadRequestException(`환율 숫자 파싱 실패: ${value}`);
    }

    return num;
  }

  private normalizeItems(raw: string): any[] {
    const trimmed = raw.trim();

    // 1) JSON 배열/객체 우선 시도
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.items)) return parsed.items;
      if (Array.isArray(parsed?.item)) return parsed.item;
      if (parsed?.items?.item) {
        return Array.isArray(parsed.items.item)
          ? parsed.items.item
          : [parsed.items.item];
      }

      return [parsed];
    }

    // 2) XML fallback
    const parsedXml = this.parser.parse(trimmed);

    const candidates = [
      parsedXml?.items?.item,
      parsedXml?.response?.items?.item,
      parsedXml?.response?.body?.items?.item,
      parsedXml?.body?.items?.item,
      parsedXml?.item,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
      if (candidate) return [candidate];
    }

    return [];
  }

  private findJpyItem(items: any[]) {
    return items.find((item) => {
      const curUnit = String(item?.cur_unit ?? item?.CUR_UNIT ?? '').toUpperCase();
      return curUnit.includes('JPY');
    });
  }

  async getLatestJpyRate() {
    const { authKey, baseUrl } = this.getConfig();

    // 주말/공휴일 대응용: 오늘부터 최대 7일 전까지 뒤로 탐색
    for (let back = 0; back < 7; back += 1) {
      const date = new Date(Date.now() - back * 24 * 60 * 60 * 1000);
      const searchDate = this.getKstDateString(date);

      const url =
        `${baseUrl}?authkey=${encodeURIComponent(authKey)}` +
        `&searchdate=${searchDate}` +
        `&data=AP01`;

      const response = await axios.get(url, {
        responseType: 'text',
        timeout: 10000,
      });

      const items = this.normalizeItems(response.data);

      if (!items.length) continue;

      const jpy = this.findJpyItem(items);

      if (!jpy) continue;

      const curUnit = String(jpy?.cur_unit ?? jpy?.CUR_UNIT ?? '');
      const dealBasR = this.parseNumeric(jpy?.deal_bas_r ?? jpy?.DEAL_BAS_R);
      const baseUnit = curUnit.includes('(100)') ? 100 : 1;

      return {
        currency: 'JPY' as const,
        baseUnit,
        krwPerBaseUnit: dealBasR,
        searchDate,
        fetchedAt: new Date().toISOString(),
        raw: jpy,
      };
    }

    throw new BadRequestException('JPY 환율 정보를 찾을 수 없습니다.');
  }

  getKrwPerOneJpy(rate: JpyRateInfo) {
    return rate.krwPerBaseUnit / rate.baseUnit;
  }

  convertKrwToJpy(
    krwAmount: number,
    options?: {
      bufferPercent?: number; // 예: 2 => 2%
      roundupUnit?: number; // 예: 10 => 10엔 단위 올림
    },
    rate?: JpyRateInfo,
  ) {
    if (!Number.isFinite(Number(krwAmount)) || Number(krwAmount) <= 0) {
      throw new BadRequestException('KRW 금액이 올바르지 않습니다.');
    }

    if (!rate) {
      throw new BadRequestException('환율 정보가 없습니다.');
    }

    const bufferPercent = Number(options?.bufferPercent ?? 0);
    const roundupUnit = Math.max(1, Number(options?.roundupUnit ?? 10));

    const krwPerOneJpy = this.getKrwPerOneJpy(rate);
    const rawJpy = Number(krwAmount) / krwPerOneJpy;
    const bufferedJpy = rawJpy * (1 + bufferPercent / 100);
    const roundedJpy = Math.ceil(bufferedJpy / roundupUnit) * roundupUnit;

    return {
      sourceCurrency: 'KRW' as const,
      sourceAmount: Number(krwAmount),
      targetCurrency: 'JPY' as const,
      targetAmount: roundedJpy,
      rawTargetAmount: rawJpy,
      bufferedTargetAmount: bufferedJpy,
      appliedBufferPercent: bufferPercent,
      roundupUnit,
      rate,
    };
  }

  async convertLatestKrwToJpy(
    krwAmount: number,
    options?: {
      bufferPercent?: number;
      roundupUnit?: number;
    },
  ) {
    const rate = await this.getLatestJpyRate();
    return this.convertKrwToJpy(krwAmount, options, rate);
  }
}