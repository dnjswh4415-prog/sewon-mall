import api from "./axios";

export const signupUser = async (data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) => {
  const res = await api.post("/api/auth/signup", data);
  return res.data;
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
};

export const checkEmailExists = async (email: string) => {
  const res = await api.get("/api/auth/check-email", {
    params: { email },
  });
  return res.data;
};

export const findEmail = async (data: { name: string; phone: string }) => {
  const res = await api.post("/api/auth/find-email", data);
  return res.data;
};

export const resetPassword = async (data: {
  email: string;
  name: string;
  phone: string;
  newPassword: string;
}) => {
  const res = await api.post("/api/auth/reset-password", data);
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get("/api/auth/profile");
  return res.data;
};

export const logoutUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};