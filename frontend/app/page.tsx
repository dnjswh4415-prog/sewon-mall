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
import { translateText } from "@/src/api/translate";
import { useLanguage } from "@/src/contexts/LanguageContext";
import MainPopupBanner from "@/src/components/MainPopupBanner";

type SortType =
  | "latest"
  | "priceAsc"
  | "priceDesc"
  | "ratingDesc"
  | "salesDesc";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const TRANSLATION_CACHE_KEY = "sewon_translation_cache_v1";

const BIG_CATEGORY_TREE: Record<string, string[]> = {
  입력장치: ["키보드", "마우스", "웹캠", "마이크", "게이밍액세서리"],
  오디오: ["헤드셋", "이어폰", "스피커"],
  "디스플레이/모바일": [
    "모니터",
    "노트북",
    "태블릿",
    "스마트폰",
    "스마트워치",
  ],
  "전원/케이블": ["충전기", "케이블", "보조배터리"],
  "가구/생활": ["의자", "책상", "조명", "생활가전"],
  PC부품: [
    "저장장치",
    "CPU",
    "메인보드",
    "그래픽카드",
    "RAM",
    "SSD",
    "케이스",
    "쿨러",
  ],
  "사무/네트워크": ["프린터", "공유기"],
  "스마트홈/보안": [
    "스마트도어락",
    "홈CCTV",
    "스마트조명",
    "스마트플러그",
    "로봇청소기",
  ],
  차량용품: [
    "블랙박스",
    "차량충전기",
    "차량거치대",
    "차량청소기",
    "차량공기청정기",
  ],
};

const BIG_CATEGORY_LABELS: Record<string, { ko: string; ja: string }> = {
  입력장치: { ko: "입력장치", ja: "入力機器" },
  오디오: { ko: "오디오", ja: "オーディオ" },
  "디스플레이/모바일": {
    ko: "디스플레이/모바일",
    ja: "ディスプレイ/モバイル",
  },
  "전원/케이블": { ko: "전원/케이블", ja: "電源/ケーブル" },
  "가구/생활": { ko: "가구/생활", ja: "家具/生活" },
  PC부품: { ko: "PC부품", ja: "PCパーツ" },
  "사무/네트워크": {
    ko: "사무/네트워크",
    ja: "事務/ネットワーク",
  },
  "스마트홈/보안": {
    ko: "스마트홈/보안",
    ja: "スマートホーム/セキュリティ",
  },
  차량용품: { ko: "차량용품", ja: "カー用品" },
};

