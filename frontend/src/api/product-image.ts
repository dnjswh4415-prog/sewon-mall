import api from "@/src/api/axios";

export const uploadMainProductImage = async (
  productId: number,
  file: File,
) => {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await api.post(
    `/api/product-images/upload/main/${productId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const uploadSubProductImages = async (
  productId: number,
  files: File[],
  sortOrder = 1,
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  formData.append("sortOrder", String(sortOrder));

  const { data } = await api.post(
    `/api/product-images/upload/sub/${productId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const getProductImages = async (productId: number) => {
  const { data } = await api.get(`/api/product-images/product/${productId}`);
  return data;
};

export const setMainProductImage = async (
  productId: number,
  imageId: number,
) => {
  const { data } = await api.patch(
    `/api/product-images/${imageId}/main/${productId}`
  );
  return data;
};

export const deleteProductImage = async (imageId: number) => {
  const { data } = await api.delete(`/api/product-images/${imageId}`);
  return data;
};