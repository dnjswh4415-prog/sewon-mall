import api from "@/src/api/axios";

export const confirmPayment = async (payload: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) => {
  const { data } = await api.post("/api/payments/confirm", payload);
  return data;
};