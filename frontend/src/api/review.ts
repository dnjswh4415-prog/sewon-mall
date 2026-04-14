import api from "@/src/api/axios";

export const createReview = async (payload: {
  orderItemId: number;
  rating: number;
  comment: string;
}) => {
  const { data } = await api.post("/api/reviews", payload);
  return data;
};

export const getMyReview = async (reviewId: number) => {
  const { data } = await api.get(`/api/reviews/${reviewId}`);
  return data;
};

export const updateReview = async (
  reviewId: number,
  payload: {
    rating?: number;
    comment?: string;
  }
) => {
  const { data } = await api.patch(`/api/reviews/${reviewId}`, payload);
  return data;
};

export const deleteReview = async (reviewId: number) => {
  const { data } = await api.delete(`/api/reviews/${reviewId}`);
  return data;
};

export const getProductReviews = async (productId: number) => {
  const { data } = await api.get(`/api/reviews/product/${productId}`);
  return data;
};

export const getProductRating = async (productId: number) => {
  const { data } = await api.get(`/api/reviews/product/${productId}/rating`);
  return data;
};