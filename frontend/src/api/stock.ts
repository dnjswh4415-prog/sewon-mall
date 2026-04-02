import api from "@/src/api/axios";

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
  note?: string;
}) => {
  const { data } = await api.post("/api/stock/adjust", payload);
  return data;
};