import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
};

const BASE_URL = 'http://localhost:5000/api';

function logFail(name, res, limit = 300) {
  console.log(
    `[${name}] status=${res.status}, error=${res.error || 'none'}, body=${String(
      res.body
    ).slice(0, limit)}`
  );
}

export default function () {
  const email = __ENV.TEST_EMAIL || 'wp4415@naver.com';
  const password = __ENV.TEST_PASSWORD || 'dnjswh@12';

  const productId = Number(__ENV.TEST_PRODUCT_ID || 1);
  const variantId = Number(__ENV.TEST_VARIANT_ID || 1);
  const addressId = Number(__ENV.TEST_ADDRESS_ID || 1);

  // 1. 상품 목록 조회
  const productsRes = http.get(`${BASE_URL}/product`, {
    timeout: '10s',
    responseType: 'text',
  });

  check(productsRes, {
    'products success': (r) => r.status === 200,
  });

  if (productsRes.status !== 200) {
    logFail('products', productsRes);
  }

  // 2. 카테고리 조회
  const categoriesRes = http.get(`${BASE_URL}/category`, {
    timeout: '10s',
    responseType: 'text',
  });

  check(categoriesRes, {
    'categories success': (r) => r.status === 200,
  });

  if (categoriesRes.status !== 200) {
    logFail('categories', categoriesRes);
  }

  // 3. 상품 상세 조회
  const productDetailRes = http.get(`${BASE_URL}/product/${productId}`, {
    timeout: '10s',
    responseType: 'text',
  });

  check(productDetailRes, {
    'product detail success': (r) => r.status === 200,
  });

  if (productDetailRes.status !== 200) {
    logFail('product-detail', productDetailRes);
  }

  // 4. 로그인
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email,
      password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
      responseType: 'text',
    }
  );

  check(loginRes, {
    'login success': (r) => r.status === 200 || r.status === 201,
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    logFail('login', loginRes);
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
    console.log(`[login] raw body=${String(loginRes.body).slice(0, 300)}`);
    sleep(1);
    return;
  }

  if (!token) {
    console.log(`[login] token not found, body=${String(loginRes.body).slice(0, 300)}`);
    sleep(1);
    return;
  }

  // 5. 주문 생성
  const orderPayload = {
    addressId,
    clientOrderKey: `k6-mixed-${__VU}-${__ITER}-${Date.now()}`,
    items: [
      {
        productId,
        variantId,
        quantity: 1,
      },
    ],
  };

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

  check(orderRes, {
    'order success': (r) => r.status === 200 || r.status === 201,
  });

  if (orderRes.status !== 200 && orderRes.status !== 201) {
    logFail('order', orderRes, 500);
  }

  sleep(1);
}