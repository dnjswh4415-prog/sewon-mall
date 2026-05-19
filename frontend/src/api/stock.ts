import api from "@/src/api/axios";

export type StockChangeType =
  | "MANUAL_ADJUST"
  | "ORDER_PAID"
  | "ORDER_CANCEL"
  | "REFUND";

export const getStockProducts = async () => {
  const { data } = await api.get("/api/stock/products");
  return data;
};

export const getStockHistory = async (productId?: number) => {
  const { data } = await api.get("/api/stock/history", {
    params: productId ? { productId } : undefined,
  });
  return data;
};

export const getStockProductDetail = async (productId: number) => {
  const { data } = await api.get(`/api/stock/products/${productId}/detail`);
  return data;
};

export const adjustStock = async (payload: {
  productId: number;
  variantId?: number;
  quantity: number;
  changeType: StockChangeType;
  note?: string;
}) => {
  const { data } = await api.post("/api/stock/adjust", payload);
  return data;
};