import api from "@/src/api/axios";

export const getAddresses = async () => {
  const { data } = await api.get("/api/address");
  return data;
};

export const createAddress = async (payload: {
  recipient: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2?: string;
  isDefault?: boolean;
}) => {
  const { data } = await api.post("/api/address", payload);
  return data;
};