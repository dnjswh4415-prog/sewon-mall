import api from "@/src/api/axios";

export type Notice = {
  id: number;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoticeInput = Pick<Notice, "title" | "content" | "category" | "isPinned" | "isPublished">;
export type NoticeList = { items: Notice[]; total: number; page: number; pageSize: number };

export async function getNotices(page = 1, search = ""): Promise<NoticeList> {
  const { data } = await api.get("/api/notices", { params: { page, search } });
  return data;
}

export async function getNotice(id: number): Promise<Notice> {
  const { data } = await api.get("/api/notices/" + id);
  return data;
}

export async function getAdminNotices(page = 1, search = ""): Promise<NoticeList> {
  const { data } = await api.get("/api/notices/admin", { params: { page, search } });
  return data;
}

export async function createNotice(payload: NoticeInput): Promise<Notice> {
  const { data } = await api.post("/api/notices", payload);
  return data;
}

export async function updateNotice(id: number, payload: Partial<NoticeInput>): Promise<Notice> {
  const { data } = await api.patch("/api/notices/" + id, payload);
  return data;
}

export async function deleteNotice(id: number): Promise<void> {
  await api.delete("/api/notices/" + id);
}
