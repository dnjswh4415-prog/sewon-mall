"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProducts } from "@/src/api/products";
import { fetchCategories } from "@/src/api/category";

const API_BASE_URL = "http://localhost:5000";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [productData, categoryData] = await Promise.all([
          fetchProducts({ categoryId, keyword }),
          fetchCategories(),
        ]);

        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        console.error("상품 조회 실패", error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, keyword]);

  const visibleProducts = useMemo(() => {
    return Array.isArray(products) ? products : [];
  }, [products]);

  const normalizeImageUrl = (url?: string | null) => {
    if (!url) return "/no-image.png";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (url.startsWith("/uploads/")) {
      return `${API_BASE_URL}${url}`;
    }

    if (url.startsWith("uploads/")) {
      return `${API_BASE_URL}/${url}`;
    }

    if (url.startsWith("/")) {
      return url;
    }

    return `${API_BASE_URL}/${url}`;
  };

  const getImageSrc = (product: any) => {
    const sortedImages = Array.isArray(product?.images)
      ? [...product.images].sort(
          (a: any, b: any) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        )
      : [];

    const raw =
      product?.imageUrl ||
      sortedImages.find((img: any) => img?.isMain)?.imageUrl ||
      sortedImages[0]?.imageUrl ||
      "";

    return normalizeImageUrl(raw);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">상품 목록</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 상품 개수: {visibleProducts.length}
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="상품 검색"
            className="rounded border px-3 py-2"
          />

          <select
            value={categoryId ?? ""}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="rounded border px-3 py-2"
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          상품을 불러오는 중입니다...
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          조회된 상품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="overflow-hidden rounded-lg border bg-white transition hover:shadow-md"
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={getImageSrc(product)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith("/no-image.png")) {
                      target.src = "/no-image.png";
                    }
                  }}
                />
              </div>

              <div className="p-4">
                <div className="mb-1 text-sm text-gray-500">
                  {product?.Category?.name ?? product?.category?.name ?? "미분류"}
                </div>

                <h3 className="line-clamp-2 font-semibold">{product.name}</h3>

                <p className="mt-2 text-lg font-bold">
                  {Number(product.price ?? 0).toLocaleString()}원
                </p>

                {product.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {product.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}