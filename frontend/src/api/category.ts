import api from "./axios";

export const fetchCategories = async () => {
  const res = await api.get("/api/category");
  return res.data;
};