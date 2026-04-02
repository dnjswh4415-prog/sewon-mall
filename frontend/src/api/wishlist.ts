import api from "./axios";

export const getWishlist = async () => {
  const res = await api.get("/api/wishlist");
  return res.data;
};

export const toggleWishlist = async (productId: number) => {
  const res = await api.post("/api/wishlist/toggle", { productId });
  return res.data;
};

export const removeWishlistItem = async (wishlistId: number) => {
  const res = await api.delete(`/api/wishlist/${wishlistId}`);
  return res.data;
};