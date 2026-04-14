"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getAdminProducts } from "@/src/api/admin";
import PageTopActions from "@/src/components/PageTopActions";

const API_BASE_URL = "http://localhost:5000";
const LOW_STOCK_THRESHOLD = 5;

type AdminProductListItem = {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  createdAt: string;
  Category?: {
    id: number;
    name: string;
  } | null;
  images?: Array<{
    id: number;
    imageUrl: string;
    isMain: boolean;
  }>;
  _count?: {
    variants?: number;
    options?: number;
    images?: number;
  };
};

type ProductsResponse = {
  items: AdminProductListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  summary: {
    totalProducts: number;
    totalVariants: number;
    noImageCount: number;
    lowStockCount: number;
  };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalVariants: 0,
    noImageCount: 0,
    lowStockCount: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res: ProductsResponse = await getAdminProducts({
        page,
        pageSize,
        keyword,
        stockFilter,
        sortBy,
        sortOrder,
      });

      setProducts(Array.isArray(res?.items) ? res.items : []);
      setSummary(
        res?.summary ?? {
          totalProducts: 0,
          totalVariants: 0,
          noImageCount: 0,
          lowStockCount: 0,
        }
      );
      setTotalPages(Math.max(1, Number(res?.totalPages ?? 1)));
    } catch (error) {
      console.error("관리자 상품 조회 실패", error);
      setProducts([]);
      setSummary({
        totalProducts: 0,
        totalVariants: 0,
        noImageCount: 0,
        lowStockCount: 0,
      });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, pageSize, keyword, stockFilter, sortBy, sortOrder]);

  const getImageSrc = (product: AdminProductListItem) => {
    const mainImage = Array.isArray(product.images) ? product.images[0] : null;
    const raw = mainImage?.imageUrl || product.imageUrl || "";

    if (!raw) return "/no-image.png";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `${API_BASE_URL}${raw}`;
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const handleReset = () => {
    setSearchInput("");
    setKeyword("");
    setStockFilter("ALL");
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

  if (loading && products.length === 0) {
    return <div className="p-6">상품 데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">상품 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            목록은 가볍게 조회하고, 상세 관리는 별도 상세 API 기준으로 확장 가능한 구조입니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            대시보드
          </Link>
          <PageTopActions backFallbackHref="/admin" />
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            주문 관리
          </Link>
          <Link
            href="/admin/stock"
            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
          >
            재고 관리
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">전체 상품 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.totalProducts}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">전체 옵션 수</div>
          <div className="mt-2 text-2xl font-bold">{summary.totalVariants}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">이미지 없는 상품</div>
          <div className="mt-2 text-2xl font-bold">{summary.noImageCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">저재고 상품</div>
          <div className="mt-2 text-2xl font-bold">{summary.lowStockCount}</div>
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
            placeholder="상품명 / 카테고리 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <select
            className="rounded-lg border px-3 py-2"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">전체 상품</option>
            <option value="LOW_STOCK">저재고 상품만</option>
            <option value="NO_IMAGE">이미지 없는 상품만</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="createdAt">등록일</option>
            <option value="name">상품명</option>
            <option value="price">가격</option>
            <option value="stock">재고</option>
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
          상품 데이터를 불러오는 중입니다...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border p-4 text-gray-500">
          조회된 상품이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const imageCount = Number(product._count?.images ?? 0);
            const variantCount = Number(product._count?.variants ?? 0);
            const optionCount = Number(product._count?.options ?? 0);
            const isLowStock = Number(product.stock ?? 0) <= LOW_STOCK_THRESHOLD;

            return (
              <div key={product.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="h-28 w-28 overflow-hidden rounded-xl border bg-gray-50 shrink-0">
                      <img
                        src={getImageSrc(product)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/no-image.png";
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-lg font-semibold">
                        [{product.Category?.name ?? "미분류"}] {product.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        상품 ID: {product.id}
                      </div>
                      <div className="text-sm text-gray-600">
                        가격: {Number(product.price ?? 0).toLocaleString()}원
                      </div>
                      <div className="text-sm text-gray-600">
                        기본 재고: {Number(product.stock ?? 0)}
                        {isLowStock && (
                          <span className="ml-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                            저재고
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        옵션 수: {optionCount} / variant 수: {variantCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        등록 이미지 수: {imageCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        등록일:{" "}
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleString()
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/stock/${product.id}`}
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
                    >
                      재고 상세 보기
                    </Link>
                  </div>
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