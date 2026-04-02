"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adjustStock, getStockHistory, getStockProducts } from "@/src/api/stock";

type VariantItem = {
  id: number;
  sku: string;
  stock: number;
  price: number | null;
  isActive: boolean;
  optionText: string;
};

type ProductItem = {
  id: number;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  hasVariants: boolean;
  variants: VariantItem[];
};

type StockHistoryItem = {
  id: number;
  productId: number;
  variantId?: number | null;
  changeType: string;
  quantity: number;
  beforeStock?: number;
  afterStock?: number;
  note?: string | null;
  createdAt: string;
  order?: {
    id: number;
    orderNumber: string;
  } | null;
  product: {
    id: number;
    name: string;
  };
  variant?: {
    id: number;
    sku: string;
  } | null;
};

const LOW_STOCK_THRESHOLD = 5;
const API_BASE_URL = "http://localhost:5000";

const changeTypeLabelMap: Record<string, string> = {
  MANUAL_ADJUST: "수동 조정",
  ORDER_PAID: "결제 완료 차감",
  CANCEL_RESTORE: "주문 취소 복구",
  RETURN_RESTORE: "반품 복구",
  REFUND_RESTORE: "환불 복구",
};

export default function AdminStockPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [histories, setHistories] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState("");
  const [keyword, setKeyword] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productData, historyData] = await Promise.all([
        getStockProducts(),
        getStockHistory(),
      ]);

      setProducts(Array.isArray(productData) ? productData : []);
      setHistories(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error("재고 데이터 조회 실패", error);
      alert("재고 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keywordText = keyword.trim().toLowerCase();

      const matchesKeyword = keywordText
        ? [
            product.name,
            product.category ?? "",
            ...product.variants.map((variant) => `${variant.sku} ${variant.optionText}`),
          ]
            .join(" ")
            .toLowerCase()
            .includes(keywordText)
        : true;

      const isLowStockProduct = Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD;
      const hasLowStockVariant = product.variants.some(
        (variant) => Number(variant.stock ?? 0) <= LOW_STOCK_THRESHOLD
      );

      const matchesLowStock = lowStockOnly
        ? isLowStockProduct || hasLowStockVariant
        : true;

      return matchesKeyword && matchesLowStock;
    });
  }, [products, keyword, lowStockOnly]);

  const filteredHistories = useMemo(() => {
    if (!selectedProductId) return histories;
    return histories.filter((history) => history.productId === selectedProductId);
  }, [histories, selectedProductId]);

  const summary = useMemo(() => {
    const lowStockProducts = products.filter(
      (product) => Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD
    ).length;

    const lowStockVariants = products.reduce((sum, product) => {
      return (
        sum +
        product.variants.filter(
          (variant) => Number(variant.stock ?? 0) <= LOW_STOCK_THRESHOLD
        ).length
      );
    }, 0);

    const manualAdjustCount = histories.filter(
      (history) => history.changeType === "MANUAL_ADJUST"
    ).length;

    return {
      totalProducts: products.length,
      lowStockProducts,
      lowStockVariants,
      manualAdjustCount,
    };
  }, [products, histories]);

  const getImageSrc = (imageUrl?: string | null) => {
    if (!imageUrl) return "/no-image.png";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    return `${API_BASE_URL}${imageUrl}`;
  };

  const handleAdjustStock = async () => {
    if (!selectedProductId) {
      alert("상품을 선택해주세요.");
      return;
    }

    if (!quantity) {
      alert("변경 수량을 입력해주세요.");
      return;
    }

    try {
      await adjustStock({
        productId: Number(selectedProductId),
        variantId: selectedVariantId ?? undefined,
        quantity: Number(quantity),
        changeType: "MANUAL_ADJUST",
        note,
      });

      alert("재고가 수정되었습니다.");
      setQuantity(0);
      setNote("");
      await fetchData();
    } catch (error: any) {
      console.error("재고 수정 실패", error?.response?.data || error);
      alert(error?.response?.data?.message || "재고 수정에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="p-6">재고 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">재고 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            상품 재고, 옵션 재고, 수동 조정, 재고 이력을 한 번에 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            대시보드
          </Link>
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
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">전체 상품 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.totalProducts}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">저재고 상품 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.lowStockProducts}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">저재고 옵션 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.lowStockVariants}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">수동 조정 이력 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.manualAdjustCount}</div>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-4">
        <h2 className="text-lg font-semibold">재고 수동 조정</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-lg border px-3 py-2"
            value={selectedProductId ?? ""}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : null;
              setSelectedProductId(value);
              setSelectedVariantId(null);
            }}
          >
            <option value="">상품 선택</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                [{product.category ?? "미분류"}] {product.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-lg border px-3 py-2"
            value={selectedVariantId ?? ""}
            onChange={(e) =>
              setSelectedVariantId(e.target.value ? Number(e.target.value) : null)
            }
            disabled={!selectedProduct?.hasVariants}
          >
            <option value="">옵션 없음(상품 기본 재고)</option>
            {selectedProduct?.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.optionText} / 재고 {variant.stock}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="rounded-lg border px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            placeholder="증가(+), 감소(-)"
          />

          <input
            type="text"
            className="rounded-lg border px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="메모"
          />
        </div>

        <button
          onClick={handleAdjustStock}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          재고 반영
        </button>
      </section>

      <section className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">상품 재고 목록</h2>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              className="rounded-lg border px-3 py-2"
              placeholder="상품명 / 카테고리 / SKU 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              저재고만 보기
            </label>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-sm text-gray-500">조회된 상품이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const isLowStockProduct =
                Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD;

              return (
                <div key={product.id} className="rounded-xl border p-4 space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="h-28 w-28 overflow-hidden rounded-xl border bg-gray-50">
                        <img
                          src={getImageSrc(product.imageUrl)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/no-image.png";
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="font-semibold">
                          [{product.category ?? "미분류"}] {product.name}
                        </div>

                        <div className="text-sm text-gray-600">
                          상품 ID: {product.id}
                        </div>

                        <div className="text-sm text-gray-600">
                          기본 재고: {product.stock} / 가격:{" "}
                          {Number(product.price ?? 0).toLocaleString()}원
                        </div>

                        <div className="text-sm text-gray-600">
                          옵션 수: {product.variants.length}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      {isLowStockProduct && (
                        <span className="inline-flex w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          저재고 상품
                        </span>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setSelectedVariantId(null);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
                        >
                          이 상품 기준 이력 보기
                        </button>

                        <Link
                          href={`/admin/stock/${product.id}`}
                          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
                        >
                          상세 보기
                        </Link>
                      </div>
                    </div>
                  </div>

                  {product.hasVariants && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-2 text-sm font-medium">옵션 재고 정보</div>

                      <div className="space-y-2">
                        {product.variants.map((variant) => {
                          const isLowStockVariant =
                            Number(variant.stock ?? 0) <= LOW_STOCK_THRESHOLD;

                          return (
                            <div
                              key={variant.id}
                              className="rounded-md border bg-white px-3 py-2 text-sm"
                            >
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  {variant.optionText} / SKU: {variant.sku} / 재고:{" "}
                                  {variant.stock} / 가격:{" "}
                                  {Number(
                                    variant.price !== null && variant.price !== undefined
                                      ? variant.price
                                      : product.price
                                  ).toLocaleString()}
                                  원
                                </div>

                                {isLowStockVariant && (
                                  <span className="inline-flex w-fit rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                                    저재고 옵션
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">
            재고 이력
            {selectedProductId ? " (선택 상품 필터 적용)" : ""}
          </h2>

          {selectedProductId && (
            <button
              type="button"
              onClick={() => setSelectedProductId(null)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              전체 이력 보기
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filteredHistories.length === 0 ? (
            <div className="text-sm text-gray-500">재고 이력이 없습니다.</div>
          ) : (
            filteredHistories.map((history) => (
              <div key={history.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">
                  {history.product.name}
                  {history.variant ? ` / ${history.variant.sku}` : ""}
                </div>

                <div>
                  {changeTypeLabelMap[history.changeType] ?? history.changeType} / 수량{" "}
                  {history.quantity > 0 ? "+" : ""}
                  {history.quantity}
                </div>

                <div className="text-gray-600">
                  {history.beforeStock !== undefined &&
                  history.afterStock !== undefined
                    ? `재고 ${history.beforeStock} → ${history.afterStock} / `
                    : ""}
                  {history.order?.orderNumber
                    ? `주문번호 ${history.order.orderNumber} / `
                    : ""}
                  {history.note || "-"}
                </div>

                <div className="text-gray-500">
                  {new Date(history.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}