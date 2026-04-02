"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyOrders, cancelOrder } from "@/src/api/orders";
import DeliveryProgress from "@/src/components/DeliveryProgress";

const statusLabelMap: Record<string, string> = {
  PENDING_PAYMENT: "결제대기",
  PAYMENT_COMPLETE: "배송출고",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  RETURNED: "반품완료",
  REFUNDED: "환불완료",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoadingId, setCancelLoadingId] = useState<number | null>(null);

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">주문 내역</h1>

          <Link
            href="/"
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
          >
            홈으로
          </Link>
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

              const firstItem = order.items?.[0];
              const extraCount = Math.max((order.items?.length || 1) - 1, 0);

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

                      {firstItem && (
                        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-sm text-gray-500 mb-2">주문 상품</p>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                              {firstItem.product?.imageUrl ? (
                                <img
                                  src={firstItem.product.imageUrl}
                                  alt={firstItem.product?.name || "상품 이미지"}
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
                                {firstItem.product?.name}
                                {extraCount > 0 && ` 외 ${extraCount}건`}
                              </p>

                              <p className="text-sm text-gray-500 mt-1">
                                {firstItem.quantity}개
                                {firstItem.variant?.options?.length > 0 &&
                                  ` · ${firstItem.variant.options
                                    .map(
                                      (opt: any) =>
                                        `${opt.value?.option?.name}: ${opt.value?.value}`
                                    )
                                    .join(" / ")}`}
                              </p>
                            </div>
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