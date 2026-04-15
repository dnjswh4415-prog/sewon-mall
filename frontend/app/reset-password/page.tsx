"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/src/api/auth";
import PageTopActions from "@/src/components/PageTopActions";
import { useLanguage } from "@/src/contexts/LanguageContext";

const pageText = {
  ko: {
    title: "비밀번호 재설정",
    subtitle: "가입 정보 확인 후 새 비밀번호를 설정해주세요.",
    email: "이메일",
    name: "이름",
    phone: "전화번호",
    newPassword: "새 비밀번호",
    emailPlaceholder: "you@example.com",
    namePlaceholder: "이름을 입력하세요",
    phonePlaceholder: "01012345678",
    newPasswordPlaceholder: "새 비밀번호를 입력하세요",
    submit: "비밀번호 변경",
    loading: "변경 중...",
    success: "비밀번호가 성공적으로 변경되었습니다.",
    fail: "비밀번호 재설정에 실패했습니다.",
    login: "로그인",
    findEmail: "아이디 찾기",
    noAccount: "계정이 없으신가요?",
    signup: "회원가입",
    languageButton: "日本語",
  },
  ja: {
    title: "パスワード再設定",
    subtitle: "登録情報を確認して新しいパスワードを設定してください。",
    email: "メールアドレス",
    name: "名前",
    phone: "電話番号",
    newPassword: "新しいパスワード",
    emailPlaceholder: "you@example.com",
    namePlaceholder: "名前を入力してください",
    phonePlaceholder: "01012345678",
    newPasswordPlaceholder: "新しいパスワードを入力してください",
    submit: "パスワード変更",
    loading: "変更中...",
    success: "パスワードが正常に変更されました。",
    fail: "パスワード再設定に失敗しました。",
    login: "ログイン",
    findEmail: "ID検索",
    noAccount: "アカウントをお持ちでないですか？",
    signup: "会員登録",
    languageButton: "한국어",
  },
} as const;

export default function ResetPasswordPage() {
  const { language, toggleLanguage, mounted } = useLanguage();

  const currentLanguage = mounted ? language : "ko";
  const t = pageText[currentLanguage];

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await resetPassword({
        email,
        name,
        phone,
        newPassword,
      });

      setMessage(
        currentLanguage === "ja"
          ? t.success
          : result.message || t.success
      );

      setEmail("");
      setName("");
      setPhone("");
      setNewPassword("");
    } catch (err: any) {
      console.error("비밀번호 재설정 실패:", err);
      setError(
        currentLanguage === "ja"
          ? t.fail
          : err?.response?.data?.message || t.fail
      );
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

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
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
                  {t.name}
                </label>
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.phone}
                </label>
                <input
                  type="text"
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.newPassword}
                </label>
                <input
                  type="password"
                  placeholder={t.newPasswordPlaceholder}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center mt-1">{error}</p>
              )}

              {message && (
                <p className="text-sm text-green-600 text-center mt-1">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold mt-2 disabled:opacity-50"
              >
                {loading ? t.loading : t.submit}
              </button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-500 flex justify-center gap-3">
              <Link href="/login" className="hover:text-black">
                {t.login}
              </Link>
              <span>|</span>
              <Link href="/find-email" className="hover:text-black">
                {t.findEmail}
              </Link>
            </div>

            <div className="mt-6 text-sm text-center text-gray-500">
              {t.noAccount}{" "}
              <Link href="/signup" className="text-black font-semibold hover:underline">
                {t.signup}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}