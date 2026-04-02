import api from "@/src/api/axios";

export const getAdminDashboard = async () => {
  const { data } = await api.get("/api/admin/dashboard");
  return data;
};

export const getAdminProducts = async () => {
  const { data } = await api.get("/api/admin/products");
  return Array.isArray(data) ? data : [];
};

export const getAdminOrders = async () => {
  const { data } = await api.get("/api/admin/orders");
  return Array.isArray(data) ? data : [];
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