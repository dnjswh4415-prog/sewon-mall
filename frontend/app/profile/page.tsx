"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Heart,
  ShoppingBag,
  MapPin,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { getProfile } from "@/src/api/auth";
import { useJapanesePageTranslation } from "@/src/hooks/useJapanesePageTranslation";

const pageText = {
  ko: {
    logout: "로그아웃",
    loading: "마이페이지를 불러오는 중입니다...",
    roleAdmin: "관리자",
    roleUser: "일반회원",
    orders: "주문 내역",
    wishlist: "찜 목록",
    cart: "장바구니",
    addresses: "배송지 관리",
    adminPage: "관리자 페이지",
    memberInfo: "회원 정보",
    name: "이름",
    email: "이메일",
    phone: "전화번호",
    role: "권한",
    shortcuts: "바로가기",
    ordersDesc: "주문 상태와 배송 정보를 확인해보세요.",
    wishlistDesc: "관심 상품을 모아보고 바로 이동할 수 있어요.",
    cartDesc: "담아둔 상품을 확인하고 주문을 진행하세요.",
    addressesDesc: "기본 배송지와 추가 배송지를 관리할 수 있어요.",
    languageButton: "日本語",
    languageLoading: "번역 중...",
  },
  ja: {
    logout: "ログアウト",
    loading: "マイページを読み込み中です...",
    roleAdmin: "管理者",
    roleUser: "一般会員",
    orders: "注文履歴",
    wishlist: "お気に入り一覧",
    cart: "カート",
    addresses: "配送先管理",
    adminPage: "管理者ページ",
    memberInfo: "会員情報",
    name: "名前",
    email: "メール",
    phone: "電話番号",
    role: "権限",
    shortcuts: "ショートカット",
    ordersDesc: "注文状態と配送情報を確認できます。",
    wishlistDesc: "気になる商品をまとめて確認して移動できます。",
    cartDesc: "カートの商品を確認して注文できます。",
    addressesDesc: "基本配送先と追加配送先を管理できます。",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
  },
} as const;

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    language,
    mounted,
    translating,
    getText,
    handleToggleLanguage,
  } = useJapanesePageTranslation({
    items: [
      { key: "userName", text: user?.name },
      { key: "userEmail", text: user?.email },
      { key: "userPhone", text: user?.phone },
      { key: "ordersDesc", text: pageText.ko.ordersDesc },
      { key: "wishlistDesc", text: pageText.ko.wishlistDesc },
      { key: "cartDesc", text: pageText.ko.cartDesc },
      { key: "addressesDesc", text: pageText.ko.addressesDesc },
    ],
  });

  const pt = pageText[language];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setUser(data);
      } catch (error) {
        console.error("마이페이지 사용자 정보 조회 실패:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
    router.refresh();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">{pageText.ko.loading}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">{pt.loading}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-7xl mx-auto px-4">
        <header className="h-24 flex items-center justify-between">
          <Link
            href="/"
            className="text-[34px] font-extrabold tracking-[-0.03em] text-black"
          >
            sewon-mall
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleLanguage}
              disabled={translating}
              className="text-sm text-gray-600 hover:text-black disabled:opacity-50"
            >
              {translating ? pt.languageLoading : pt.languageButton}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
            >
              <LogOut size={16} />
              {pt.logout}
            </button>
          </div>
        </header>

        <div className="py-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 rounded-3xl p-6 h-fit">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <User size={42} className="text-gray-500" />
              </div>

              <h2 className="text-xl font-bold">
                {getText("userName", user.name)}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {getText("userEmail", user.email)}
              </p>

              <div className="mt-4 px-3 py-1 rounded-full bg-black text-white text-xs font-semibold">
                {user.role === "ADMIN" ? pt.roleAdmin : pt.roleUser}
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <Link
                href="/orders"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200"
              >
                <ShoppingBag size={18} />
                <span>{pt.orders}</span>
              </Link>

              <Link
                href="/wishlist"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200"
              >
                <Heart size={18} />
                <span>{pt.wishlist}</span>
              </Link>

              <Link
                href="/cart"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200"
              >
                <ShoppingCart size={18} />
                <span>{pt.cart}</span>
              </Link>

              <Link
                href="/addresses"
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200"
              >
                <MapPin size={18} />
                <span>{pt.addresses}</span>
              </Link>

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                >
                  <ShieldCheck size={18} />
                  <span>{pt.adminPage}</span>
                </Link>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-5">{pt.memberInfo}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-2 text-gray-700">
                    <User size={18} />
                    <span className="text-sm font-medium">{pt.name}</span>
                  </div>
                  <p className="text-base font-semibold">
                    {getText("userName", user.name)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-2 text-gray-700">
                    <Mail size={18} />
                    <span className="text-sm font-medium">{pt.email}</span>
                  </div>
                  <p className="text-base font-semibold break-all">
                    {getText("userEmail", user.email)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-2 text-gray-700">
                    <Phone size={18} />
                    <span className="text-sm font-medium">{pt.phone}</span>
                  </div>
                  <p className="text-base font-semibold">
                    {getText("userPhone", user.phone)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-2 text-gray-700">
                    <ShieldCheck size={18} />
                    <span className="text-sm font-medium">{pt.role}</span>
                  </div>
                  <p className="text-base font-semibold">
                    {user.role === "ADMIN" ? pt.roleAdmin : pt.roleUser}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-5">{pt.shortcuts}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Link
                  href="/orders"
                  className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm hover:bg-gray-50 transition"
                >
                  <ShoppingBag className="mb-3" />
                  <h4 className="font-semibold mb-1">{pt.orders}</h4>
                  <p className="text-sm text-gray-500">
                    {getText("ordersDesc", pageText.ko.ordersDesc)}
                  </p>
                </Link>

                <Link
                  href="/wishlist"
                  className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm hover:bg-gray-50 transition"
                >
                  <Heart className="mb-3" />
                  <h4 className="font-semibold mb-1">{pt.wishlist}</h4>
                  <p className="text-sm text-gray-500">
                    {getText("wishlistDesc", pageText.ko.wishlistDesc)}
                  </p>
                </Link>

                <Link
                  href="/cart"
                  className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm hover:bg-gray-50 transition"
                >
                  <ShoppingCart className="mb-3" />
                  <h4 className="font-semibold mb-1">{pt.cart}</h4>
                  <p className="text-sm text-gray-500">
                    {getText("cartDesc", pageText.ko.cartDesc)}
                  </p>
                </Link>

                <Link
                  href="/addresses"
                  className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm hover:bg-gray-50 transition"
                >
                  <MapPin className="mb-3" />
                  <h4 className="font-semibold mb-1">{pt.addresses}</h4>
                  <p className="text-sm text-gray-500">
                    {getText("addressesDesc", pageText.ko.addressesDesc)}
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}