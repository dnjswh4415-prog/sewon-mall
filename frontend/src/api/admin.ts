import api from "@/src/api/axios";

export type AdminOrdersParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type AdminProductsParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  stockFilter?: string;
  categoryId?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const buildQueryString = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const getAdminDashboard = async () => {
  const { data } = await api.get("/api/admin/dashboard");
  return data;
};

export const getAdminProducts = async (params: AdminProductsParams = {}) => {
  const query = buildQueryString(params);
  const { data } = await api.get(`/api/admin/products${query}`);
  return data;
};

export const getAdminProductDetail = async (productId: number) => {
  const { data } = await api.get(`/api/admin/products/${productId}`);
  return data;
};

export const getAdminOrders = async (params: AdminOrdersParams = {}) => {
  const query = buildQueryString(params);
  const { data } = await api.get(`/api/admin/orders${query}`);
  return data;
};

export const updateAdminOrderStatus = async (
  orderId: number,
  status: string
) => {
  const { data } = await api.patch(`/api/admin/orders/${orderId}/status`, {
    status,
  });
  return data;
};

export const getAdminOrderDetail = async (orderId: number) => {
  const { data } = await api.get(`/api/admin/orders/${orderId}`);
  return data;
};

export const getAdminStockSummary = async () => {
  const { data } = await api.get("/api/admin/stock-summary");
  return data;
};