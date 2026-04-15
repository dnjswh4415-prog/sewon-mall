"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/src/api/auth";
import PageTopActions from "@/src/components/PageTopActions";
import { useLanguage } from "@/src/contexts/LanguageContext";

const pageText = {
  ko: {
    title: "로그인",
    subtitle: "이메일과 비밀번호를 입력해주세요.",
    email: "이메일",
    password: "비밀번호",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "비밀번호를 입력하세요",
    login: "로그인",
    loading: "로그인 중...",
    tokenError: "토큰을 받지 못했습니다.",
    invalidCredentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    serverError: "서버 오류가 발생했습니다.",
    findEmail: "아이디 찾기",
    resetPassword: "비밀번호 찾기",
    noAccount: "계정이 없으신가요?",
    signup: "회원가입",
    languageButton: "日本語",
  },
  ja: {
    title: "ログイン",
    subtitle: "メールアドレスとパスワードを入力してください。",
    email: "メールアドレス",
    password: "パスワード",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "パスワードを入力してください",
    login: "ログイン",
    loading: "ログイン中...",
    tokenError: "トークンを受け取れませんでした。",
    invalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
    serverError: "サーバーエラーが発生しました。",
    findEmail: "ID検索",
    resetPassword: "パスワード再設定",
    noAccount: "アカウントをお持ちでないですか？",
    signup: "会員登録",
    languageButton: "한국어",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { language, toggleLanguage, mounted } = useLanguage();

  const currentLanguage = mounted ? language : "ko";
  const t = pageText[currentLanguage];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(email, password);

      if (!result?.token) {
        console.error("login result =", result);
        setError(t.tokenError);
        return;
      }

      localStorage.setItem("token", result.token);

      router.replace("/");
      router.refresh();
    } catch (err: any) {
      console.error("로그인 실패:", err);

      if (err?.response?.status === 401) {
        setError(t.invalidCredentials);
      } else {
        setError(
          currentLanguage === "ja"
            ? t.serverError
            : err?.response?.data?.message || t.serverError
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-7xl mx-auto px-4">
        <header className="h-24 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[34px] font-extrabold tracking-[-0.03em] text-black"
          >
            sewon-mall
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium"
            >
              {t.languageButton}
            </button>
            <PageTopActions backFallbackHref="/" />
          </div>
        </header>

        <div className="flex justify-center py-10">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-center mb-2">{t.title}</h1>
            <p className="text-sm text-gray-500 text-center mb-8">
              {t.subtitle}
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.email}
                </label>
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center mt-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold mt-2 disabled:opacity-50"
              >
                {loading ? t.loading : t.login}
              </button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-500 flex justify-center gap-3">
              <Link href="/find-email" className="hover:text-black">
                {t.findEmail}
              </Link>
              <span>|</span>
              <Link href="/reset-password" className="hover:text-black">
                {t.resetPassword}
              </Link>
            </div>

            <div className="mt-6 text-sm text-center text-gray-500">
              {t.noAccount}{" "}
              <Link
                href="/signup"
                className="text-black font-semibold hover:underline"
              >
                {t.signup}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}