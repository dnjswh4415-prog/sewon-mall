"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyOrders, cancelOrder } from "@/src/api/orders";
import { deleteReview } from "@/src/api/review";
import DeliveryProgress from "@/src/components/DeliveryProgress";
import PageTopActions from "@/src/components/PageTopActions";

const statusLabelMap: Record<string, string> = {
  PENDING_PAYMENT: "결제대기",
  PAYMENT_COMPLETE: "배송출고",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  RETURNED: "반품완료",
  REFUNDED: "환불완료",
};

const REVIEWABLE_STATUSES = new Set(["SHIPPING", "DELIVERED"]);

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);
  const [reviewDeleteLoadingId, setReviewDeleteLoadingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("주문 목록 조회 실패:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: number) => {
    const ok = confirm("정말 주문을 취소하시겠습니까?");
    if (!ok) return;

    try {
      setCancelLoadingId(orderId);
      await cancelOrder(orderId);
      alert("주문이 취소되었습니다.");
      await fetchOrders();
    } catch (error: any) {
      console.error("주문 취소 실패:", error);
      alert(error?.response?.data?.message || "주문 취소에 실패했습니다.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    const ok = confirm("작성한 리뷰를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      setReviewDeleteLoadingId(reviewId);
      await deleteReview(reviewId);
      alert("리뷰가 삭제되었습니다.");
      await fetchOrders();
    } catch (error: any) {
      console.error("리뷰 삭제 실패:", error);
      alert(error?.response?.data?.message || "리뷰 삭제에 실패했습니다.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-gray-500">
            주문 내역을 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">주문 내역</h1>
          <PageTopActions backFallbackHref="/" />
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-gray-500">
            주문 내역이 없습니다.
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
                      <p className="text-sm text-gray-500">주문번호</p>
                      <p className="font-bold text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>

                      <div className="mt-4 text-sm text-gray-700">
                        총 결제금액:{" "}
                        <span className="font-semibold">
                          {Number(order.totalPrice).toLocaleString()}원
                        </span>
                      </div>

                      {Array.isArray(order.items) && order.items.length > 0 && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500 mb-3">주문 상품</p>

                          <div className="space-y-3">
                            {order.items.map((item: any) => {
                              const review = getReview(item);

                              return (
                                <div
                                  key={item.id}
                                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                                      {item.product?.imageUrl ? (
                                        <img
                                          src={item.product.imageUrl}
                                          alt={item.product?.name || "상품 이미지"}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = "/no-image.png";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                                          이미지 없음
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold truncate">
                                        {item.product?.name}
                                      </p>

                                      <p className="text-sm text-gray-500 mt-1">
                                        {item.quantity}개
                                        {item.variant?.options?.length > 0 &&
                                          ` · ${item.variant.options
                                            .map(
                                              (opt: any) =>
                                                `${opt.value?.option?.name}: ${opt.value?.value}`
                                            )
                                            .join(" / ")}`}
                                      </p>

                                      {review && (
                                        <p className="mt-2 text-sm text-gray-500">
                                          작성한 리뷰 평점: {review.rating}점
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
                                        리뷰 작성
                                      </button>
                                    )}

                                    {review && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleEditReview(review.id)}
                                          className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium"
                                        >
                                          리뷰 수정
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReview(review.id)}
                                          disabled={reviewDeleteLoadingId === review.id}
                                          className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                                        >
                                          {reviewDeleteLoadingId === review.id
                                            ? "삭제 중..."
                                            : "리뷰 삭제"}
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
                        {statusLabelMap[order.status] || order.status}
                      </span>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                        >
                          상세보기
                        </Link>

                        {canCancel && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelLoadingId === order.id}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white disabled:opacity-50"
                          >
                            {cancelLoadingId === order.id
                              ? "취소 처리 중..."
                              : "주문취소"}
                          </button>
                        )}
                      </div>

                      {(order.deliveryCompany || order.trackingNumber) && (
                        <div className="text-sm text-gray-500 text-right">
                          {order.deliveryCompany && <p>택배사: {order.deliveryCompany}</p>}
                          {order.trackingNumber && <p>송장번호: {order.trackingNumber}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}