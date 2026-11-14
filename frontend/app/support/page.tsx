"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { getNotices, Notice, NoticeList } from "@/src/api/notices";
import { useLanguage } from "@/src/contexts/LanguageContext";

export default function SupportPage() {
  const { language } = useLanguage();
  const ja = language === "ja";
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NoticeList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getNotices(page, search)
      .then((res) => { if (active) setData(res); })
      .catch(() => { if (active) setError(ja ? "お知らせを読み込めませんでした。" : "공지사항을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, ja]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(query.trim());
  };
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 10)));
  const formatDate = (value: string) => new Date(value).toLocaleDateString(ja ? "ja-JP" : "ko-KR");

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">sewon-mall</Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-black">{ja ? "ショップに戻る" : "쇼핑몰로 돌아가기"}</Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 py-12 md:py-16">
        <p className="text-sm font-semibold text-gray-500 tracking-widest">CUSTOMER CENTER</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">{ja ? "カスタマーセンター" : "고객센터"}</h1>
        <p className="mt-3 text-gray-500">{ja ? "サービスについてのお知らせをご案内します。" : "세원몰의 서비스 소식과 이용 안내를 확인하실 수 있습니다."}</p>
        <section className="mt-9 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <Megaphone size={22} className="mt-1 shrink-0" />
            <div>
              <h2 className="font-bold">{ja ? "デモサイトのご案内" : "SEWON-MALL 시연 사이트 안내"}</h2>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                {ja
                  ? "このサイトは開発・学習用のデモショッピングモールです。実際の商品販売・配送は行っておりません。実際の決済情報や個人情報の入力はお控えください。"
                  : "본 사이트는 개발 및 학습을 위해 제작한 시연용 쇼핑몰입니다. 실제 상품 판매 및 배송을 위한 서비스가 아닙니다. 실제 결제정보와 개인정보 입력은 삼가 주시기 바랍니다."}
              </p>
            </div>
          </div>
        </section>
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold">{ja ? "お知らせ" : "공지사항"} <span className="text-sm font-normal text-gray-500">{data ? data.total : ""}</span></h2>
            <form onSubmit={submit} className="flex w-full sm:w-80">
              <input aria-label={ja ? "お知らせ検索" : "공지사항 검색"} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ja ? "検索語を入力" : "제목 또는 내용 검색"} className="min-w-0 flex-1 h-11 px-4 bg-white border border-gray-300 rounded-l-lg outline-none focus:border-gray-800" />
              <button type="submit" className="px-4 bg-gray-900 text-white rounded-r-lg" aria-label="검색"><Search size={18}/></button>
            </form>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[80px_1fr_130px_110px] gap-3 px-6 py-4 bg-gray-50 border-b text-sm text-gray-500 text-center">
              <span>{ja ? "番号" : "번호"}</span><span>{ja ? "タイトル" : "제목"}</span><span>{ja ? "区分" : "구분"}</span><span>{ja ? "登録日" : "등록일"}</span>
            </div>
            {loading ? <p className="p-12 text-center text-gray-500">{ja ? "読み込み中..." : "공지사항을 불러오는 중입니다..."}</p>
            : error ? <p role="alert" className="p-12 text-center text-red-600">{error}</p>
            : data?.items.length ? data.items.map((notice: Notice) => (
              <Link key={notice.id} href={"/support/" + notice.id} className="grid sm:grid-cols-[80px_1fr_130px_110px] gap-2 sm:gap-3 items-center px-5 sm:px-6 py-5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <span className="hidden sm:block text-sm text-gray-400 text-center">{notice.isPinned ? "공지" : notice.id}</span>
                <span className="font-medium flex flex-wrap items-center gap-2 min-w-0"><span className="break-words">{notice.title}</span>{notice.isPinned && <span className="text-xs font-semibold bg-gray-900 text-white px-2 py-1 rounded">{ja ? "重要" : "필독"}</span>}</span>
                <span className="text-sm text-gray-500 sm:text-center">{notice.category}</span>
                <span className="text-sm text-gray-400 sm:text-center">{formatDate(notice.createdAt)}</span>
              </Link>
            )) : <p className="p-12 text-center text-gray-500">{ja ? "お知らせがありません。" : "등록된 공지사항이 없습니다."}</p>}
          </div>
          {pages > 1 && <nav aria-label="페이지 이동" className="mt-7 flex justify-center items-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 border rounded-lg disabled:opacity-30"><ChevronLeft size={18}/></button>
            <span className="text-sm">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="p-2 border rounded-lg disabled:opacity-30"><ChevronRight size={18}/></button>
          </nav>}
        </section>
      </main>
      <footer className="border-t bg-white py-8 text-center text-xs text-gray-500">© 2026 SEWON-MALL. All rights reserved.</footer>
    </div>
  );
}
