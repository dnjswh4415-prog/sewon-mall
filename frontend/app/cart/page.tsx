"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, updateCartItem, removeCartItem } from "@/src/api/cart";

const API_BASE_URL = "http://localhost:5000";

export default function CartPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    return "/no-image.png";
  };

  const getThumbnailSrc = (item: any) => {
    const product = item?.product;

    const images = Array.isArray(product?.images)
      ? [...product.images].sort(
          (a: any, b: any) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        )
      : [];

    const productImages = Array.isArray(product?.productImages)
      ? [...product.productImages].sort(
          (a: any, b: any) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        )
      : [];

    const raw =
      product?.imageUrl ||
      images.find((img: any) => img?.isMain)?.imageUrl ||
      images[0]?.imageUrl ||
      productImages.find((img: any) => img?.isMain)?.imageUrl ||
      productImages[0]?.imageUrl ||
      "";

    return normalizeImageUrl(raw);
  };

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setCartItems(data || []);
    } catch (err: any) {
      console.error("장바구니 조회 실패:", err);
      alert(err?.response?.data?.message || "장바구니를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum: number, item: any) => {
      const unitPrice =
        item.variant?.price != null
          ? Number(item.variant.price)
          : Number(item.product?.price ?? 0);

      return sum + unitPrice * Number(item.quantity);
    }, 0);
  }, [cartItems]);

  const handleIncrease = async (item: any) => {
    try {
      await updateCartItem(item.id, Number(item.quantity) + 1);
      fetchCart();
    } catch (err: any) {
      alert(err?.response?.data?.message || "수량 변경에 실패했습니다.");
    }
  };

  const handleDecrease = async (item: any) => {
    if (Number(item.quantity) <= 1) return;

    try {
      await updateCartItem(item.id, Number(item.quantity) - 1);
      fetchCart();
    } catch (err: any) {
      alert(err?.response?.data?.message || "수량 변경에 실패했습니다.");
    }
  };

  const handleRemove = async (cartItemId: number) => {
    try {
      await removeCartItem(cartItemId);
      fetchCart();
    } catch (err: any) {
      alert(err?.response?.data?.message || "삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return <div className="p-10">장바구니를 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold mb-8">장바구니</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            <p className="text-gray-500 mb-4">장바구니에 담긴 상품이 없습니다.</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-3 rounded-xl bg-black text-white font-semibold"
            >
              쇼핑 계속하기
            </button>
          </div>
        ) : (
          <>
            <section className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
              <div className="space-y-5">
                {cartItems.map((item: any) => {
                  const unitPrice =
                    item.variant?.price != null
                      ? Number(item.variant.price)
                      : Number(item.product?.price ?? 0);

                  const thumbnail = getThumbnailSrc(item);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row gap-4 border-b border-gray-100 pb-5"
                    >
                      <div className="w-full md:w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={thumbnail}
                          alt={item.product?.name || "상품 이미지"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith("/no-image.png")) {
                              target.src = "/no-image.png";
                            }
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <h2 className="font-bold text-lg">{item.product?.name}</h2>

                        {item.variant && (
                          <div className="text-sm text-gray-500 mt-2">
                            옵션{" "}
                            {item.variant.options?.map((opt: any) => (
                              <span key={opt.id} className="mr-2">
                                {opt.value?.option?.name}: {opt.value?.value}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="mt-3 font-semibold">
                          {unitPrice.toLocaleString()}원
                        </p>
                      </div>

                      <div className="flex flex-row md:flex-col md:items-end justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecrease(item)}
                            className="w-9 h-9 rounded-lg border border-gray-300 bg-white"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrease(item)}
                            className="w-9 h-9 rounded-lg border border-gray-300 bg-white"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {(unitPrice * Number(item.quantity)).toLocaleString()}원
                          </p>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="mt-2 text-sm text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">총 결제 금액</h2>
                <p className="text-2xl font-extrabold">
                  {totalPrice.toLocaleString()}원
                </p>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="w-full h-14 rounded-2xl bg-black text-white font-semibold"
              >
                주문하기
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}