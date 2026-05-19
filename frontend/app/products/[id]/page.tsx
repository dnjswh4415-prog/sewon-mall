"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  ShoppingCart,
} from "lucide-react";
import {
  fetchProductById,
  fetchProductRecommendations,
  recordProductView,
} from "@/src/api/products";
import { getProductImages } from "@/src/api/product-image";
import { getProfile } from "@/src/api/auth";
import { getWishlist, toggleWishlist } from "@/src/api/wishlist";
import api from "@/src/api/axios";
import StarRating from "@/src/components/StarRating";
import { useJapanesePageTranslation } from "@/src/hooks/useJapanesePageTranslation";

const API_BASE_URL = "http://localhost:5000";

type ProductOptionValue = {
  id: number;
  value: string;
};

type ProductOption = {
  id: number;
  name: string;
  values: ProductOptionValue[];
};

type ProductVariantOption = {
  id: number;
  value: {
    id: number;
    value: string;
    option: {
      id: number;
      name: string;
    };
  };
};

type ProductVariant = {
  id: number;
  sku: string;
  price?: number | null;
  stock: number;
  isActive: boolean;
  options: ProductVariantOption[];
};

type ProductImage = {
  id: number;
  imageUrl: string;
  sortOrder: number;
  isMain: boolean;
};

type ProductDetailImage = {
  id?: number;
  imageUrl: string;
  sortOrder?: number;
};

type ReviewImage = {
  id: number;
  imageUrl: string;
};

type Review = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
  };
  images?: ReviewImage[];
};

type RecommendedProduct = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  avgRating?: number;
  reviewCount?: number;
  images?: ProductImage[];
};

type ProductDetail = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  detailImageUrl?: string | null;
  detailImages?: ProductDetailImage[];
  avgRating?: number;
  reviewCount?: number;
  qnaCount?: number;
  Category?: {
    id: number;
    name: string;
  } | null;
  options?: ProductOption[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  reviews?: Review[];
};

