import api from "@/src/api/axios";

export const createOrder = async (payload: {
  items: {
    productId: number;
    variantId?: number | null;
    quantity: number;
  }[];
  addressId: number;
  clientOrderKey: string;
}) => {
  const { data } = await api.post("/api/orders", payload);
  return data;
};

export const getMyOrders = async () => {
  const { data } = await api.get("/api/orders");
  return data;
};

export const getOrderDetail = async (orderId: number) => {
  const { data } = await api.get(`/api/orders/${orderId}`);
  return data;
};

export const cancelOrder = async (orderId: number) => {
  const { data } = await api.patch(`/api/orders/${orderId}/cancel`);
  return data;
};