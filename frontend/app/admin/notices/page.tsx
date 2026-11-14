"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createNotice, deleteNotice, getAdminNotices, Notice, NoticeInput, updateNotice,
} from "@/src/api/notices";

const blank: NoticeInput = {
  title: "", content: "", category: "공지사항", isPinned: false, isPublished: true,
};

export default function AdminNoticesPage() {
  const [records, setRecords] = useState<Notice[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NoticeInput>({ ...blank });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminNotices(page);
      setRecords(res.items);
      setTotal(res.total);
    } catch {
      setError("관리자 권한으로 로그인한 후 다시 접속해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const reset = () => { setEditingId(null); setForm({ ...blank }); };
  const select = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title, content: notice.content, category: notice.category,
      isPinned: notice.isPinned, isPublished: notice.isPublished,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, title: form.title.trim(), content: form.content.trim() };
      if (editingId === null) {
        await createNotice(payload);
        setPage(1);
      } else {
        await updateNotice(editingId, payload);
      }
      reset();
      await load();
    } catch {
      setError("저장하지 못했습니다. 로그인 상태와 서버 연결을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) return;
    setError("");
    try {
      await deleteNotice(id);
      if (editingId === id) reset();
      if (records.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch {
      setError("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-5 md:p-10">
      <div className="max-w-5xl mx-auto space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm text-gray-500">SEWON-MALL ADMIN</p><h1 className="mt-1 text-3xl font-bold">공지사항 관리</h1></div>
          <div className="flex gap-3 text-sm"><Link href="/admin" className="border px-4 py-2 rounded-lg bg-white">관리자 홈</Link><Link href="/support" className="border px-4 py-2 rounded-lg bg-white">고객센터 보기</Link></div>
        </div>
        {error && <p role="alert" className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">{error}</p>}
        <form onSubmit={save} className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{editingId === null ? "새 공지 등록" : "공지 수정 #" + editingId}</h2>
            {editingId !== null && <button type="button" onClick={reset} className="text-sm underline">새 글 작성</button>}
          </div>
          <label className="block text-sm font-medium">제목
            <input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-lg border p-3" placeholder="공지 제목을 입력하세요"/>
          </label>
          <label className="block text-sm font-medium">분류
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-lg border p-3">
              <option>공지사항</option><option>서비스 안내</option><option>이용 안내</option>
            </select>
          </label>
          <label className="block text-sm font-medium">내용
            <textarea required maxLength={20000} rows={9} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-2 w-full rounded-lg border p-3 leading-7" placeholder="공지 내용을 입력하세요"/>
          </label>
          <div className="flex gap-6 flex-wrap text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}/>상단 고정</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}/>공개</label>
          </div>
          <button type="submit" disabled={saving} className="rounded-lg bg-black text-white px-6 py-3 disabled:opacity-50">{saving ? "저장 중..." : editingId === null ? "공지 등록" : "변경사항 저장"}</button>
        </form>
        <section className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b"><h2 className="font-bold">등록된 공지사항 ({total})</h2></div>
          {loading ? <p className="p-8 text-gray-500">불러오는 중...</p> : records.length === 0 ? <p className="p-8 text-gray-500">등록된 공지가 없습니다.</p> :
            records.map((notice) => <div key={notice.id} className="px-6 py-5 border-b last:border-0 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold break-words">{notice.title} {notice.isPinned && <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded">고정</span>}</p>
                <p className="mt-2 text-sm text-gray-500">{notice.category} / {notice.isPublished ? "공개" : "비공개"} / {new Date(notice.createdAt).toLocaleDateString("ko-KR")}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => select(notice)} className="px-4 py-2 rounded-lg border text-sm">수정</button>
                <button onClick={() => remove(notice.id)} className="px-4 py-2 rounded-lg border text-sm text-red-600">삭제</button>
              </div>
            </div>)}
          {total > 10 && <div className="flex justify-center gap-5 p-5 text-sm">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:opacity-30">이전</button>
            <span>{page} / {Math.ceil(total / 10)}</span>
            <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(page + 1)} className="disabled:opacity-30">다음</button>
          </div>}
        </section>
      </div>
    </div>
  );
}
