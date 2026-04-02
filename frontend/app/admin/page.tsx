"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminDashboard,
  getAdminOrders,
  getAdminStockSummary,
} from "@/src/api/admin";

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

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const [dashboardData, ordersData, stockSummaryData] = await Promise.all([
        getAdminDashboard(),
        getAdminOrders(),
        getAdminStockSummary(),
      ]);

      setDashboard(dashboardData ?? {});

      const orders = Array.isArray(ordersData) ? ordersData : [];
      setRecentOrders(orders.slice(0, 5));

      setStockSummary(stockSummaryData ?? {});
    } catch (error) {
      console.error("관리자 데이터 조회 실패", error);
      setDashboard(null);
      setRecentOrders([]);
      setStockSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const dashboardStats = useMemo(() => {
    const orders = Array.isArray(recentOrders) ? recentOrders : [];

    const totalRecentAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalPrice ?? 0),
      0
    );

    const recentPendingCount = orders.filter(
      (order) => order.status === "PENDING_PAYMENT"
    ).length;

    const recentShippingCount = orders.filter(
      (order) => order.status === "SHIPPING"
    ).length;

    return {
      totalRecentAmount,
      recentPendingCount,
      recentShippingCount,
    };
  }, [recentOrders]);

  const lowStockProducts = Array.isArray(stockSummary?.lowStockProducts)
    ? stockSummary.lowStockProducts
    : [];

  const lowStockVariants = Array.isArray(stockSummary?.lowStockVariants)
    ? stockSummary.lowStockVariants
    : [];

  const paidWithoutDeduction = Array.isArray(stockSummary?.paidWithoutDeduction)
    ? stockSummary.paidWithoutDeduction
    : [];

  const missingRestore = Array.isArray(stockSummary?.missingRestore)
    ? stockSummary.missingRestore
    : [];

  if (loading) {
    return <div className="p-6">관리자 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            주문, 상품, 재고 현황을 한 번에 확인합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            주문 관리
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            상품 관리
          </Link>
          <Link
            href="/admin/stock"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            재고 관리
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 주문 수</div>
          <div className="mt-2 text-2xl font-bold">
            {dashboard?.totalOrders ?? 0}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 상품 수</div>
          <div className="mt-2 text-2xl font-bold">
            {dashboard?.totalProducts ?? 0}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 회원 수</div>
          <div className="mt-2 text-2xl font-bold">
            {dashboard?.totalUsers ?? 0}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 리뷰 수</div>
          <div className="mt-2 text-2xl font-bold">
            {dashboard?.totalReviews ?? 0}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">최근 주문 금액 합계</div>
          <div className="mt-2 text-2xl font-bold">
            {dashboardStats.totalRecentAmount.toLocaleString()}원
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">최근 배송중 주문</div>
          <div className="mt-2 text-2xl font-bold">
            {dashboardStats.recentShippingCount}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">최근 주문</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              전체 보기
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-sm text-gray-500">주문 내역이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const itemCount = Array.isArray(order.items)
                  ? order.items.reduce(
                      (sum: number, item: any) => sum + Number(item.quantity ?? 0),
                      0
                    )
                  : 0;

                return (
                  <div key={order.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">
                          주문번호: {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          주문자: {order.user?.name ?? "-"} / 이메일:{" "}
                          {order.user?.email ?? "-"}
                        </div>
                        <div className="text-sm text-gray-600">
                          수령인: {order.address?.recipient ?? "-"} / 연락처:{" "}
                          {order.address?.phone ?? "-"}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            statusBadgeMap[order.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabelMap[order.status] ?? order.status}
                        </span>
                        <div className="text-base font-bold">
                          {Number(order.totalPrice ?? 0).toLocaleString()}원
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      상품 수량 합계: {itemCount}개
                    </div>

                    <div className="flex justify-end">
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

        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">재고 이상 요약</h2>
            <Link
              href="/admin/stock"
              className="text-sm font-medium text-gray-600 hover:text-black"
            >
              재고 관리로 이동
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-red-50 p-4">
              <div className="text-sm text-red-600">결제완료인데 미차감</div>
              <div className="mt-1 text-2xl font-bold text-red-700">
                {paidWithoutDeduction.length}
              </div>
            </div>

            <div className="rounded-lg border bg-orange-50 p-4">
              <div className="text-sm text-orange-600">복구 누락 주문</div>
              <div className="mt-1 text-2xl font-bold text-orange-700">
                {missingRestore.length}
              </div>
            </div>

            <div className="rounded-lg border bg-yellow-50 p-4">
              <div className="text-sm text-yellow-700">저재고 상품</div>
              <div className="mt-1 text-2xl font-bold text-yellow-800">
                {lowStockProducts.length}
              </div>
            </div>

            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="text-sm text-blue-700">저재고 옵션</div>
              <div className="mt-1 text-2xl font-bold text-blue-800">
                {lowStockVariants.length}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-sm font-medium">저재고 상품 목록</div>

            {lowStockProducts.length === 0 ? (
              <div className="text-sm text-gray-500">
                재고 부족 상품이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      카테고리: {item.category ?? "-"} / 현재 재고:{" "}
                      {Number(item.stock ?? 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-sm font-medium">최근 결제대기 주문 수</div>
            <div className="rounded-lg border p-3 text-sm text-gray-700">
              최근 주문 기준 결제대기 주문은{" "}
              <span className="font-semibold">
                {dashboardStats.recentPendingCount}건
              </span>
              입니다.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}