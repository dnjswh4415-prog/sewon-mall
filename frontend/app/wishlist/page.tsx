"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWishlist, removeWishlistItem, toggleWishlist } from "@/src/api/wishlist";
import StarRating from "@/src/components/StarRating";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist();
      setItems(data || []);
    } catch (err: any) {
      console.error("찜목록 조회 실패:", err);
      alert(err?.response?.data?.message || "찜목록을 불러오지 못했습니다.");
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
      alert(err?.response?.data?.message || "찜 삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="p-10">찜목록을 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold mb-8">찜목록</h1>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            <p className="text-gray-500 mb-4">찜한 상품이 없습니다.</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-3 rounded-xl bg-black text-white font-semibold"
            >
              상품 보러가기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item: any) => {
              const product = item.product;
              const thumbnailRaw = product?.images?.[0]?.imageUrl || null;
              const thumbnail = thumbnailRaw
                ? thumbnailRaw.startsWith("http")
                  ? thumbnailRaw
                  : `http://localhost:5000${thumbnailRaw}`
                : "/no-image.png";

              const reviewCount = product?.reviews?.length ?? 0;
              const avgRating =
                reviewCount > 0
                  ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
                    reviewCount
                  : 0;

              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/api/product/${product.id}`)}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={thumbnail}
                      alt={product?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {product?.category?.name || product?.Category?.name || "카테고리"}
                    </p>
                    <h2 className="font-semibold text-sm min-h-[40px]">
                      {product?.name}
                    </h2>

                    <div className="flex items-center gap-2 mt-2 mb-3">
                      <StarRating rating={avgRating || 0} />
                      <span className="text-xs text-gray-500">({reviewCount})</span>
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
                      찜 삭제
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