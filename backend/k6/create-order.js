
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const loginRes = http.post(
    'http://localhost:5000/api/auth/login',
    JSON.stringify({
      email: 'test1@test.com',
      password: '1234',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const token = loginRes.json('token'); // 실제 응답 키에 맞게 수정

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  http.get('http://localhost:5000/api/cart', params);
  http.get('http://localhost:5000/api/orders', params);

  sleep(1);
}