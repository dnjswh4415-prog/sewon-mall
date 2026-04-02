"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Home, ShoppingCart } from "lucide-react";
import { fetchProductById } from "@/src/api/products";
import { getProfile } from "@/src/api/auth";
import { getWishlist, toggleWishlist } from "@/src/api/wishlist";
import api from "@/src/api/axios";
import StarRating from "@/src/components/StarRating";

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

type ProductDetail = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  avgRating?: number;
  reviewCount?: number;
  Category?: {
    id: number;
    name: string;
  } | null;
  options?: ProductOption[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  reviews?: Review[];
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);

  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [selectedImage, setSelectedImage] = useState("");

  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(
    {}
  );
  const [quantity, setQuantity] = useState(1);

  const normalizeImageUrl = (url?: string | null) => {
    if (!url) return "/no-image.png";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url}`;
  };

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
        setProduct(data);

        const mainImage =
          data?.images?.find((img: ProductImage) => img.isMain)?.imageUrl ||
          [...(data?.images || [])].sort(
            (a: ProductImage, b: ProductImage) => a.sortOrder - b.sortOrder
          )[0]?.imageUrl ||
          data?.imageUrl ||
          "";

        setSelectedImage(normalizeImageUrl(mainImage));
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

    if (product.images?.length) {
      [...product.images]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .forEach((img) => {
          if (img.imageUrl && !rawImages.includes(img.imageUrl)) {
            rawImages.push(img.imageUrl);
          }
        });
    }

    if (product.imageUrl && !rawImages.includes(product.imageUrl)) {
      rawImages.unshift(product.imageUrl);
    }

    return rawImages.map((url) => normalizeImageUrl(url));
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

  const totalPrice = useMemo(() => {
    return currentPrice * quantity;
  }, [currentPrice, quantity]);

  const isWished = product ? wishlistIds.includes(product.id) : false;

  const handleOptionChange = (optionName: string, valueId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: valueId,
    }));
    setQuantity(1);
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    try {
      const result = await toggleWishlist(product.id);

      if (result?.liked === true) {
        setWishlistIds((prev) =>
          prev.includes(product.id) ? prev : [...prev, product.id]
        );
      } else if (result?.liked === false) {
        setWishlistIds((prev) => prev.filter((id) => id !== product.id));
      }
    } catch (error) {
      console.error("찜 처리 실패:", error);
      alert("찜 처리에 실패했습니다.");
    }
  };

  const handleAddToCart = async () => {
    if (!product) return false;

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return false;
    }

    if (product.variants?.length && !selectedVariant) {
      alert("옵션을 선택해주세요.");
      return false;
    }

    try {
      await api.post("/api/cart/add", {
        productId: Number(product.id),
        variantId: selectedVariant ? Number(selectedVariant.id) : null,
        quantity: Number(quantity),
      });

      alert("장바구니에 담았습니다.");
      return true;
    } catch (error: any) {
      console.error("장바구니 추가 실패:", error);
      alert(error?.response?.data?.message || "장바구니 담기에 실패했습니다.");
      return false;
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success) {
      router.push("/cart");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">상품 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">상품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            뒤로가기
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Home size={18} />
            홈으로
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-3xl border border-gray-200 p-6">
            <div className="aspect-square bg-[#f1f1f1] rounded-2xl overflow-hidden mb-4">
              <img
                src={selectedImage || "/no-image.png"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/no-image.png";
                }}
              />
            </div>

            {imageList.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imageList.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border ${
                      selectedImage === img ? "border-black" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`상품 이미지 ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/no-image.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-2">
              카테고리: {product.Category?.name || "미분류"}
            </p>

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>

              <button
                onClick={handleToggleWishlist}
                className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0"
              >
                <Heart
                  size={20}
                  className={
                    isWished ? "fill-red-500 text-red-500" : "text-gray-400"
                  }
                />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <StarRating rating={product.avgRating || 0} />
              <span className="text-sm text-gray-500">
                ({product.reviewCount || 0}개 리뷰)
              </span>
            </div>

            <p className="text-3xl font-bold mt-6">
              {Number(currentPrice).toLocaleString()}원
            </p>

            <p className="text-gray-600 mt-4 whitespace-pre-line">
              {product.description || "상품 설명이 없습니다."}
            </p>

            {product.options?.length > 0 && (
              <div className="mt-8 space-y-5">
                {product.options.map((option) => (
                  <div key={option.id}>
                    <p className="font-semibold mb-2">{option.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const selected = selectedOptions[option.name] === value.id;

                        return (
                          <button
                            key={value.id}
                            onClick={() => handleOptionChange(option.name, value.id)}
                            className={`px-4 py-2 rounded-xl border text-sm ${
                              selected
                                ? "bg-black text-white border-black"
                                : "bg-white border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {value.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {product.options?.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <p className="text-sm text-gray-500 mb-2">선택 옵션</p>
                {selectedVariant ? (
                  <div className="text-sm font-medium">
                    {selectedVariant.options
                      .map(
                        (opt) =>
                          `${opt.value.option.name}: ${opt.value.value}`
                      )
                      .join(" / ")}
                  </div>
                ) : (
                  <div className="text-sm text-red-500">옵션을 선택해주세요.</div>
                )}
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">재고</p>
              <p className="font-semibold">
                {currentStock > 0 ? `재고 ${currentStock}개 남음` : "품절"}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">수량</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
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
                <span className="text-gray-600">총 금액</span>
                <span className="text-2xl font-bold">
                  {Number(totalPrice).toLocaleString()}원
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock < 1}
                className="h-14 rounded-2xl border border-black text-black font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                장바구니 담기
              </button>

              <button
                onClick={handleBuyNow}
                disabled={currentStock < 1}
                className="h-14 rounded-2xl bg-black text-white font-semibold hover:opacity-90 disabled:opacity-50"
              >
                바로 구매
              </button>
            </div>
          </section>
        </div>

        <section className="mt-8 bg-white rounded-3xl border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-5">
            리뷰 ({product.reviewCount || 0})
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
                        {review.user?.name || "익명"}
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
                    {review.comment || "리뷰 내용이 없습니다."}
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
            <div className="text-gray-500">아직 리뷰가 없습니다.</div>
          )}
        </section>
      </div>
    </div>
  );
}