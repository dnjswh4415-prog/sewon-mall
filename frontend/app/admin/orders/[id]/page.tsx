"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getAdminOrderDetail } from "@/src/api/admin";
import PageTopActions from "@/src/components/PageTopActions";

const statusLabelMap: Record<string, string> = {
  PENDING_PAYMENT: "결제대기",
  PAYMENT_COMPLETE: "결제완료",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  RETURNED: "반품완료",
  REFUNDED: "환불완료",
};

const statusBadgeMap: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  PAYMENT_COMPLETE: "bg-blue-100 text-blue-700",
  SHIPPING: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURNED: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-gray-200 text-gray-700",
};

const stockChangeLabelMap: Record<string, string> = {
  ORDER_PAID: "결제 완료 차감",
  CANCEL_RESTORE: "주문 취소 복구",
  RETURN_RESTORE: "반품 복구",
  REFUND_RESTORE: "환불 복구",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getAdminOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      console.error("관리자 주문 상세 조회 실패", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(orderId)) {
      fetchOrder();
    }
  }, [orderId]);

  const stockHistoryMap = useMemo(() => {
    const map = new Map<number, any[]>();
    const histories = Array.isArray(order?.stockHistories)
      ? order.stockHistories
      : [];

    histories.forEach((history: any) => {
      const key = Number(history.orderItemId);
      if (!key) return;

      const prev = map.get(key) ?? [];
      prev.push(history);
      map.set(key, prev);
    });

    return map;
  }, [order]);

  if (loading) {
    return <div className="p-6">주문 상세를 불러오는 중입니다...</div>;
  }

  if (!order) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-lg font-semibold">주문 정보를 찾을 수 없습니다.</div>
        <Link
          href="/admin/orders"
          className="inline-flex rounded-lg border px-4 py-2 text-sm"
        >
          주문 관리로 돌아가기
        </Link>
      </div>
    );
  }

  const totalItemCount = Array.isArray(order.items)
    ? order.items.reduce(
        (sum: number, item: any) => sum + Number(item.quantity ?? 0),
        0
      )
    : 0;

  const payments = Array.isArray(order.payments) ? order.payments : [];
  const cancels = Array.isArray(order.cancels) ? order.cancels : [];
  const returns = Array.isArray(order.returns) ? order.returns : [];
  const refunds = Array.isArray(order.refunds) ? order.refunds : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">주문 상세</h1>
          <p className="mt-1 text-sm text-gray-500">
            주문번호: {order.orderNumber}
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex rounded-lg border px-4 py-2 text-sm"
        >
          주문 관리로 돌아가기
        </Link>
        <PageTopActions backFallbackHref="/admin/orders" />
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">주문 상태</div>
          <div className="mt-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                statusBadgeMap[order.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabelMap[order.status] ?? order.status}
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 주문 금액</div>
          <div className="mt-2 text-2xl font-bold">
            {Number(order.totalPrice ?? 0).toLocaleString()}원
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 상품 수량</div>
          <div className="mt-2 text-2xl font-bold">{totalItemCount}개</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">주문일</div>
          <div className="mt-2 text-sm font-medium">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : "-"}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-2">
        <h2 className="text-lg font-semibold">주문 / 배송 정보</h2>
        <div className="text-sm text-gray-700">
          주문자: {order.user?.name ?? "-"} / 이메일: {order.user?.email ?? "-"}
        </div>
        <div className="text-sm text-gray-700">
          수령인: {order.address?.recipient ?? "-"} / 연락처:{" "}
          {order.address?.phone ?? "-"}
        </div>
        <div className="text-sm text-gray-700">
          우편번호: {order.address?.zipcode ?? "-"}
        </div>
        <div className="text-sm text-gray-700">
          주소: {order.address?.address1 ?? "-"} {order.address?.address2 ?? ""}
        </div>
        <div className="text-sm text-gray-700">
          택배사: {order.deliveryCompany ?? "-"} / 송장번호:{" "}
          {order.trackingNumber ?? "-"}
        </div>
        <div className="text-sm text-gray-700">
          결제키: {order.paymentKey ?? "-"}
        </div>
        <div className="text-sm text-gray-700">
          결제일: {order.paidAt ? new Date(order.paidAt).toLocaleString() : "-"}
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-4">
        <h2 className="text-lg font-semibold">주문 상품 및 재고 반영 이력</h2>

        {Array.isArray(order.items) && order.items.length > 0 ? (
          <div className="space-y-4">
            {order.items.map((item: any) => {
              const itemHistories = stockHistoryMap.get(Number(item.id)) ?? [];

              return (
                <div key={item.id} className="rounded-lg border p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {item.product?.name ?? "상품명 없음"}
                    </div>
                    <div className="text-sm text-gray-600">
                      수량: {item.quantity}개 / 금액:{" "}
                      {Number(item.price ?? 0).toLocaleString()}원
                    </div>
                    <div className="text-sm text-gray-600">
                      SKU: {item.variant?.sku ?? "기본 상품"}
                    </div>

                    {Array.isArray(item.variant?.options) &&
                      item.variant.options.length > 0 && (
                        <div className="text-sm text-gray-600">
                          옵션:{" "}
                          {item.variant.options
                            .map(
                              (opt: any) =>
                                `${opt.value?.option?.name ?? "옵션"}: ${
                                  opt.value?.value ?? "-"
                                }`
                            )
                            .join(" / ")}
                        </div>
                      )}
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-2 text-sm font-medium">재고 변동 이력</div>

                    {itemHistories.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        이 주문상품에 연결된 재고 이력이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {itemHistories.map((history: any) => (
                          <div
                            key={history.id}
                            className="rounded-md border bg-white px-3 py-2 text-sm"
                          >
                            <div className="font-medium">
                              {stockChangeLabelMap[history.changeType] ??
                                history.changeType}
                            </div>
                            <div>
                              수량 {history.quantity > 0 ? "+" : ""}
                              {history.quantity}
                            </div>
                            {(history.beforeStock !== undefined ||
                              history.afterStock !== undefined) && (
                              <div>
                                재고 {history.beforeStock ?? "-"} →{" "}
                                {history.afterStock ?? "-"}
                              </div>
                            )}
                            <div className="text-gray-600">
                              {history.note || "-"}
                            </div>
                            <div className="text-gray-500">
                              {history.createdAt
                                ? new Date(history.createdAt).toLocaleString()
                                : "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500">주문 상품이 없습니다.</div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">결제 로그</h2>

          {payments.length === 0 ? (
            <div className="text-sm text-gray-500">결제 로그가 없습니다.</div>
          ) : (
            payments.map((payment: any) => (
              <div key={payment.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">
                  상태: {payment.status ?? "-"} / 공급사: {payment.provider ?? "-"}
                </div>
                <div>결제키: {payment.paymentKey ?? "-"}</div>
                <div>금액: {Number(payment.amount ?? 0).toLocaleString()}원</div>
                <div>실패코드: {payment.failCode ?? "-"}</div>
                <div>실패사유: {payment.failMessage ?? "-"}</div>
                <div className="text-gray-500">
                  {payment.createdAt
                    ? new Date(payment.createdAt).toLocaleString()
                    : "-"}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">취소 / 반품 / 환불 이력</h2>

          {cancels.length === 0 && returns.length === 0 && refunds.length === 0 ? (
            <div className="text-sm text-gray-500">관련 이력이 없습니다.</div>
          ) : (
            <div className="space-y-3 text-sm">
              {cancels.map((item: any) => (
                <div key={`cancel-${item.id}`} className="rounded-lg border p-3">
                  <div className="font-medium">주문 취소</div>
                  <div>사유: {item.reason ?? "-"}</div>
                  <div className="text-gray-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              ))}

              {returns.map((item: any) => (
                <div key={`return-${item.id}`} className="rounded-lg border p-3">
                  <div className="font-medium">반품</div>
                  <div>사유: {item.reason ?? "-"}</div>
                  <div className="text-gray-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              ))}

              {refunds.map((item: any) => (
                <div key={`refund-${item.id}`} className="rounded-lg border p-3">
                  <div className="font-medium">환불</div>
                  <div>사유: {item.reason ?? "-"}</div>
                  <div>금액: {Number(item.amount ?? 0).toLocaleString()}원</div>
                  <div className="text-gray-500">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}