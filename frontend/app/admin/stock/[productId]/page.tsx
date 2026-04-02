"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getStockProductDetail } from "@/src/api/stock";

export default function AdminStockDetailPage() {
  const params = useParams();
  const productId = Number(params.productId);

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await getStockProductDetail(productId);
      setDetail(data);
    } catch (error) {
      console.error("재고 상세 조회 실패", error);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(productId)) {
      fetchDetail();
    }
  }, [productId]);

  const filteredHistories = useMemo(() => {
    const histories = Array.isArray(detail?.histories) ? detail.histories : [];

    if (!selectedVariantId) {
      return histories;
    }

    return histories.filter(
      (history: any) => Number(history.variantId) === Number(selectedVariantId)
    );
  }, [detail, selectedVariantId]);

  if (loading) {
    return <div className="p-6">재고 상세를 불러오는 중입니다...</div>;
  }

  if (!detail) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-lg font-semibold">재고 상세 정보를 찾을 수 없습니다.</div>
        <Link
          href="/admin/stock"
          className="inline-flex rounded-lg border px-4 py-2 text-sm"
        >
          재고 관리로 돌아가기
        </Link>
      </div>
    );
  }

  const product = detail.product;
  const histories = Array.isArray(detail.histories) ? detail.histories : [];
  const summary = detail.summary ?? {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">재고 상세 페이지</h1>
          <p className="mt-1 text-sm text-gray-500">
            [{product?.category ?? "미분류"}] {product?.name}
          </p>
        </div>

        <Link
          href="/admin/stock"
          className="inline-flex rounded-lg border px-4 py-2 text-sm"
        >
          재고 관리로 돌아가기
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">기본 재고</div>
          <div className="mt-2 text-2xl font-bold">
            {Number(product?.stock ?? 0)}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">기본 가격</div>
          <div className="mt-2 text-2xl font-bold">
            {Number(product?.price ?? 0).toLocaleString()}원
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">총 재고 이력 수</div>
          <div className="mt-2 text-2xl font-bold">
            {Number(summary?.totalHistoryCount ?? histories.length)}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">옵션 수</div>
          <div className="mt-2 text-2xl font-bold">
            {Array.isArray(product?.variants) ? product.variants.length : 0}
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-4">
        <h2 className="text-lg font-semibold">옵션 재고 정보</h2>

        {Array.isArray(product?.variants) && product.variants.length > 0 ? (
          <>
            <select
              className="w-full rounded-lg border px-3 py-2 md:w-80"
              value={selectedVariantId ?? ""}
              onChange={(e) =>
                setSelectedVariantId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">전체 이력 보기</option>
              {product.variants.map((variant: any) => (
                <option key={variant.id} value={variant.id}>
                  {variant.optionText} / SKU: {variant.sku} / 재고: {variant.stock}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              {product.variants.map((variant: any) => (
                <div key={variant.id} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{variant.optionText}</div>
                  <div className="text-gray-600">
                    SKU: {variant.sku} / 재고: {variant.stock} / 가격:{" "}
                    {Number(
                      variant.price !== null && variant.price !== undefined
                        ? variant.price
                        : product.price
                    ).toLocaleString()}
                    원
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">
            옵션이 없는 상품입니다. 기본 재고만 관리됩니다.
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">
            재고 이력
            {selectedVariantId ? " (선택 옵션 필터 적용)" : ""}
          </h2>

          {selectedVariantId && (
            <button
              type="button"
              onClick={() => setSelectedVariantId(null)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              전체 이력 보기
            </button>
          )}
        </div>

        {filteredHistories.length === 0 ? (
          <div className="text-sm text-gray-500">재고 이력이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {filteredHistories.map((history: any) => (
              <div key={history.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">
                  {history.product?.name ?? product?.name}
                  {history.variant ? ` / ${history.variant.sku}` : ""}
                </div>

                <div>
                  유형: {history.changeType} / 수량{" "}
                  {history.quantity > 0 ? "+" : ""}
                  {history.quantity}
                </div>

                {(history.beforeStock !== undefined ||
                  history.afterStock !== undefined) && (
                  <div>
                    재고: {history.beforeStock ?? "-"} → {history.afterStock ?? "-"}
                  </div>
                )}

                <div>
                  주문번호: {history.order?.orderNumber ?? "-"}
                </div>

                <div className="text-gray-600">{history.note || "-"}</div>

                <div className="text-gray-500">
                  {history.createdAt
                    ? new Date(history.createdAt).toLocaleString()
                    : "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}