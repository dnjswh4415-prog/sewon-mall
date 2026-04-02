import api from "./axios";

export const getCart = async () => {
  const res = await api.get("/api/cart");
  return res.data;
};

export const addToCart = async (data: {
  productId: number;
  variantId?: number | null;
  quantity: number;
}) => {
  const res = await api.post("/api/cart/add", data);
  return res.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number) => {
  const res = await api.put("/api/cart/update", {
    cartItemId,
    quantity,
  });
  return res.data;
};

export const removeCartItem = async (cartItemId: number) => {
  const res = await api.delete(`/api/cart/${cartItemId}`);
  return res.data;
};