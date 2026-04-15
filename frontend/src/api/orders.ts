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

export const getMyOrders = async (params?: {
  page?: number;
  pageSize?: number;
  period?: "all" | "1m" | "3m" | "6m";
  keyword?: string;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.period) searchParams.set("period", params.period);
  if (params?.keyword?.trim()) searchParams.set("keyword", params.keyword.trim());

  const query = searchParams.toString();
  const { data } = await api.get(`/api/orders${query ? `?${query}` : ""}`);
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