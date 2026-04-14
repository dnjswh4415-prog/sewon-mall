"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getAdminOrders, updateAdminOrderStatus } from "@/src/api/admin";
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

const allowedTransitions: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_COMPLETE: ["SHIPPING", "CANCELLED", "REFUNDED"],
  SHIPPING: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED", "REFUNDED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

type AdminOrderListItem = {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
  address?: {
    recipient?: string;
    phone?: string;
    address1?: string;
    address2?: string;
  };
  items?: Array<{
    id: number;
    product?: {
      name?: string;
    };
  }>;
  _count?: {
    items?: number;
  };
};

type OrdersResponse = {
  items: AdminOrderListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  summary: {
    totalCount: number;
    totalAmount: number;
    pendingCount: number;
    shippingCount: number;
    cancelledCount: number;
  };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [summary, setSummary] = useState({
    totalCount: 0,
    totalAmount: 0,
    pendingCount: 0,
    shippingCount: 0,
    cancelledCount: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res: OrdersResponse = await getAdminOrders({
        page,
        pageSize,
        status: statusFilter,
        keyword,
        sortBy,
        sortOrder,
      });

      setOrders(Array.isArray(res?.items) ? res.items : []);
      setSummary(
        res?.summary ?? {
          totalCount: 0,
          totalAmount: 0,
          pendingCount: 0,
          shippingCount: 0,
          cancelledCount: 0,
        }
      );
      setTotalPages(Math.max(1, Number(res?.totalPages ?? 1)));
    } catch (error) {
      console.error("주문 조회 실패", error);
      setOrders([]);
      setSummary({
        totalCount: 0,
        totalAmount: 0,
        pendingCount: 0,
        shippingCount: 0,
        cancelledCount: 0,
      });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, statusFilter, keyword, sortBy, sortOrder]);

  const getSelectableStatuses = (currentStatus: string) => {
    const nextStatuses = allowedTransitions[currentStatus] ?? [];
    return [currentStatus, ...nextStatuses.filter((s) => s !== currentStatus)];
  };

  const isStatusLocked = (currentStatus: string) => {
    return (allowedTransitions[currentStatus] ?? []).length === 0;
  };

  const handleStatusChange = async (
    orderId: number,
    currentStatus: string,
    nextStatus: string
  ) => {
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

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput("");
    setKeyword("");
    setStatusFilter("ALL");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    setPageSize(20);
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

  if (loading && orders.length === 0) {
    return <div className="p-6">주문 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">주문 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            서버 페이지네이션과 검색/필터/정렬 기준으로 주문 목록을 관리합니다.
          </p>
        </div>
        <PageTopActions backFallbackHref="/admin" />
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
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
        >
          <input
            type="text"
            className="rounded-lg border px-3 py-2 xl:col-span-2"
            placeholder="주문번호 / 주문자 / 이메일 / 수령인 / 연락처 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <select
            className="rounded-lg border px-3 py-2"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
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

          <select
            className="rounded-lg border px-3 py-2"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt">주문일</option>
            <option value="totalPrice">주문금액</option>
            <option value="orderNumber">주문번호</option>
            <option value="status">주문상태</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2"
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as "asc" | "desc");
              setPage(1);
            }}
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>

          <div className="flex gap-2 xl:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              초기화
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <div className="rounded-xl border p-4 text-gray-500">
          주문 데이터를 불러오는 중입니다...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border p-4 text-gray-500">
          조회된 주문 데이터가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const firstItemName =
              Array.isArray(order.items) && order.items.length > 0
                ? order.items[0]?.product?.name ?? "상품 정보 없음"
                : "상품 정보 없음";

            const itemCount = Number(order._count?.items ?? 0);
            const extraItemCount = itemCount > 1 ? itemCount - 1 : 0;

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
                      주문 상품 수: {itemCount}건
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

      <section className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          이전
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => setPage(pageNumber)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              page === pageNumber ? "bg-black text-white" : "bg-white"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page === totalPages}
          className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          다음
        </button>
      </section>
    </div>
  );
}