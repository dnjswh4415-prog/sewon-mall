"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  ShoppingCart,
  Truck,
  User,
  Heart,
  Star,
} from "lucide-react";
import { getProfile } from "@/src/api/auth";
import { toggleWishlist, getWishlist } from "@/src/api/wishlist";
import { fetchProducts } from "@/src/api/products";
import { fetchCategories } from "@/src/api/category";
import api from "@/src/api/axios";
import StarRating from "@/src/components/StarRating";

type SortType =
  | "latest"
  | "priceAsc"
  | "priceDesc"
  | "ratingDesc"
  | "salesDesc";

const API_BASE_URL = "http://localhost:5000";

export default function HomePage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [sortBy, setSortBy] = useState<SortType>("latest");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(true);

  const getStoredToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token")
    );
  };

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

  const getThumbnailSrc = (product: any) => {
    const sortedImages = Array.isArray(product?.images)
      ? [...product.images].sort(
          (a: any, b: any) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        )
      : [];

    const raw =
      product?.imageUrl ||
      sortedImages.find((img: any) => img?.isMain)?.imageUrl ||
      sortedImages[0]?.imageUrl ||
      product?.productImages?.find((img: any) => img?.isMain)?.imageUrl ||
      product?.productImages?.[0]?.imageUrl ||
      "";

    return normalizeImageUrl(raw);
  };

    useEffect(() => {
      const loadUserData = async () => {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (!token) {
          setUser(null);
          setWishlistIds([]);
          setCartCount(0);
          return;
        }

        try {
          const profile = await getProfile();
          setUser(profile);

          try {
            const wishlist = await getWishlist();
            const ids = Array.isArray(wishlist)
              ? wishlist.map((item: any) => item.productId)
              : [];
            setWishlistIds(ids);
          } catch (e) {
            console.error("찜목록 로딩 실패:", e);
            setWishlistIds([]);
          }

          try {
            const cartRes = await api.get("/api/cart");
            setCartCount(Array.isArray(cartRes.data) ? cartRes.data.length : 0);
          } catch (e) {
            console.error("장바구니 수량 로딩 실패:", e);
            setCartCount(0);
          }
        } catch (err: any) {
          console.error("프로필 조회 실패:", err);
          localStorage.removeItem("token");
          setUser(null);
          setWishlistIds([]);
          setCartCount(0);
        }
      };

      loadUserData();
    }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("카테고리 로딩 실패:", err);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const data = await fetchProducts({
        categoryId,
        keyword: search || undefined,
      });

      const productArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
        ? data.products
        : [];

      setProducts(productArray);
    } catch (err) {
      console.error("상품 불러오기 실패:", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryId]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryId]);

  const sortedProducts = useMemo(() => {
    const copied = [...products];

    switch (sortBy) {
      case "priceAsc":
        return copied.sort((a, b) => Number(a.price) - Number(b.price));
      case "priceDesc":
        return copied.sort((a, b) => Number(b.price) - Number(a.price));
      case "ratingDesc":
        return copied.sort(
          (a, b) => Number(b.avgRating || 0) - Number(a.avgRating || 0)
        );
      case "salesDesc":
        return copied.sort(
          (a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0)
        );
      case "latest":
      default:
        return copied.sort((a, b) => Number(b.id) - Number(a.id));
    }
  }, [products, sortBy]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * 20;
    const end = start + 20;
    return sortedProducts.slice(start, end);
  }, [sortedProducts, page]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(sortedProducts.length / 20));
    setTotalPages(pages);
    if (page > pages) {
      setPage(1);
    }
  }, [sortedProducts, page]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    setUser(null);
    setWishlistIds([]);
    setCartCount(0);
    router.push("/");
    router.refresh();
  };

  const handleToggleWishlist = async (productId: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    try {
      const result = await toggleWishlist(productId);

      if (result?.liked === true) {
        setWishlistIds((prev) =>
          prev.includes(productId) ? prev : [...prev, productId]
        );
      } else if (result?.liked === false) {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      } else {
        setWishlistIds((prev) =>
          prev.includes(productId)
            ? prev.filter((id) => id !== productId)
            : [...prev, productId]
        );
      }
    } catch (err) {
      console.error("찜 처리 실패:", err);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleCategoryClick = (id?: number) => {
    setCategoryId(id);
    setPage(1);
  };

  const handleCartClick = () => {
    if (!user) {
      alert("로그인 후에 장바구니에 추가 가능하십니다.");
      router.push("/login");
      return;
    }

    router.push("/cart");
  };

  const handleOrdersClick = () => {
    if (!user) {
      alert("로그인 후에 주문/배송 조회가 가능합니다.");
      router.push("/login");
      return;
    }

    router.push("/orders");
  };

  const selectedCategoryName =
    categories.find((cat) => cat.id === categoryId)?.name || "전체 상품";

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <div className="bg-[#f1f1f1] border-b border-gray-200">
        <div className="max-w-7xl mx-auto h-10 px-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-5">
            <button
              onClick={() =>
                alert("즐겨찾기는 Ctrl + D를 누르면 추가할 수 있습니다.")
              }
              className="flex items-center gap-1 hover:text-black"
            >
              <Star size={14} />
              즐겨찾기
            </button>

            {!user ? (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="hover:text-black"
                >
                  로그인
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="hover:text-black"
                >
                  회원가입
                </button>
                <button
                  onClick={() => router.push("/find-email")}
                  className="hover:text-black"
                >
                  ID/PW 찾기
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/wishlist")}
                  className="hover:text-black"
                >
                  찜목록
                </button>

                {user.role === "ADMIN" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    관리자페이지
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700"
                >
                  로그아웃
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-5">
            <button className="hover:text-black">1:1문의</button>
            <button className="hover:text-black">고객센터</button>
          </div>
        </div>
      </div>

      <header className="bg-[#f7f7f7]">
        <div className="max-w-7xl mx-auto px-4 h-[142px] flex items-center justify-between gap-8">
          <div className="w-[260px] shrink-0">
            <h1
              onClick={() => router.push("/")}
              className="text-[42px] leading-none font-extrabold tracking-[-0.03em] cursor-pointer text-black"
            >
              sewon-mall
            </h1>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[470px] relative">
              <input
                type="text"
                placeholder="인기검색어순위"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="w-full h-[52px] rounded-full border-[3px] border-[#666] bg-white pl-6 pr-16 text-[20px] outline-none placeholder:text-gray-500"
              />
              <button
                onClick={handleSearch}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-black"
              >
                <Search size={28} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="w-[260px] shrink-0 flex items-center justify-end gap-9">
            <button
              onClick={handleCartClick}
              className="flex flex-col items-center text-black hover:opacity-70"
            >
              <div className="relative">
                <ShoppingCart size={34} strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="mt-2 text-[14px]">장바구니</span>
            </button>

            <button
              onClick={handleOrdersClick}
              className="flex flex-col items-center text-black hover:opacity-70"
            >
              <Truck size={34} strokeWidth={1.8} />
              <span className="mt-2 text-[14px]">주문/배송</span>
            </button>

            <button
              onClick={() => router.push(user ? "/profile" : "/login")}
              className="flex flex-col items-center text-black hover:opacity-70"
            >
              <User size={34} strokeWidth={1.8} />
              <span className="mt-2 text-[14px]">마이페이지</span>
            </button>
          </div>
        </div>
      </header>

      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setCategoryId(undefined);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm ${
              !categoryId
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            전체보기
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-4 py-2 rounded-full text-sm ${
                categoryId === cat.id
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {showCategoryPanel && (
            <aside className="hidden md:block w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">카테고리</h3>
                  <button
                    onClick={() => setShowCategoryPanel(false)}
                    className="text-xs text-gray-500 hover:text-black"
                  >
                    닫기
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryClick(undefined)}
                    className={`w-full text-left px-4 py-3 rounded-xl ${
                      !categoryId
                        ? "bg-black text-white"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    전체
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl ${
                        categoryId === cat.id
                          ? "bg-black text-white"
                          : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          <section className="flex-1 min-w-0">
            {!showCategoryPanel && (
              <div className="mb-4">
                <button
                  onClick={() => setShowCategoryPanel(true)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  카테고리 열기
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">현재 선택 카테고리</p>
                  <h3 className="text-2xl font-bold">{selectedCategoryName}</h3>
                  {search && (
                    <p className="text-sm text-gray-500 mt-1">
                      검색어: <span className="font-medium">{search}</span>
                    </p>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
                >
                  <option value="latest">최신순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="salesDesc">구매순</option>
                  <option value="ratingDesc">평점순</option>
                </select>
              </div>
            </div>

            {loadingProducts ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
                상품을 불러오는 중입니다...
              </div>
            ) : pagedProducts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
                조건에 맞는 상품이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {pagedProducts.map((product) => {
                  const isSoldOut = Number(product.stock) === 0;
                  const thumbnail = getThumbnailSrc(product);

                  return (
                    <div
                      key={product.id}
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="group relative bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                    >
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-20">
                          <span className="text-white text-lg font-bold">
                            SOLD OUT
                          </span>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(product.id);
                        }}
                        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white"
                      >
                        <Heart
                          size={18}
                          className={
                            wishlistIds.includes(product.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }
                        />
                      </button>

                      <div className="aspect-square bg-[#f1f1f1] overflow-hidden">
                        <img
                          src={thumbnail}
                          alt={product.name}
                          className="block h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.endsWith("/no-image.png")) {
                              target.src = "/no-image.png";
                            }
                          }}
                        />
                      </div>

                      <div className="p-4">
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">
                            {product.Category?.name || selectedCategoryName}
                          </p>
                          <h5 className="font-semibold text-sm leading-5 line-clamp-2 min-h-[40px]">
                            {product.name}
                          </h5>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <StarRating rating={product.avgRating || 0} />
                          <span className="text-xs text-gray-500">
                            ({product.reviewCount || 0})
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-lg font-bold">
                            {Number(product.price).toLocaleString()}원
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>재고 {product.stock ?? 0}</span>
                            <span>판매 {product.salesCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center mt-10 gap-2 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded-xl border ${
                    page === i + 1
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-16 bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © 2026 SEWON-MALL. All rights reserved.
      </footer>
    </div>
  );
}