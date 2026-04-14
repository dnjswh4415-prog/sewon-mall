"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, updateCartItem, removeCartItem } from "@/src/api/cart";
import PageTopActions from "@/src/components/PageTopActions";
import { useJapanesePageTranslation } from "@/src/hooks/useJapanesePageTranslation";

const API_BASE_URL = "http://localhost:5000";

const pageText = {
  ko: {
    title: "장바구니",
    loading: "장바구니를 불러오는 중입니다...",
    empty: "장바구니에 담긴 상품이 없습니다.",
    continueShopping: "쇼핑 계속하기",
    option: "옵션",
    quantityUpdateFailed: "수량 변경에 실패했습니다.",
    loadFailed: "장바구니를 불러오지 못했습니다.",
    removeFailed: "삭제에 실패했습니다.",
    delete: "삭제",
    totalPayment: "총 결제 금액",
    orderNow: "주문하기",
    languageButton: "日本語",
    languageLoading: "번역 중...",
    noImage: "상품 이미지",
  },
  ja: {
    title: "カート",
    loading: "カートを読み込み中です...",
    empty: "カートに商品がありません。",
    continueShopping: "買い物を続ける",
    option: "オプション",
    quantityUpdateFailed: "数量変更に失敗しました。",
    loadFailed: "カートを読み込めませんでした。",
    removeFailed: "削除に失敗しました。",
    delete: "削除",
    totalPayment: "合計お支払い金額",
    orderNow: "注文する",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
    noImage: "商品画像",
  },
} as const;

export default function CartPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translationItems = useMemo(() => {
    return cartItems.flatMap((item: any) => {
      const product = item?.product;
      const productId = product?.id ?? item?.id ?? Math.random();

      const optionItems =
        item?.variant?.options?.flatMap((opt: any) => [
          {
            key: `cart-option-name-${item.id}-${opt?.value?.option?.id ?? opt?.id}`,
            text: opt?.value?.option?.name || "",
          },
          {
            key: `cart-option-value-${item.id}-${opt?.value?.id ?? opt?.id}`,
            text: opt?.value?.value || "",
          },
        ]) ?? [];

      return [
        {
          key: `cart-product-name-${productId}`,
          text: product?.name || "",
        },
        ...optionItems,
      ];
    });
  }, [cartItems]);

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
      alert(err?.response?.data?.message || pt.loadFailed);
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
      alert(err?.response?.data?.message || pt.quantityUpdateFailed);
    }
  };

  const handleDecrease = async (item: any) => {
    if (Number(item.quantity) <= 1) return;

    try {
      await updateCartItem(item.id, Number(item.quantity) - 1);
      fetchCart();
    } catch (err: any) {
      alert(err?.response?.data?.message || pt.quantityUpdateFailed);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    try {
      await removeCartItem(cartItemId);
      fetchCart();
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
      <div className="max-w-5xl mx-auto px-4">
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

            <PageTopActions backFallbackHref="/" />
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center">
            <p className="text-gray-500 mb-4">{pt.empty}</p>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-3 rounded-xl bg-black text-white font-semibold"
            >
              {pt.continueShopping}
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
                  const productId = item?.product?.id ?? item?.id;

                  const displayProductName = getText(
                    `cart-product-name-${productId}`,
                    item.product?.name
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row gap-4 border-b border-gray-100 pb-5"
                    >
                      <div className="w-full md:w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={thumbnail}
                          alt={item.product?.name || pt.noImage}
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
                        <h2 className="font-bold text-lg">{displayProductName}</h2>

                        {item.variant && (
                          <div className="text-sm text-gray-500 mt-2">
                            {pt.option}{" "}
                            {item.variant.options?.map((opt: any) => {
                              const optionName = getText(
                                `cart-option-name-${item.id}-${opt?.value?.option?.id ?? opt?.id}`,
                                opt?.value?.option?.name
                              );

                              const optionValue = getText(
                                `cart-option-value-${item.id}-${opt?.value?.id ?? opt?.id}`,
                                opt?.value?.value
                              );

                              return (
                                <span key={opt.id} className="mr-2">
                                  {optionName}: {optionValue}
                                </span>
                              );
                            })}
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
                            {pt.delete}
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
                <h2 className="text-lg font-bold">{pt.totalPayment}</h2>
                <p className="text-2xl font-extrabold">
                  {totalPrice.toLocaleString()}원
                </p>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                className="w-full h-14 rounded-2xl bg-black text-white font-semibold"
              >
                {pt.orderNow}
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}