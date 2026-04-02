"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAdminOrders, updateAdminOrderStatus } from "@/src/api/admin";

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

const allowedTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_COMPLETE: ["SHIPPING", "CANCELLED", "REFUNDED"],
  SHIPPING: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED", "REFUNDED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("주문 조회 실패", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : order.status === statusFilter;

      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword = keyword
        ? [
            order.orderNumber,
            order.user?.name,
            order.user?.email,
            order.address?.recipient,
            order.address?.phone,
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        : true;

      return matchesStatus && matchesKeyword;
    });
  }, [orders, searchKeyword, statusFilter]);

  const summary = useMemo(() => {
    const totalAmount = filteredOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice ?? 0),
      0
    );

    const pendingCount = filteredOrders.filter(
      (order) => order.status === "PENDING_PAYMENT"
    ).length;

    const shippingCount = filteredOrders.filter(
      (order) => order.status === "SHIPPING"
    ).length;

    const cancelledCount = filteredOrders.filter(
      (order) => order.status === "CANCELLED"
    ).length;

    return {
      totalCount: filteredOrders.length,
      totalAmount,
      pendingCount,
      shippingCount,
      cancelledCount,
    };
  }, [filteredOrders]);

  const getSelectableStatuses = (currentStatus: string) => {
    const nextStatuses = allowedTransitions[currentStatus] ?? [];
    return [currentStatus, ...nextStatuses.filter((s) => s !== currentStatus)];
  };

  const isStatusLocked = (currentStatus: string) => {
    return (allowedTransitions[currentStatus] ?? []).length === 0;
  };

  const handleStatusChange = async (orderId: number, currentStatus: string, nextStatus: string) => {
    if (currentStatus === nextStatus) return;

    try {
      setUpdatingOrderId(orderId);
      await updateAdminOrderStatus(orderId, nextStatus);
      alert("주문 상태가 변경되었습니다.");
      await fetchOrders();
    } catch (error: any) {
      console.error("주문 상태 변경 실패", error);
      alert(
        error?.response?.data?.message || "주문 상태 변경에 실패했습니다."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCopyOrderNumber = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      alert("주문번호가 복사되었습니다.");
    } catch (error) {
      console.error("주문번호 복사 실패", error);
      alert("주문번호 복사에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="p-6">주문 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">주문 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            주문 검색, 상태 변경, 배송 현황을 한 번에 관리합니다.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">조회 주문 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.totalCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">조회 주문 금액 합계</div>
          <div className="mt-2 text-2xl font-bold">
            {summary.totalAmount.toLocaleString()}원
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">결제대기</div>
          <div className="mt-2 text-2xl font-bold">{summary.pendingCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">배송중</div>
          <div className="mt-2 text-2xl font-bold">{summary.shippingCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">취소 주문</div>
          <div className="mt-2 text-2xl font-bold">{summary.cancelledCount}</div>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            className="rounded-lg border px-3 py-2"
            placeholder="주문번호 / 주문자 / 이메일 / 수령인 / 연락처 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />

          <select
            className="rounded-lg border px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING_PAYMENT">결제대기</option>
            <option value="PAYMENT_COMPLETE">결제완료</option>
            <option value="SHIPPING">배송중</option>
            <option value="DELIVERED">배송완료</option>
            <option value="CANCELLED">주문취소</option>
            <option value="RETURNED">반품완료</option>
            <option value="REFUNDED">환불완료</option>
          </select>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border p-4 text-gray-500">
          조회된 주문 데이터가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const itemCount = Array.isArray(order.items)
              ? order.items.reduce(
                  (sum: number, item: any) => sum + Number(item.quantity ?? 0),
                  0
                )
              : 0;

            const firstItemName =
              Array.isArray(order.items) && order.items.length > 0
                ? order.items[0]?.product?.name ?? "상품 정보 없음"
                : "상품 정보 없음";

            const extraItemCount =
              Array.isArray(order.items) && order.items.length > 1
                ? order.items.length - 1
                : 0;

            const selectableStatuses = getSelectableStatuses(order.status);
            const locked = isStatusLocked(order.status);

            return (
              <div key={order.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">
                        주문번호: {order.orderNumber}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyOrderNumber(order.orderNumber)}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        복사
                      </button>
                    </div>

                    <div className="text-sm text-gray-600">
                      주문자: {order.user?.name ?? "-"} / 이메일:{" "}
                      {order.user?.email ?? "-"}
                    </div>

                    <div className="text-sm text-gray-600">
                      수령인: {order.address?.recipient ?? "-"} / 연락처:{" "}
                      {order.address?.phone ?? "-"}
                    </div>

                    <div className="text-sm text-gray-600">
                      주소: {order.address?.address1 ?? "-"}{" "}
                      {order.address?.address2 ?? ""}
                    </div>

                    <div className="text-sm text-gray-600">
                      대표 상품: {firstItemName}
                      {extraItemCount > 0 ? ` 외 ${extraItemCount}건` : ""}
                    </div>

                    <div className="text-sm text-gray-600">
                      상품 수량 합계: {itemCount}개
                    </div>

                    <div className="text-sm text-gray-600">
                      주문일:{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "-"}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        statusBadgeMap[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusLabelMap[order.status] ?? order.status}
                    </span>

                    <div className="text-lg font-bold">
                      {Number(order.totalPrice ?? 0).toLocaleString()}원
                    </div>
                  </div>
                </div>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-2 text-sm font-medium">주문 상품</div>
                    <div className="space-y-1 text-sm text-gray-700">
                      {order.items.map((item: any) => (
                        <div key={item.id}>
                          {item.product?.name ?? "상품"} / 수량 {item.quantity}개 / 금액{" "}
                          {Number(item.price ?? 0).toLocaleString()}원
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                      className="w-full rounded-lg border px-3 py-2 md:w-60"
                      value={order.status}
                      disabled={updatingOrderId === order.id || locked}
                      onChange={(e) =>
                        handleStatusChange(order.id, order.status, e.target.value)
                      }
                    >
                      {selectableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabelMap[status] ?? status}
                          {status === order.status ? " (현재)" : ""}
                        </option>
                      ))}
                    </select>

                    {locked && (
                      <div className="text-sm text-gray-500">
                        더 이상 변경할 수 없는 상태입니다.
                      </div>
                    )}

                    {updatingOrderId === order.id && (
                      <div className="text-sm text-gray-500">
                        상태 변경 처리 중입니다...
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
                  >
                    상세 보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}