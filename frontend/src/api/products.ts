import api from "@/src/api/axios";

export const fetchProducts = async (params?: {
  categoryId?: number;
  keyword?: string;
}) => {
  const { data } = await api.get("/api/product", { params });
  return data;
};

export const fetchProductById = async (id: number) => {
  const { data } = await api.get(`/api/product/${id}`);
  return data;
};