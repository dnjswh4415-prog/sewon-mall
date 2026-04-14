import api from "@/src/api/axios";

export const translateText = async (payload: {
  text: string;
  direction: "koToJa" | "jaToKo";
}) => {
  const { data } = await api.post("/api/translate", payload);
  return data;
};