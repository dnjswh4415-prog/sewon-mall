"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyOrders, cancelOrder } from "@/src/api/orders";
import { deleteReview } from "@/src/api/review";
import DeliveryProgress from "@/src/components/DeliveryProgress";
import PageTopActions from "@/src/components/PageTopActions";
import { useJapanesePageTranslation } from "@/src/hooks/useJapanesePageTranslation";
const API_BASE_URL = "http://localhost:5000";

const normalizeImageUrl = (url?: string | null) => {
  if (!url) return "/no-image.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
};

const statusLabelMap = {
  ko: {
    PENDING_PAYMENT: "결제대기",
    PAYMENT_COMPLETE: "배송출고",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELLED: "주문취소",
    RETURNED: "반품완료",
    REFUNDED: "환불완료",
  },
  ja: {
    PENDING_PAYMENT: "決済待機",
    PAYMENT_COMPLETE: "発送準備",
    SHIPPING: "配送中",
    DELIVERED: "配送完了",
    CANCELLED: "注文キャンセル",
    RETURNED: "返品完了",
    REFUNDED: "返金完了",
  },
} as const;

const pageText = {
  ko: {
    title: "주문 내역",
    loading: "주문 내역을 불러오는 중입니다...",
    empty: "주문 내역이 없습니다.",
    orderNumber: "주문번호",
    orderItems: "주문 상품",
    totalPrice: "총 결제금액",
    reviewWrite: "리뷰 작성",
    reviewEdit: "리뷰 수정",
    reviewDelete: "리뷰 삭제",
    reviewDeleting: "삭제 중...",
    reviewScore: "작성한 리뷰 평점",
    detail: "상세보기",
    cancel: "주문취소",
    cancelLoading: "취소 처리 중...",
    noImage: "이미지 없음",
    searchPlaceholder: "주문번호, 상품명, 옵션명 검색",
    search: "조회",
    reset: "초기화",
    periodAll: "전체 기간",
    period1m: "1개월 이내",
    period3m: "3개월 이내",
    period6m: "6개월 이내",
    recentFilter: "최근 조회 기준",
    totalCount: "총",
    countUnit: "건",
    quantityUnit: "개",
    carrier: "택배사",
    trackingNumber: "송장번호",
    previous: "이전",
    next: "다음",
    confirmCancel: "정말 주문을 취소하시겠습니까?",
    cancelSuccess: "주문이 취소되었습니다.",
    cancelFail: "주문 취소에 실패했습니다.",
    confirmDeleteReview: "작성한 리뷰를 삭제하시겠습니까?",
    deleteReviewSuccess: "리뷰가 삭제되었습니다.",
    deleteReviewFail: "리뷰 삭제에 실패했습니다.",
  },
  ja: {
    title: "注文履歴",
    loading: "注文履歴を読み込み中です...",
    empty: "注文履歴がありません。",
    orderNumber: "注文番号",
    orderItems: "注文商品",
    totalPrice: "合計決済金額",
    reviewWrite: "レビュー作成",
    reviewEdit: "レビュー修正",
    reviewDelete: "レビュー削除",
    reviewDeleting: "削除中...",
    reviewScore: "作成したレビュー評価",
    detail: "詳細を見る",
    cancel: "注文キャンセル",
    cancelLoading: "キャンセル処理中...",
    noImage: "画像なし",
    searchPlaceholder: "注文番号、商品名、オプション名で検索",
    search: "照会",
    reset: "初期化",
    periodAll: "全期間",
    period1m: "1か月以内",
    period3m: "3か月以内",
    period6m: "6か月以内",
    recentFilter: "最近の照会基準",
    totalCount: "合計",
    countUnit: "件",
    quantityUnit: "個",
    carrier: "配送会社",
    trackingNumber: "追跡番号",
    previous: "前へ",
    next: "次へ",
    confirmCancel: "本当に注文をキャンセルしますか？",
    cancelSuccess: "注文がキャンセルされました。",
    cancelFail: "注文キャンセルに失敗しました。",
    confirmDeleteReview: "作成したレビューを削除しますか？",
    deleteReviewSuccess: "レビューが削除されました。",
    deleteReviewFail: "レビュー削除に失敗しました。",
  },
} as const;

