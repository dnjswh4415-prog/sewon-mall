import api from "./axios";

export async function fetchProducts(params?: {
  categoryId?: number;
  keyword?: string;
}) {
  const { data } = await api.get("/api/product", {
    params: {
      ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params?.keyword ? { keyword: params.keyword } : {}),
    },
  });

  return data;
}

export async function fetchProductById(id: number) {
  const { data } = await api.get(`/api/product/${id}`);
  return data;
}

export async function recordProductView(id: number) {
  const { data } = await api.post(`/api/product/${id}/view`);
  return data;
}

export async function fetchProductRecommendations(id: number, limit = 8) {
  const { data } = await api.get(`/api/product/${id}/recommendations`, {
    params: { limit },
  });

  return data;
}

export async function fetchMyRecommendations(limit = 8) {
  const { data } = await api.get("/api/product/recommendations/me", {
    params: { limit },
  });

  return data;
}