"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getNotice, Notice } from "@/src/api/notices";
import { useLanguage } from "@/src/contexts/LanguageContext";

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const { language } = useLanguage();
  const ja = language === "ja";
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) {
      setError("올바르지 않은 게시글 주소입니다.");
      setLoading(false);
      return;
    }
    getNotice(id).then((data) => { if (active) setNotice(data); })
      .catch(() => { if (active) setError("공지사항을 찾을 수 없습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <header className="border-b bg-white"><div className="max-w-5xl mx-auto px-5 h-20 flex items-center justify-between"><Link href="/" className="font-extrabold text-2xl">sewon-mall</Link><Link href="/support" className="text-sm text-gray-600">{ja ? "お知らせ" : "고객센터"}</Link></div></header>
      <main className="max-w-5xl mx-auto px-5 py-12">
        <p className="text-sm font-semibold text-gray-500 tracking-widest">NOTICE</p>
        <h1 className="text-3xl font-bold mt-2">{ja ? "お知らせ" : "공지사항"}</h1>
        <article className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? <p className="p-10 text-gray-500">{ja ? "読み込み中..." : "불러오는 중..."}</p> : error ? <p role="alert" className="p-10 text-red-600">{error}</p> : notice && <>
            <div className="px-6 md:px-10 py-7 border-b">
              <p className="text-sm text-gray-500 mb-3">{notice.category}{notice.isPinned ? " · 필독" : ""}</p>
              <h2 className="text-2xl font-bold break-words">{notice.title}</h2>
              <p className="mt-4 text-sm text-gray-500">{new Date(notice.createdAt).toLocaleDateString(ja ? "ja-JP" : "ko-KR")}</p>
            </div>
            <div className="px-6 md:px-10 py-10 whitespace-pre-wrap break-words leading-8 text-gray-700 min-h-64">{notice.content}</div>
          </>}
        </article>
        <div className="mt-7 flex justify-center"><Link href="/support" className="inline-flex bg-gray-900 text-white px-9 py-3 rounded-lg">{ja ? "一覧へ" : "목록으로"}</Link></div>
      </main>
    </div>
  );
}