const REVIEWABLE_STATUSES = new Set(["SHIPPING", "DELIVERED"]);
const PAGE_SIZE = 20;

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);
  const [reviewDeleteLoadingId, setReviewDeleteLoadingId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [periodInput, setPeriodInput] = useState<"all" | "1m" | "3m" | "6m">("all");

  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedPeriod, setAppliedPeriod] = useState<"all" | "1m" | "3m" | "6m">("all");

  const translationItems = useMemo(() => {
    return orders.flatMap((order: any) =>
      (order.items || []).flatMap((item: any) => {
        const optionItems =
          item?.variant?.options?.flatMap((opt: any) => [
            {
              key: `order-option-name-${item.id}-${opt?.value?.option?.id ?? opt?.id}`,
              text: opt?.value?.option?.name || "",
            },
            {
              key: `order-option-value-${item.id}-${opt?.value?.id ?? opt?.id}`,
              text: opt?.value?.value || "",
            },
          ]) ?? [];

        return [
          {
            key: `order-product-name-${item.id}-${item?.product?.id ?? "unknown"}`,
            text: item?.product?.name || "",
          },
          ...optionItems,
        ];
      })
    );
  }, [orders]);

  const {
    language,
    mounted,
    translating,
    getText,
    handleToggleLanguage,
  } = useJapanesePageTranslation({
    items: translationItems,
  });

  const t = pageText[language];
  const statusText = statusLabelMap[language];

  const fetchOrders = async (nextPage = page) => {
    try {
      setLoading(true);

      const data = await getMyOrders({
        page: nextPage,
        pageSize: PAGE_SIZE,
        period: appliedPeriod,
        keyword: appliedKeyword,
      });

      setOrders(Array.isArray(data?.items) ? data.items : []);
      setPage(Number(data?.page ?? nextPage));
      setTotalPages(Math.max(1, Number(data?.totalPages ?? 1)));
      setTotalCount(Number(data?.totalCount ?? 0));
    } catch (error) {
      console.error("주문 목록 조회 실패:", error);
      setOrders([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page, appliedKeyword, appliedPeriod]);

  const handleSearch = () => {
    setPage(1);
    setAppliedKeyword(searchInput.trim());
    setAppliedPeriod(periodInput);
  };

  const handleReset = () => {
    setSearchInput("");
    setPeriodInput("all");
    setPage(1);
    setAppliedKeyword("");
    setAppliedPeriod("all");
  };

  const handleCancel = async (orderId: number) => {
    const ok = confirm(t.confirmCancel);
    if (!ok) return;

    try {
      setCancelLoadingId(orderId);
      await cancelOrder(orderId);
      alert(t.cancelSuccess);
      await fetchOrders(page);
    } catch (error: any) {
      console.error("주문 취소 실패:", error);
      alert(error?.response?.data?.message || t.cancelFail);
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    const ok = confirm(t.confirmDeleteReview);
    if (!ok) return;

    try {
      setReviewDeleteLoadingId(reviewId);
      await deleteReview(reviewId);
      alert(t.deleteReviewSuccess);
      await fetchOrders(page);
    } catch (error: any) {
      console.error("리뷰 삭제 실패:", error);
      alert(error?.response?.data?.message || t.deleteReviewFail);
    } finally {
      setReviewDeleteLoadingId(null);
    }
  };

  const hasReview = (item: any) => {
    return Array.isArray(item?.reviews) && item.reviews.length > 0;
  };

  const getReview = (item: any) => {
    return Array.isArray(item?.reviews) && item.reviews.length > 0
      ? item.reviews[0]
      : null;
  };

  const canWriteReview = (order: any, item: any) => {
    return REVIEWABLE_STATUSES.has(order?.status) && !hasReview(item);
  };

  const handleWriteReview = (orderItemId: number) => {
    router.push(`/reviews/write?orderItemId=${orderItemId}`);
  };

  const handleEditReview = (reviewId: number) => {
    router.push(`/reviews/edit/${reviewId}`);
  };

  const pageNumbers = useMemo(() => {
    const windowSize = 5;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, idx) => adjustedStart + idx
    );
  }, [page, totalPages]);

  const periodLabel =
    appliedPeriod === "1m"
      ? t.period1m
      : appliedPeriod === "3m"
      ? t.period3m
      : appliedPeriod === "6m"
      ? t.period6m
      : t.periodAll;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-gray-500">
            {pageText.ko.loading}
          </div>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-gray-500">
            {t.loading}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t.recentFilter}: {periodLabel} / {t.totalCount} {totalCount}
              {t.countUnit}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLanguage}
              disabled={translating}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {translating ? "번역 중..." : language === "ja" ? "한국어" : "日本語"}
            </button>
            <PageTopActions backFallbackHref="/" />
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="rounded-xl border border-gray-300 px-4 py-3"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <select
              value={periodInput}
              onChange={(e) =>
                setPeriodInput(e.target.value as "all" | "1m" | "3m" | "6m")
              }
              className="rounded-xl border border-gray-300 px-4 py-3"
            >
              <option value="all">{t.periodAll}</option>
              <option value="1m">{t.period1m}</option>
              <option value="3m">{t.period3m}</option>
              <option value="6m">{t.period6m}</option>
            </select>

            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-black px-5 py-3 text-white font-medium"
            >
              {t.search}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-gray-300 px-5 py-3 font-medium"
            >
              {t.reset}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            {t.loading}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const canCancel =
                order.status === "PAYMENT_COMPLETE" || order.status === "SHIPPING";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{t.orderNumber}</p>
                      <p className="font-bold text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>

                      <div className="mt-4 text-sm text-gray-700">
                        {t.totalPrice}:{" "}
                        <span className="font-semibold">
                          {Number(order.totalPrice).toLocaleString()}원
                        </span>
                      </div>

                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500 mb-3">{t.orderItems}</p>

                          <div className="space-y-3">
                            {order.items.map((item: any) => {
                              const review = getReview(item);
                              const productName = getText(
                                `order-product-name-${item.id}-${item?.product?.id ?? "unknown"}`,
                                item.product?.name
                              );

                              return (
                                <div
                                  key={item.id}
                                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                                      {item.product?.imageUrl ? (
                                      <img
                                          src={normalizeImageUrl(item.product?.imageUrl)}
                                          alt={item.product?.name || "상품 이미지"}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = "/no-image.png";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                          {t.noImage}
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold truncate">
                                        {productName}
                                      </p>

                                      <p className="text-sm text-gray-500 mt-1">
                                        {item.quantity}
                                        {t.quantityUnit}
                                        {item.variant?.options?.length > 0 &&
                                          ` · ${item.variant.options
                                            .map((opt: any) => {
                                              const optionName = getText(
                                                `order-option-name-${item.id}-${opt?.value?.option?.id ?? opt?.id}`,
                                                opt?.value?.option?.name
                                              );

                                              const optionValue = getText(
                                                `order-option-value-${item.id}-${opt?.value?.id ?? opt?.id}`,
                                                opt?.value?.value
                                              );

                                              return `${optionName}: ${optionValue}`;
                                            })
                                            .join(" / ")}`}
                                      </p>

                                      {review && (
                                        <p className="mt-2 text-sm text-gray-500">
                                          {t.reviewScore}: {review.rating}점
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 md:justify-end">
                                    {canWriteReview(order, item) && (
                                      <button
                                        type="button"
                                        onClick={() => handleWriteReview(item.id)}
                                        className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium"
                                      >
                                        {t.reviewWrite}
                                      </button>
                                    )}

                                    {review && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleEditReview(review.id)}
                                          className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium"
                                        >
                                          {t.reviewEdit}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReview(review.id)}
                                          disabled={reviewDeleteLoadingId === review.id}
                                          className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                                        >
                                          {reviewDeleteLoadingId === review.id
                                            ? t.reviewDeleting
                                            : t.reviewDelete}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <DeliveryProgress status={order.status} />
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-3">
                      <span className="px-3 py-1 rounded-full bg-black text-white text-sm">
                        {statusText[order.status as keyof typeof statusText] || order.status}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                        >
                          {t.detail}
                        </Link>

                        {canCancel && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelLoadingId === order.id}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white disabled:opacity-50"
                          >
                            {cancelLoadingId === order.id
                              ? t.cancelLoading
                              : t.cancel}
                          </button>
                        )}
                      </div>

                      {(order.deliveryCompany || order.trackingNumber) && (
                        <div className="text-sm text-gray-500 text-right">
                          {order.deliveryCompany && <p>{t.carrier}: {order.deliveryCompany}</p>}
                          {order.trackingNumber && (
                            <p>{t.trackingNumber}: {order.trackingNumber}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="rounded-xl border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            {t.previous}
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`rounded-xl px-4 py-2 border ${
                page === pageNumber
                  ? "bg-black text-white border-black"
                  : "bg-white border-gray-300"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-gray-300 px-4 py-2 disabled:opacity-50"
          >
            {t.next}
          </button>
        </div>
      </div>
    </div>
  );
}