const detailText = {
  ko: {
    back: "뒤로가기",
    home: "홈으로",
    languageButton: "日本語",
    languageLoading: "번역 중...",
    pageLoading: "페이지를 준비하는 중입니다...",
    loading: "상품 정보를 불러오는 중입니다...",
    notFound: "상품을 찾을 수 없습니다.",
    category: "카테고리",
    uncategorized: "미분류",
    reviewUnit: "개 리뷰",
    noDescription: "상품 설명이 없습니다.",
    selectedOption: "선택 옵션",
    selectOption: "옵션을 선택해주세요.",
    stock: "재고",
    stockRemain: "개 남음",
    soldOut: "품절",
    quantity: "수량",
    totalPrice: "총 금액",
    addToCart: "장바구니에 담기",
    buyNow: "바로 구매하기",
    detailInfo: "상세정보",
    reviews: "리뷰",
    qna: "Q&A",
    noReview: "아직 리뷰가 없습니다.",
    noReviewContent: "리뷰 내용이 없습니다.",
    noImage: "이미지 없음",
    anonymous: "익명",
    loginRequired: "로그인이 필요합니다.",
    cartLoginRequired: "로그인 후 장바구니에 담을 수 있습니다.",
    wishlistFailed: "찜 처리에 실패했습니다.",
    addCartSuccess: "장바구니에 담았습니다.",
    addCartFailed: "장바구니 추가에 실패했습니다.",
    detailBannerAlt: "상품 상세 설명 이미지",
    recommendations: "연관 상품 추천",
    noRecommendations: "추천 상품이 없습니다.",
    recommendReviewUnit: "리뷰",
    noQna: "아직 등록된 문의가 없습니다.",
  },
  ja: {
    back: "戻る",
    home: "ホームへ",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
    pageLoading: "ページを準備しています...",
    loading: "商品情報を読み込み中です...",
    notFound: "商品が見つかりません。",
    category: "カテゴリ",
    uncategorized: "未分類",
    reviewUnit: "件のレビュー",
    noDescription: "商品説明がありません。",
    selectedOption: "選択オプション",
    selectOption: "オプションを選択してください。",
    stock: "在庫",
    stockRemain: "個残り",
    soldOut: "売り切れ",
    quantity: "数量",
    totalPrice: "合計金額",
    addToCart: "カートに入れる",
    buyNow: "今すぐ購入",
    detailInfo: "詳細情報",
    reviews: "レビュー",
    qna: "Q&A",
    noReview: "まだレビューがありません。",
    noReviewContent: "レビュー内容がありません。",
    noImage: "画像なし",
    anonymous: "匿名",
    loginRequired: "ログインが必要です。",
    cartLoginRequired: "ログイン後にカートへ追加できます。",
    wishlistFailed: "お気に入り処理に失敗しました。",
    addCartSuccess: "カートに追加しました。",
    addCartFailed: "カート追加に失敗しました。",
    detailBannerAlt: "商品詳細説明画像",
    recommendations: "関連商品おすすめ",
    noRecommendations: "おすすめ商品がありません。",
    recommendReviewUnit: "レビュー",
    noQna: "まだお問い合わせはありません。",
  },
} as const;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"detail" | "review" | "qna">(
    "detail"
  );

  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(
    {}
  );
  const [quantity, setQuantity] = useState(1);

  const detailInfoRef = useRef<HTMLElement | null>(null);
  const reviewRef = useRef<HTMLElement | null>(null);
  const qnaRef = useRef<HTMLElement | null>(null);

  const normalizeImageUrl = (url?: string | null) => {
    if (!url || url === "/no-image.png") return "/no-image.png";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (url.startsWith("/uploads/")) {
      return `${API_BASE_URL}${url}`;
    }

    if (url.startsWith("uploads/")) {
      return `${API_BASE_URL}/${url}`;
    }

    if (url.startsWith("/images/")) {
      return url;
    }

    if (url.startsWith("images/")) {
      return `/${url}`;
    }

    if (url.startsWith("/")) {
      return `${API_BASE_URL}${url}`;
    }

    return `${API_BASE_URL}/${url}`;
  };

  const getProductThumbnail = (target?: {
    imageUrl?: string | null;
    images?: ProductImage[];
  }) => {
    if (!target) return "/no-image.png";

    const images = Array.isArray(target.images) ? [...target.images] : [];

    const mainImage = images.find((img) => img.isMain && img.imageUrl)?.imageUrl;

    const firstImage = images
      .sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;

        const sortA = Number(a.sortOrder ?? 0);
        const sortB = Number(b.sortOrder ?? 0);

        if (sortA !== sortB) return sortA - sortB;
        return Number(a.id) - Number(b.id);
      })
      .find((img) => img.imageUrl)?.imageUrl;

    return normalizeImageUrl(mainImage || firstImage || target.imageUrl);
  };

  const translationItems = useMemo(() => {
    if (!product) return [];

    const items: { key: string; text: string | null | undefined }[] = [
      { key: `product-name-${product.id}`, text: product.name },
      { key: `product-description-${product.id}`, text: product.description },
      {
        key: `product-category-${product.id}`,
        text: product.Category?.name,
      },
    ];

    for (const option of product.options || []) {
      items.push({
        key: `option-name-${option.id}`,
        text: option.name,
      });

      for (const value of option.values || []) {
        items.push({
          key: `option-value-${value.id}`,
          text: value.value,
        });
      }
    }

    for (const review of product.reviews || []) {
      items.push({
        key: `review-comment-${review.id}`,
        text: review.comment,
      });
    }

    for (const rec of recommendations || []) {
      items.push({
        key: `recommend-name-${rec.id}`,
        text: rec.name,
      });
    }

    return items;
  }, [product, recommendations]);

  const { language, mounted, translating, getText, handleToggleLanguage } =
    useJapanesePageTranslation({
      items: translationItems,
    });

  const t = detailText[language];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await getProfile();
        setUser(profile);

        try {
          const wishlist = await getWishlist();
          const ids = Array.isArray(wishlist)
            ? wishlist.map((item: any) => item.productId)
            : [];
          setWishlistIds(ids);
        } catch (err) {
          console.error("찜목록 조회 실패:", err);
        }
      } catch {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);

        const data = await fetchProductById(productId);

        let productImages: ProductImage[] = [];

        try {
          const imageData = await getProductImages(productId);
          productImages = Array.isArray(imageData) ? imageData : [];
        } catch (err) {
          console.warn("상품 이미지 목록 조회 실패:", err);
        }

        const mergedProduct: ProductDetail = {
          ...data,
          images: productImages.length > 0 ? productImages : data?.images || [],
        };

        setProduct(mergedProduct);

        try {
          await recordProductView(productId);
        } catch (err) {
          console.warn("상품 조회 기록 저장 실패:", err);
        }

        try {
          const recData = await fetchProductRecommendations(productId, 8);
          setRecommendations(Array.isArray(recData) ? recData : []);
        } catch (err) {
          console.error("추천 상품 조회 실패:", err);
          setRecommendations([]);
        }
      } catch (error) {
        console.error("상품 상세 조회 실패:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(productId)) {
      loadProduct();
    }
  }, [productId]);

  useEffect(() => {
    setSelectedOptions({});
    setQuantity(1);
  }, [product?.id]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;

    const optionNames = product.options?.map((opt) => opt.name) || [];
    const allSelected = optionNames.every((name) => selectedOptions[name]);

    if (!allSelected) return null;

    return (
      product.variants.find((variant) => {
        const variantMap: Record<string, number> = {};

        variant.options.forEach((opt) => {
          variantMap[opt.value.option.name] = opt.value.id;
        });

        return optionNames.every(
          (name) => variantMap[name] === selectedOptions[name]
        );
      }) || null
    );
  }, [product, selectedOptions]);

  const imageList = useMemo(() => {
    if (!product) return [];

    const rawImages: string[] = [];

    const pushUniqueImage = (url?: string | null) => {
      if (url && !rawImages.includes(url)) {
        rawImages.push(url);
      }
    };

    if (product.images?.length) {
      [...product.images]
        .sort((a, b) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;

          const sortA = Number(a.sortOrder ?? 0);
          const sortB = Number(b.sortOrder ?? 0);

          if (sortA !== sortB) return sortA - sortB;
          return Number(a.id) - Number(b.id);
        })
        .forEach((img) => pushUniqueImage(img.imageUrl));
    }

    pushUniqueImage(product.imageUrl);

    return rawImages.length
      ? rawImages.map((url) => normalizeImageUrl(url))
      : ["/no-image.png"];
  }, [product]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedImage(imageList[0] || "/no-image.png");
  }, [product?.id, imageList]);

  const detailBannerImages = useMemo(() => {
    if (!product) return [];

    if (Array.isArray(product.detailImages) && product.detailImages.length > 0) {
      return [...product.detailImages]
        .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
        .map((img) => normalizeImageUrl(img.imageUrl))
        .filter(Boolean);
    }

    if (product.detailImageUrl) {
      return [normalizeImageUrl(product.detailImageUrl)];
    }

    return [];
  }, [product]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant?.price != null) return Number(selectedVariant.price);
    return Number(product.price || 0);
  }, [product, selectedVariant]);

  const currentStock = useMemo(() => {
    if (!product) return 0;
    if (selectedVariant) return Number(selectedVariant.stock || 0);
    return Number(product.stock || 0);
  }, [product, selectedVariant]);

  const totalPrice = useMemo(
    () => currentPrice * quantity,
    [currentPrice, quantity]
  );

  const isWished = useMemo(() => {
    if (!product) return false;
    return wishlistIds.includes(product.id);
  }, [product, wishlistIds]);

  const handleSelectImage = (index: number) => {
    if (!imageList.length) return;

    const safeIndex = Math.max(0, Math.min(index, imageList.length - 1));
    setSelectedImageIndex(safeIndex);
    setSelectedImage(imageList[safeIndex] || "/no-image.png");
  };

  const handlePrevImage = () => {
    if (imageList.length <= 1) return;

    const nextIndex =
      selectedImageIndex === 0 ? imageList.length - 1 : selectedImageIndex - 1;

    handleSelectImage(nextIndex);
  };

  const handleNextImage = () => {
    if (imageList.length <= 1) return;

    const nextIndex =
      selectedImageIndex === imageList.length - 1 ? 0 : selectedImageIndex + 1;

    handleSelectImage(nextIndex);
  };

  const scrollToTab = (tab: "detail" | "review" | "qna") => {
    setActiveTab(tab);

    const targetRef =
      tab === "detail" ? detailInfoRef : tab === "review" ? reviewRef : qnaRef;

    if (!targetRef.current) return;

    const top =
      targetRef.current.getBoundingClientRect().top + window.scrollY - 90;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  };

  const handleOptionChange = (optionName: string, valueId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: valueId,
    }));
  };

  const handleWishlistToggle = async () => {
    if (!user || !product) {
      alert(t.loginRequired);
      router.push("/login");
      return;
    }

    try {
      await toggleWishlist(product.id);

      setWishlistIds((prev) =>
        prev.includes(product.id)
          ? prev.filter((id) => id !== product.id)
          : [...prev, product.id]
      );
    } catch (error) {
      console.error("찜 처리 실패:", error);
      alert(t.wishlistFailed);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return false;

    if (!user) {
      alert(t.cartLoginRequired);
      router.push("/login");
      return false;
    }

    if (product.variants?.length && !selectedVariant) {
      alert(t.selectOption);
      return false;
    }

    try {
      await api.post("/api/cart/add", {
        productId: Number(product.id),
        variantId: selectedVariant ? Number(selectedVariant.id) : null,
        quantity: Number(quantity),
      });

      alert(t.addCartSuccess);
      return true;
    } catch (error: any) {
      console.error("장바구니 추가 실패:", error);
      alert(error?.response?.data?.message || t.addCartFailed);
      return false;
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success) {
      router.push("/cart");
    }
  };

  if (!mounted) {
    return <div className="p-10">{detailText.ko.pageLoading}</div>;
  }

  if (loading) {
    return <div className="p-10">{t.loading}</div>;
  }

  if (!product) {
    return <div className="p-10">{t.notFound}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            {t.back}
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Home size={18} />
            {t.home}
          </button>

          <button
            type="button"
            onClick={handleToggleLanguage}
            disabled={translating}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            {translating ? t.languageLoading : t.languageButton}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section className="bg-white rounded-3xl border border-gray-200 p-6 self-start">
            <div className="relative aspect-square bg-[#f1f1f1] rounded-2xl overflow-hidden mb-4">
              <img
                src={selectedImage || imageList[selectedImageIndex] || "/no-image.png"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/no-image.png";
                }}
              />

              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white shadow-sm"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white shadow-sm"
                  >
                    <ChevronRight size={22} />
                  </button>

                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-sm">
                    {selectedImageIndex + 1} / {imageList.length}
                  </div>
                </>
              )}
            </div>

            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 max-w-full">
                {imageList.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => handleSelectImage(index)}
                    className={`relative flex-none w-[80px] h-[80px] min-w-[80px] max-w-[80px] min-h-[80px] max-h-[80px] rounded-2xl overflow-hidden bg-gray-100 ${
                      selectedImageIndex === index
                        ? "border-2 border-black"
                        : "border border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name}-${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/no-image.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6 self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {t.category}:{" "}
                  {getText(
                    `product-category-${product.id}`,
                    product.Category?.name || t.uncategorized
                  )}
                </p>

                <h1 className="text-3xl font-bold">
                  {getText(`product-name-${product.id}`, product.name)}
                </h1>
              </div>

              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                  isWished
                    ? "bg-red-50 border-red-300 text-red-500"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                <Heart size={20} fill={isWished ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <StarRating rating={Number(product.avgRating || 0)} />
              <span className="text-sm text-gray-600">
                {Number(product.avgRating || 0).toFixed(1)} (
                {product.reviewCount || 0}
                {t.reviewUnit})
              </span>
            </div>

            <div className="mt-6 text-gray-700 leading-7 whitespace-pre-line">
              {product.description ? (
                getText(`product-description-${product.id}`, product.description)
              ) : (
                <span className="text-gray-400">{t.noDescription}</span>
              )}
            </div>

            {(product.options?.length ?? 0) > 0 && (
              <div className="mt-8 space-y-5">
                {product.options?.map((option) => {
                  const displayOptionName = getText(
                    `option-name-${option.id}`,
                    option.name
                  );

                  return (
                    <div key={option.id}>
                      <p className="font-semibold mb-2">{displayOptionName}</p>

                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => {
                          const selected =
                            selectedOptions[option.name] === value.id;
                          const displayValue = getText(
                            `option-value-${value.id}`,
                            value.value
                          );

                          return (
                            <button
                              key={value.id}
                              type="button"
                              onClick={() =>
                                handleOptionChange(option.name, value.id)
                              }
                              className={`px-4 py-2 rounded-xl border text-sm ${
                                selected
                                  ? "bg-black text-white border-black"
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {displayValue}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(product.options?.length ?? 0) > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">{t.selectedOption}</p>

                {selectedVariant ? (
                  <div className="text-sm font-medium">
                    {selectedVariant.options
                      .map((opt) => {
                        const optionName = getText(
                          `option-name-${opt.value.option.id}`,
                          opt.value.option.name
                        );

                        const optionValue = getText(
                          `option-value-${opt.value.id}`,
                          opt.value.value
                        );

                        return `${optionName}: ${optionValue}`;
                      })
                      .join(" / ")}
                  </div>
                ) : (
                  <div className="text-sm text-red-500">{t.selectOption}</div>
                )}
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">{t.stock}</p>
              <p className="font-semibold">
                {currentStock > 0
                  ? `${currentStock}${t.stockRemain}`
                  : t.soldOut}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">{t.quantity}</p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 hover:bg-gray-50"
                >
                  -
                </button>

                <span className="w-12 text-center font-semibold">{quantity}</span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((prev) => Math.min(currentStock || 1, prev + 1))
                  }
                  className="w-10 h-10 rounded-xl border border-gray-300 hover:bg-gray-50"
                  disabled={currentStock < 1}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t.totalPrice}</span>
                <span className="text-2xl font-bold">
                  {Number(totalPrice).toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock < 1}
                className="h-14 rounded-2xl border border-black text-black font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                {t.addToCart}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={currentStock < 1}
                className="h-14 rounded-2xl bg-black text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {t.buyNow}
              </button>
            </div>
          </section>
        </div>

        <div className="sticky top-0 z-30 mt-8 bg-[#f8fafc] pt-2">
          <div className="bg-white border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center justify-center gap-8 md:gap-12 h-14">
              <button
                type="button"
                onClick={() => scrollToTab("detail")}
                className={`h-full px-1 text-sm md:text-base font-medium border-b-2 ${
                  activeTab === "detail"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500"
                }`}
              >
                {t.detailInfo}
              </button>

              <button
                type="button"
                onClick={() => scrollToTab("review")}
                className={`h-full px-1 text-sm md:text-base font-medium border-b-2 ${
                  activeTab === "review"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500"
                }`}
              >
                {t.reviews} {product.reviewCount || 0}
              </button>

              <button
                type="button"
                onClick={() => scrollToTab("qna")}
                className={`h-full px-1 text-sm md:text-base font-medium border-b-2 ${
                  activeTab === "qna"
                    ? "border-black text-black"
                    : "border-transparent text-gray-500"
                }`}
              >
                {t.qna} {product.qnaCount || 0}
              </button>
            </div>
          </div>
        </div>

        <section
          ref={detailInfoRef}
          id="detail-info"
          className="bg-white rounded-b-3xl border-x border-b border-gray-200 p-4 md:p-6"
        >
          <h2 className="text-2xl font-bold mb-5">{t.detailInfo}</h2>

          {detailBannerImages.length > 0 ? (
            <div className="space-y-4">
              {detailBannerImages.map((src, index) => (
                <img
                  key={`${src}-${index}`}
                  src={src}
                  alt={`${t.detailBannerAlt} ${index + 1}`}
                  className="w-full h-auto rounded-2xl"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/no-image.png";
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-700 leading-7 whitespace-pre-line">
              {product.description
                ? getText(`product-description-${product.id}`, product.description)
                : t.noDescription}
            </div>
          )}
        </section>

        <section
          ref={reviewRef}
          id="reviews"
          className="mt-8 bg-white rounded-3xl border border-gray-200 p-4 md:p-6"
        >
          <h2 className="text-2xl font-bold mb-5">
            {t.reviews} ({product.reviewCount || 0})
          </h2>

          {product.reviews?.length ? (
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-200 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {review.user?.name || t.anonymous}
                      </p>

                      <div className="mt-1">
                        <StarRating rating={review.rating} />
                      </div>
                    </div>

                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-700 whitespace-pre-line">
                    {getText(
                      `review-comment-${review.id}`,
                      review.comment || t.noReviewContent
                    )}
                  </p>

                  {review.images?.length ? (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                      {review.images.map((img) => (
                        <img
                          key={img.id}
                          src={normalizeImageUrl(img.imageUrl)}
                          alt="리뷰 이미지"
                          className="w-full aspect-square object-cover rounded-xl border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = "/no-image.png";
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">{t.noReview}</div>
          )}
        </section>

        <section
          ref={qnaRef}
          id="qna"
          className="mt-8 bg-white rounded-3xl border border-gray-200 p-4 md:p-6"
        >
          <h2 className="text-2xl font-bold mb-5">
            {t.qna} ({product.qnaCount || 0})
          </h2>

          <div className="text-gray-500">{t.noQna}</div>
        </section>

        <section className="mt-8 bg-white rounded-3xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-5">{t.recommendations}</h2>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/products/${item.id}`)}
                  className="text-left border rounded-2xl p-4 bg-white hover:shadow-sm transition"
                >
                  <img
                    src={getProductThumbnail(item)}
                    alt={item.name}
                    className="w-full aspect-square object-cover rounded-xl mb-3"
                    onError={(e) => {
                      e.currentTarget.src = "/no-image.png";
                    }}
                  />

                  <div className="font-semibold line-clamp-2 min-h-[48px]">
                    {getText(`recommend-name-${item.id}`, item.name)}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    {Number(item.price).toLocaleString()}원
                  </div>

                  <div className="text-sm text-yellow-600 mt-1">
                    {Number(item.avgRating ?? 0).toFixed(1)} /{" "}
                    {item.reviewCount ?? 0}
                    {t.recommendReviewUnit}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">{t.noRecommendations}</div>
          )}
        </section>
      </div>
    </div>
  );
}