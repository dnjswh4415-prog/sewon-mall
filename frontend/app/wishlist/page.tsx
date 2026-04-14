"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWishlist,
  removeWishlistItem,
  toggleWishlist,
} from "@/src/api/wishlist";
import StarRating from "@/src/components/StarRating";
import { useJapanesePageTranslation } from "@/src/hooks/useJapanesePageTranslation";

const pageText = {
  ko: {
    title: "찜목록",
    loading: "찜목록을 불러오는 중입니다...",
    empty: "찜한 상품이 없습니다.",
    goProducts: "상품 보러가기",
    remove: "찜 삭제",
    categoryFallback: "카테고리",
    loadFailed: "찜목록을 불러오지 못했습니다.",
    removeFailed: "찜 삭제에 실패했습니다.",
    languageButton: "日本語",
    languageLoading: "번역 중...",
  },
  ja: {
    title: "お気に入り一覧",
    loading: "お気に入り一覧を読み込み中です...",
    empty: "お気に入りした商品がありません。",
    goProducts: "商品を見る",
    remove: "お気に入り削除",
    categoryFallback: "カテゴリ",
    loadFailed: "お気に入り一覧を読み込めませんでした。",
    removeFailed: "お気に入り削除に失敗しました。",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
  },
} as const;

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translationItems = useMemo(() => {
    return items.flatMap((item: any) => {
      const product = item?.product;
      const productId = product?.id ?? item?.id ?? Math.random();
      const categoryName =
        product?.category?.name || product?.Category?.name || "";

      return [
        {
          key: `product-name-${productId}`,
          text: product?.name || "",
        },
        {
          key: `product-category-${productId}`,
          text: categoryName,
        },
      ];
    });
  }, [items]);

  const {
    language,
    mounted,
    translating,
    getText,
    handleToggleLanguage,
  } = useJapanesePageTranslation({
    items: translationItems,
  });

  const pt = pageText[language];

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist();
      setItems(data || []);
    } catch (err: any) {
      console.error("찜목록 조회 실패:", err);
      alert(err?.response?.data?.message || pt.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (item: any) => {
    try {
      if (item.id) {
        await removeWishlistItem(item.id);
      } else {
        await toggleWishlist(item.productId);
      }
      fetchWishlist();
    } catch (err: any) {
      alert(err?.response?.data?.message || pt.removeFailed);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">{pageText.ko.loading}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-10">{pt.loading}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-extrabold">{pt.title}</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLanguage}
              disabled={translating}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 disabled:opacity-50"
            >
              {translating ? pt.languageLoading : pt.languageButton}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              {pt.goProducts}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            <p className="text-gray-500 mb-4">{pt.empty}</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-3 rounded-xl bg-black text-white font-semibold"
            >
              {pt.goProducts}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item: any) => {
              const product = item.product;
              const productId = product?.id ?? item?.id;
              const thumbnailRaw = product?.images?.[0]?.imageUrl || null;
              const thumbnail = thumbnailRaw
                ? thumbnailRaw.startsWith("http")
                  ? thumbnailRaw
                  : `http://localhost:5000${thumbnailRaw}`
                : "/no-image.png";

              const reviewCount = product?.reviews?.length ?? 0;
              const avgRating =
                reviewCount > 0
                  ? product.reviews.reduce(
                      (sum: number, r: any) => sum + r.rating,
                      0
                    ) / reviewCount
                  : 0;

              const rawCategory =
                product?.category?.name ||
                product?.Category?.name ||
                pt.categoryFallback;

              const displayCategory = getText(
                `product-category-${productId}`,
                rawCategory
              );

              const displayProductName = getText(
                `product-name-${productId}`,
                product?.name
              );

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={thumbnail}
                      alt={product?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        e.currentTarget.src = "/no-image.png";
                      }}
                    />
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">{displayCategory}</p>

                    <h2 className="font-semibold text-sm min-h-[40px]">
                      {displayProductName}
                    </h2>

                    <div className="flex items-center gap-2 mt-2 mb-3">
                      <StarRating rating={avgRating || 0} />
                      <span className="text-xs text-gray-500">
                        ({reviewCount})
                      </span>
                    </div>

                    <p className="text-lg font-bold">
                      {Number(product?.price ?? 0).toLocaleString()}원
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item);
                      }}
                      className="mt-4 w-full h-11 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50"
                    >
                      {pt.remove}
                    </button>
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