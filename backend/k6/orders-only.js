import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  const token = __ENV.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoid3A0NDE1QG5hdmVyLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3NTg5MDk0OSwiZXhwIjoxNzc1ODk0NTQ5fQ.f-BLJqCQQ0gzFKgeILBDpEHjh3qXpCtuMzw3PKJ0vvs';

  if (!token) {
    console.log('TEST_TOKEN 이 없습니다.');
    sleep(1);
    return;
  }

  const payload = {
    addressId: 1,
    clientOrderKey: `k6-order-${__VU}-${__ITER}-${Date.now()}`,
    items: [
      {
        productId: 1,
        variantId: 1,
        quantity: 1,
      },
    ],
  };

  const orderRes = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify(payload),
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