import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  const email = __ENV.TEST_EMAIL || 'wp4415@naver.com';
  const password = __ENV.TEST_PASSWORD || 'dnjswh@12';

  const loginPayload = {
    email,
    password,
  };

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
      responseType: 'text',
    }
  );

  console.log(`[login] status=${loginRes.status}, error=${loginRes.error || 'none'}`);

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.log(`[login] body=${String(loginRes.body).slice(0, 500)}`);
    sleep(1);
    return;
  }

  let token = '';

  try {
    const loginData = loginRes.json();
    token =
      loginData?.token ||
      loginData?.accessToken ||
      loginData?.data?.token ||
      loginData?.data?.accessToken ||
      '';
  } catch (e) {
    console.log(`[login] json parse failed: ${String(e)}`);
    console.log(`[login] raw body=${String(loginRes.body).slice(0, 500)}`);
    sleep(1);
    return;
  }

  if (!token) {
    console.log('[login] 토큰이 없습니다.');
    console.log(`[login] raw body=${String(loginRes.body).slice(0, 500)}`);
    sleep(1);
    return;
  }

  check(loginRes, {
    'login success': (r) => r.status === 200 || r.status === 201,
  });

  const orderPayload = {
    addressId: 1,
    clientOrderKey: `k6-${__VU}-${__ITER}-${Date.now()}`,
    items: [
      {
        productId: 1,
        variantId: 1,
        quantity: 1,
      },
    ],
  };

  console.log(`[order] payload=${JSON.stringify(orderPayload)}`);

  const orderRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify(orderPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: '10s',
      responseType: 'text',
    }
  );

  console.log(`[order] status=${orderRes.status}, error=${orderRes.error || 'none'}`);

  if (orderRes.status !== 200 && orderRes.status !== 201) {
    console.log(`[order] body=${String(orderRes.body).slice(0, 500)}`);
  }

  check(orderRes, {
    'order success': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}