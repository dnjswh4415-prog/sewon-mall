"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Package, Truck } from "lucide-react";
import { cancelOrder, getOrderDetail } from "@/src/api/orders";
import DeliveryProgress from "@/src/components/DeliveryProgress";

type OrderItemOption = {
  id: number;
  value: {
    id: number;
    value: string;
    option: {
      id: number;
      name: string;
    };
  };
};

type OrderItemVariant = {
  id: number;
  sku: string;
  options?: OrderItemOption[];
};

type OrderItemProduct = {
  id: number;
  name: string;
  imageUrl?: string | null;
};

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: OrderItemProduct;
  variant?: OrderItemVariant | null;
};

type OrderAddress = {
  id: number;
  recipient: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2: string;
};

type Order = {
  id: number;
  orderNumber: string;
  totalPrice: number;
  status: string;
  paymentKey?: string | null;
  paidAt?: string | null;
  deliveryCompany?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  address?: OrderAddress | null;
  items: OrderItem[];
};

const statusLabelMap: Record<string, string> = {
  PENDING_PAYMENT: "결제대기",
  PAYMENT_COMPLETE: "배송출고",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  RETURNED: "반품완료",
  REFUNDED: "환불완료",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const found = await getOrderDetail(orderId);
        setOrder(found || null);
      } catch (error) {
        console.error("주문 상세 조회 실패:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const statusLabel = useMemo(() => {
    if (!order) return "";
    return statusLabelMap[order.status] || order.status;
  }, [order]);

  const canCancel =
    order?.status === "PAYMENT_COMPLETE" || order?.status === "SHIPPING";

  const handleCancel = async () => {
    if (!order) return;

    const ok = confirm("정말 주문을 취소하시겠습니까?");
    if (!ok) return;

    try {
      setCancelLoading(true);
      await cancelOrder(order.id);
      alert("주문이 취소되었습니다.");

      const refreshed = await getOrderDetail(order.id);
      setOrder(refreshed);
    } catch (error: any) {
      console.error("주문 취소 실패:", error);
      alert(error?.response?.data?.message || "주문 취소에 실패했습니다.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">주문 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">주문 정보를 찾을 수 없습니다.</p>
          <Link
            href="/orders"
            className="inline-flex px-4 py-2 rounded-xl bg-black text-white"
          >
            주문 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            뒤로가기
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Home size={18} />
            홈으로
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">주문번호</p>
                  <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                  <p className="text-sm text-gray-500 mt-2">
                    주문일시: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-full bg-black text-white text-sm font-semibold w-fit">
                  {statusLabel}
                </div>
              </div>
               <DeliveryProgress status={order.status} />
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-5">주문 상품</h2>

              <div className="space-y-4">
                {order.items.map((item) => {
                  const optionText =
                    item.variant?.options?.length
                      ? item.variant.options
                          .map(
                            (opt: OrderItemOption) =>
                              `${opt.value.option.name}: ${opt.value.value}`
                          )
                          .join(" / ")
                      : "";

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-2xl p-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
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

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base">
                            {item.product?.name}
                          </div>

                          {optionText && (
                            <div className="text-sm text-gray-500 mt-1">
                              {optionText}
                            </div>
                          )}

                          {item.variant?.sku && (
                            <div className="text-xs text-gray-400 mt-1">
                              SKU: {item.variant.sku}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>수량 {item.quantity}개</span>
                            <span>
                              상품금액 {Number(item.price).toLocaleString()}원
                            </span>
                          </div>

                          <div className="mt-2 text-lg font-bold">
                            {(Number(item.price) * Number(item.quantity)).toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-5">결제 정보</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">주문 상태</span>
                  <span className="font-semibold">{statusLabel}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">총 결제금액</span>
                  <span className="font-semibold">
                    {Number(order.totalPrice).toLocaleString()}원
                  </span>
                </div>

                {order.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">결제 완료일</span>
                    <span className="font-semibold">
                      {new Date(order.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {order.paymentKey && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-500 mb-1">결제키</p>
                    <p className="text-xs break-all text-gray-700">
                      {order.paymentKey}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-5">배송 정보</h2>

              {order.address ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">수령인</p>
                    <p className="font-semibold">{order.address.recipient}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">연락처</p>
                    <p className="font-semibold">{order.address.phone}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">배송지</p>
                    <p className="font-semibold">
                      ({order.address.zipcode}) {order.address.address1}{" "}
                      {order.address.address2}
                    </p>
                  </div>

                  {(order.deliveryCompany || order.trackingNumber) && (
                    <div className="pt-3 border-t border-gray-100">
                      {order.deliveryCompany && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500">택배사</span>
                          <span className="font-semibold">
                            {order.deliveryCompany}
                          </span>
                        </div>
                      )}

                      {order.trackingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">송장번호</span>
                          <span className="font-semibold">
                            {order.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">배송지 정보가 없습니다.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} />
                <h2 className="text-lg font-bold">빠른 이동</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/orders"
                  className="h-12 rounded-2xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  주문 목록으로
                </Link>

                <Link
                  href="/cart"
                  className="h-12 rounded-2xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  장바구니로
                </Link>

                <Link
                  href="/"
                  className="h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:opacity-90"
                >
                  홈으로
                </Link>

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="h-12 rounded-2xl bg-red-500 text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {cancelLoading ? "취소 처리 중..." : "주문취소"}
                  </button>
                )}
              </div>

              {(order.status === "SHIPPING" || order.status === "DELIVERED") && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Truck size={16} />
                  배송 상태가 업데이트되고 있습니다.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}