const uiText = {
  ko: {
    favorite: "즐겨찾기",
    login: "로그인",
    signup: "회원가입",
    findIdPw: "ID/PW 찾기",
    wishlist: "찜목록",
    admin: "관리자페이지",
    logout: "로그아웃",
    inquiry: "1:1문의",
    support: "고객센터",
    cart: "장바구니",
    orders: "주문/배송",
    mypage: "마이페이지",
    all: "전체보기",
    category: "카테고리",
    bigCategory: "큰 카테고리",
    subCategory: "하위 카테고리",
    close: "닫기",
    openCategory: "카테고리 열기",
    selectedCategory: "현재 선택 카테고리",
    searchKeyword: "검색어",
    latest: "최신순",
    priceAsc: "가격 낮은순",
    priceDesc: "가격 높은순",
    salesDesc: "구매순",
    ratingDesc: "평점순",
    loadingProducts: "상품을 불러오는 중입니다...",
    emptyProducts: "조건에 맞는 상품이 없습니다.",
    stock: "재고",
    sales: "판매",
    searchPlaceholder: "인기검색어순위",
    allProducts: "전체 상품",
    soldOut: "SOLD OUT",
    languageButton: "日本語",
    languageLoading: "번역 중...",
    pageLoading: "페이지를 준비하는 중입니다...",
    translateFailed: "일본어 번역 전환에 실패했습니다.",
    loginRequired: "로그인이 필요합니다.",
    cartLoginRequired: "로그인 후에 장바구니에 추가 가능하십니다.",
    ordersLoginRequired: "로그인 후에 주문/배송 조회가 가능합니다.",
    favoriteHint: "즐겨찾기는 Ctrl + D를 누르면 추가할 수 있습니다.",
    subAll: "하위 카테고리 전체",
  },
  ja: {
    favorite: "お気に入り",
    login: "ログイン",
    signup: "会員登録",
    findIdPw: "ID/PW検索",
    wishlist: "お気に入り一覧",
    admin: "管理者ページ",
    logout: "ログアウト",
    inquiry: "1:1お問い合わせ",
    support: "カスタマーセンター",
    cart: "カート",
    orders: "注文/配送",
    mypage: "マイページ",
    all: "すべて",
    category: "カテゴリ",
    bigCategory: "大カテゴリ",
    subCategory: "小カテゴリ",
    close: "閉じる",
    openCategory: "カテゴリを開く",
    selectedCategory: "選択中のカテゴリ",
    searchKeyword: "検索語",
    latest: "新着順",
    priceAsc: "価格の安い順",
    priceDesc: "価格の高い順",
    salesDesc: "人気順",
    ratingDesc: "評価順",
    loadingProducts: "商品を読み込み中です...",
    emptyProducts: "条件に合う商品がありません。",
    stock: "在庫",
    sales: "販売",
    searchPlaceholder: "人気検索語ランキング",
    allProducts: "全商品",
    soldOut: "SOLD OUT",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
    pageLoading: "ページを準備中です...",
    translateFailed: "日本語への切り替えに失敗しました。",
    loginRequired: "ログインが必要です。",
    cartLoginRequired: "ログイン後にカートへ追加できます。",
    ordersLoginRequired: "ログイン後に注文/配送照会が可能です。",
    favoriteHint: "お気に入りは Ctrl + D で追加できます。",
    subAll: "小カテゴリ全体",
  },
} as const;

type TranslationCache = Record<string, string>;

