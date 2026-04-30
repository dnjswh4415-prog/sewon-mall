import api from "./axios";

export async function createPayPayCode(orderId: number) {
  const { data } = await api.post("/api/paypay/create-code", { orderId });
  return data;
}

export async function getPayPayStatus(merchantPaymentId: string) {
  const { data } = await api.get("/api/paypay/status", {
    params: { merchantPaymentId },
  });
  return data;
}

export async function confirmPayPayPayment(merchantPaymentId: string) {
  const { data } = await api.post("/api/paypay/confirm", {
    merchantPaymentId,
  });
  return data;
}