function getTranslationCache(): TranslationCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(TRANSLATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setTranslationCache(cache: TranslationCache) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function makeTranslationKey(direction: "koToJa" | "jaToKo", text: string) {
  return `${direction}::${text.trim()}`;
}

export default function HomePage() {
  const router = useRouter();
  const { language, toggleLanguage, mounted } = useLanguage();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
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

  const [selectedBigCategory, setSelectedBigCategory] = useState<string>(
    Object.keys(BIG_CATEGORY_TREE)[0] || "입력장치"
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    number | null
  >(null);

  const [pageTranslating, setPageTranslating] = useState(false);
  const [translatedNames, setTranslatedNames] = useState<Record<number, string>>(
    {}
  );
  const [translatedCategoryNames, setTranslatedCategoryNames] = useState<
    Record<number, string>
  >({});

  const t = uiText[language];

  const bigCategories = useMemo(() => {
    return Object.keys(BIG_CATEGORY_TREE);
  }, []);

  const translatedBigCategoryName =
    BIG_CATEGORY_LABELS[selectedBigCategory]?.[language] || selectedBigCategory;

  const translateWithCache = async (
    text: string,
    direction: "koToJa" | "jaToKo" = "koToJa"
  ) => {
    const trimmed = String(text ?? "").trim();
    if (!trimmed) return "";

    const cacheKey = makeTranslationKey(direction, trimmed);
    const cache = getTranslationCache();

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    const result = await translateText({
      text: trimmed,
      direction,
    });

    const translated = result?.translatedText || trimmed;
    cache[cacheKey] = translated;
    setTranslationCache(cache);

    return translated;
  };

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

  const getThumbnailSrc = (product: any) => {
    const images = Array.isArray(product?.images) ? [...product.images] : [];
    const productImages = Array.isArray(product?.productImages)
      ? [...product.productImages]
      : [];

    const sortedImages = images.sort((a: any, b: any) => {
      if (a?.isMain && !b?.isMain) return -1;
      if (!a?.isMain && b?.isMain) return 1;

      const sortA = Number(a?.sortOrder ?? 0);
      const sortB = Number(b?.sortOrder ?? 0);

      if (sortA !== sortB) return sortA - sortB;
      return Number(a?.id ?? 0) - Number(b?.id ?? 0);
    });

    const sortedProductImages = productImages.sort((a: any, b: any) => {
      if (a?.isMain && !b?.isMain) return -1;
      if (!a?.isMain && b?.isMain) return 1;

      const sortA = Number(a?.sortOrder ?? 0);
      const sortB = Number(b?.sortOrder ?? 0);

      if (sortA !== sortB) return sortA - sortB;
      return Number(a?.id ?? 0) - Number(b?.id ?? 0);
    });

    const raw =
      sortedImages.find((img: any) => img?.isMain)?.imageUrl ||
      sortedImages[0]?.imageUrl ||
      sortedProductImages.find((img: any) => img?.isMain)?.imageUrl ||
      sortedProductImages[0]?.imageUrl ||
      product?.imageUrl ||
      "";

    return normalizeImageUrl(raw);
  };

  const normalizeSearchText = (value: string) => {
    return String(value || "")
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase();
  };

  const findCategoryBySearchKeyword = (keyword: string) => {
    const normalizedKeyword = normalizeSearchText(keyword);

    if (!normalizedKeyword) {
      return null;
    }

    for (const bigCategory of bigCategories) {
      const normalizedBigCategory = normalizeSearchText(bigCategory);
      const bigCategoryLabelKo = normalizeSearchText(
        BIG_CATEGORY_LABELS[bigCategory]?.ko || bigCategory
      );
      const bigCategoryLabelJa = normalizeSearchText(
        BIG_CATEGORY_LABELS[bigCategory]?.ja || ""
      );

      const isBigCategoryMatched =
        normalizedBigCategory.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedBigCategory) ||
        bigCategoryLabelKo.includes(normalizedKeyword) ||
        normalizedKeyword.includes(bigCategoryLabelKo) ||
        bigCategoryLabelJa.includes(normalizedKeyword) ||
        normalizedKeyword.includes(bigCategoryLabelJa);

      if (isBigCategoryMatched) {
        return {
          type: "big" as const,
          bigCategory,
          subCategoryId: null,
        };
      }

      const subCategoryNames = BIG_CATEGORY_TREE[bigCategory] || [];

      for (const subCategoryName of subCategoryNames) {
        const normalizedSubCategoryName = normalizeSearchText(subCategoryName);

        const isSubCategoryNameMatched =
          normalizedSubCategoryName.includes(normalizedKeyword) ||
          normalizedKeyword.includes(normalizedSubCategoryName);

        if (isSubCategoryNameMatched) {
          const matchedDbCategory = categories.find(
            (cat) => cat.name === subCategoryName
          );

          return {
            type: "sub" as const,
            bigCategory,
            subCategoryId: matchedDbCategory
              ? Number(matchedDbCategory.id)
              : null,
          };
        }
      }

      const matchedDbCategory = categories.find((cat) => {
        const categoryName = normalizeSearchText(cat.name);

        return (
          subCategoryNames.includes(cat.name) &&
          (categoryName.includes(normalizedKeyword) ||
            normalizedKeyword.includes(categoryName))
        );
      });

      if (matchedDbCategory) {
        return {
          type: "sub" as const,
          bigCategory,
          subCategoryId: Number(matchedDbCategory.id),
        };
      }
    }

    return null;
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
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedBigCategory, selectedSubCategoryId]);

  const currentSubCategories = useMemo(() => {
    const targetNames = BIG_CATEGORY_TREE[selectedBigCategory] ?? [];
    return categories.filter((cat) => targetNames.includes(cat.name));
  }, [categories, selectedBigCategory]);

  const filteredProducts = useMemo(() => {
    const hasSearch = search.trim().length > 0;

    if (hasSearch) {
      return products;
    }

    const targetSubCategoryNames = new Set(
      BIG_CATEGORY_TREE[selectedBigCategory] ?? []
    );

    return products.filter((product) => {
      const productCategoryId = Number(
        product?.Category?.id ?? product?.category?.id ?? 0
      );
      const productCategoryName =
        product?.Category?.name || product?.category?.name || "";

      const matchesBigCategory = targetSubCategoryNames.has(productCategoryName);

      const matchesSubCategory =
        selectedSubCategoryId == null
          ? true
          : productCategoryId === Number(selectedSubCategoryId);

      return matchesBigCategory && matchesSubCategory;
    });
  }, [products, search, selectedBigCategory, selectedSubCategoryId]);

  const sortedProducts = useMemo(() => {
    const copied = [...filteredProducts];

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
  }, [filteredProducts, sortBy]);

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

  const translateCategoriesToJapanese = async (categoryList: any[]) => {
    const untranslatedCategories = categoryList.filter(
      (cat) => !translatedCategoryNames[cat.id]
    );

    for (const cat of untranslatedCategories) {
      try {
        const translated = await translateWithCache(cat.name, "koToJa");

        setTranslatedCategoryNames((prev) => ({
          ...prev,
          [cat.id]: translated || cat.name,
        }));
      } catch (error) {
        console.error("카테고리 번역 실패:", error);
      }
    }
  };

  const translateCurrentProductsToJapanese = async (productList: any[]) => {
    const untranslatedProducts = productList.filter(
      (product) => !translatedNames[product.id]
    );

    for (const product of untranslatedProducts) {
      try {
        const translated = await translateWithCache(product.name, "koToJa");

        setTranslatedNames((prev) => ({
          ...prev,
          [product.id]: translated || product.name,
        }));
      } catch (error) {
        console.error("상품명 번역 실패:", error);
      }
    }
  };

  const restoreCachedTranslations = (categoryList: any[], productList: any[]) => {
    const cache = getTranslationCache();

    const restoredCategories: Record<number, string> = {};
    const restoredProducts: Record<number, string> = {};

    for (const cat of categoryList) {
      const key = makeTranslationKey("koToJa", String(cat.name ?? ""));
      if (cache[key]) {
        restoredCategories[cat.id] = cache[key];
      }
    }

    for (const product of productList) {
      const key = makeTranslationKey("koToJa", String(product.name ?? ""));
      if (cache[key]) {
        restoredProducts[product.id] = cache[key];
      }
    }

    if (Object.keys(restoredCategories).length > 0) {
      setTranslatedCategoryNames((prev) => ({
        ...prev,
        ...restoredCategories,
      }));
    }

    if (Object.keys(restoredProducts).length > 0) {
      setTranslatedNames((prev) => ({
        ...prev,
        ...restoredProducts,
      }));
    }
  };

  useEffect(() => {
    if (!mounted) return;
    restoreCachedTranslations(categories, pagedProducts);
  }, [mounted, categories, pagedProducts]);

  const handleToggleLanguage = async () => {
    if (language === "ja") {
      toggleLanguage();
      return;
    }

    try {
      setPageTranslating(true);
      restoreCachedTranslations(categories, pagedProducts);
      await translateCategoriesToJapanese(categories);
      await translateCurrentProductsToJapanese(pagedProducts);
      toggleLanguage();
    } catch (error) {
      console.error("페이지 일본어 전환 실패:", error);
      alert(t.translateFailed);
    } finally {
      setPageTranslating(false);
    }
  };

  useEffect(() => {
    const preloadJapaneseData = async () => {
      if (language !== "ja") return;
      if (categories.length === 0 && pagedProducts.length === 0) return;

      try {
        setPageTranslating(true);
        restoreCachedTranslations(categories, pagedProducts);
        await translateCategoriesToJapanese(categories);
        await translateCurrentProductsToJapanese(pagedProducts);
      } finally {
        setPageTranslating(false);
      }
    };

    preloadJapaneseData();
  }, [language, categories, pagedProducts]);

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
      alert(t.loginRequired);
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

  const handleLogoClick = () => {
    window.location.href = "/";
  };

  const handleSearch = () => {
    const keyword = searchInput.trim();

    if (!keyword) {
      setSearch("");
      setPage(1);
      return;
    }

    const matchedCategory = findCategoryBySearchKeyword(keyword);

    if (matchedCategory) {
      setSelectedBigCategory(matchedCategory.bigCategory);
      setSelectedSubCategoryId(matchedCategory.subCategoryId);
      setSearch("");
      setSearchInput("");
      setPage(1);
      return;
    }

    setSearch(keyword);
    setSelectedSubCategoryId(null);
    setPage(1);
  };

  const handleBigCategoryClick = (bigCategory: string) => {
    setSelectedBigCategory(bigCategory);
    setSelectedSubCategoryId(null);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleSubCategoryClick = (id: number | null) => {
    setSelectedSubCategoryId(id);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleCartClick = () => {
    if (!user) {
      alert(t.cartLoginRequired);
      router.push("/login");
      return;
    }

    router.push("/cart");
  };

  const handleOrdersClick = () => {
    if (!user) {
      alert(t.ordersLoginRequired);
      router.push("/login");
      return;
    }

    router.push("/orders");
  };

  const selectedSubCategoryName =
    currentSubCategories.find(
      (cat) => Number(cat.id) === Number(selectedSubCategoryId)
    )?.name || "";

  const translatedSelectedSubCategoryName =
    selectedSubCategoryId && translatedCategoryNames[selectedSubCategoryId]
      ? translatedCategoryNames[selectedSubCategoryId]
      : selectedSubCategoryName;

  const currentCategoryLabel =
    search.trim().length > 0
      ? `${t.searchKeyword}: ${search}`
      : selectedSubCategoryId == null
      ? `${translatedBigCategoryName}`
      : language === "ja"
      ? translatedSelectedSubCategoryName || translatedBigCategoryName
      : selectedSubCategoryName || selectedBigCategory;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center text-gray-500">
        {uiText.ko.pageLoading}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <MainPopupBanner />

      <div className="bg-[#f1f1f1] border-b border-gray-200">
        <div className="max-w-7xl mx-auto h-10 px-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-5">
            <button
              onClick={() => alert(t.favoriteHint)}
              className="flex items-center gap-1 hover:text-black"
            >
              <Star size={14} />
              {t.favorite}
            </button>

            {!user ? (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="hover:text-black"
                >
                  {t.login}
                </button>

                <button
                  onClick={() => router.push("/signup")}
                  className="hover:text-black"
                >
                  {t.signup}
                </button>

                <button
                  onClick={() => router.push("/find-email")}
                  className="hover:text-black"
                >
                  {t.findIdPw}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/wishlist")}
                  className="hover:text-black"
                >
                  {t.wishlist}
                </button>

                {user.role === "ADMIN" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {t.admin}
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700"
                >
                  {t.logout}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-5">
            <button className="hover:text-black">{t.inquiry}</button>
            <button className="hover:text-black">{t.support}</button>

            <button
              onClick={handleToggleLanguage}
              disabled={pageTranslating}
              className="hover:text-black font-semibold disabled:opacity-50"
            >
              {pageTranslating ? t.languageLoading : t.languageButton}
            </button>
          </div>
        </div>
      </div>

      <header className="bg-[#f7f7f7]">
        <div className="max-w-7xl mx-auto px-4 h-[142px] flex items-center justify-between gap-8">
          <div className="w-[260px] shrink-0">
            <h1
              onClick={handleLogoClick}
              className="text-[42px] leading-none font-extrabold tracking-[-0.03em] cursor-pointer text-black"
            >
              sewon-mall
            </h1>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[470px] relative">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
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

              <span className="mt-2 text-[14px]">{t.cart}</span>
            </button>

            <button
              onClick={handleOrdersClick}
              className="flex flex-col items-center text-black hover:opacity-70"
            >
              <Truck size={34} strokeWidth={1.8} />
              <span className="mt-2 text-[14px]">{t.orders}</span>
            </button>

            <button
              onClick={() => router.push(user ? "/profile" : "/login")}
              className="flex flex-col items-center text-black hover:opacity-70"
            >
              <User size={34} strokeWidth={1.8} />
              <span className="mt-2 text-[14px]">{t.mypage}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-2">
          {bigCategories.map((bigCategory) => {
            const label =
              BIG_CATEGORY_LABELS[bigCategory]?.[language] || bigCategory;

            return (
              <button
                key={bigCategory}
                onClick={() => handleBigCategoryClick(bigCategory)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedBigCategory === bigCategory
                    ? "bg-black text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {showCategoryPanel && (
            <aside className="hidden md:block w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {t.bigCategory}
                    </p>

                    <h3 className="text-lg font-bold">
                      {translatedBigCategoryName}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowCategoryPanel(false)}
                    className="text-xs text-gray-500 hover:text-black"
                  >
                    {t.close}
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500">{t.subCategory}</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleSubCategoryClick(null)}
                    className={`w-full text-left px-4 py-3 rounded-xl ${
                      selectedSubCategoryId == null
                        ? "bg-black text-white"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {t.subAll}
                  </button>

                  {currentSubCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSubCategoryClick(Number(cat.id))}
                      className={`w-full text-left px-4 py-3 rounded-xl ${
                        selectedSubCategoryId === Number(cat.id)
                          ? "bg-black text-white"
                          : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {language === "ja"
                        ? translatedCategoryNames[cat.id] || cat.name
                        : cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          <section className="flex-1">
            {!showCategoryPanel && (
              <button
                onClick={() => setShowCategoryPanel(true)}
                className="mb-4 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm"
              >
                {t.openCategory}
              </button>
            )}

            <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">{t.selectedCategory}</p>
                <h2 className="text-2xl font-bold">{currentCategoryLabel}</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "latest", label: t.latest },
                  { key: "priceAsc", label: t.priceAsc },
                  { key: "priceDesc", label: t.priceDesc },
                  { key: "salesDesc", label: t.salesDesc },
                  { key: "ratingDesc", label: t.ratingDesc },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSortBy(item.key as SortType)}
                    className={`px-4 py-2 rounded-xl text-sm border ${
                      sortBy === item.key
                        ? "bg-black text-white border-black"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingProducts ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
                {t.loadingProducts}
              </div>
            ) : pagedProducts.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
                {t.emptyProducts}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {pagedProducts.map((product) => {
                  const wished = wishlistIds.includes(product.id);
                  const productName =
                    language === "ja"
                      ? translatedNames[product.id] || product.name
                      : product.name;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition group"
                    >
                      <div
                        onClick={() => router.push(`/products/${product.id}`)}
                        className="relative aspect-square bg-gray-100 cursor-pointer"
                      >
                        <img
                          src={getThumbnailSrc(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e) => {
                            e.currentTarget.src = "/no-image.png";
                          }}
                        />

                        {Number(product.stock || 0) <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                            {t.soldOut}
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(product.id);
                          }}
                          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow ${
                            wished
                              ? "bg-red-500 text-white"
                              : "bg-white text-gray-600"
                          }`}
                        >
                          <Heart
                            size={20}
                            fill={wished ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      <div className="p-4">
                        <button
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="text-left w-full"
                        >
                          <h3 className="font-semibold line-clamp-2 min-h-[48px]">
                            {productName}
                          </h3>
                        </button>

                        <div className="mt-2 flex items-center gap-2">
                          <StarRating rating={Number(product.avgRating || 0)} />

                          <span className="text-xs text-gray-500">
                            {Number(product.avgRating || 0).toFixed(1)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-2">
                          <div>
                            <p className="font-bold text-lg">
                              {Number(product.price || 0).toLocaleString()}원
                            </p>

                            <p className="text-xs text-gray-500">
                              {t.stock} {product.stock ?? 0} · {t.sales}{" "}
                              {product.salesCount ?? 0}
                            </p>
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