"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "@/src/api/auth";
import PageTopActions from "@/src/components/PageTopActions";

export default function LoginPage() {
  const router = useRouter();

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
        setError("토큰을 받지 못했습니다.");
        return;
      }

      localStorage.setItem("token", result.token);

      router.replace("/");
      router.refresh();
    } catch (err: any) {
      console.error("로그인 실패:", err);

      if (err?.response?.status === 401) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setError(err?.response?.data?.message || "서버 오류가 발생했습니다.");
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

          <PageTopActions backFallbackHref="/" />
        </header>

        <div className="flex justify-center py-10">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-center mb-2">로그인</h1>
            <p className="text-sm text-gray-500 text-center mb-8">
              이메일과 비밀번호를 입력해주세요.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
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
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-500 flex justify-center gap-3">
              <Link href="/find-email" className="hover:text-black">
                아이디 찾기
              </Link>
              <span>|</span>
              <Link href="/reset-password" className="hover:text-black">
                비밀번호 찾기
              </Link>
            </div>

            <div className="mt-6 text-sm text-center text-gray-500">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="text-black font-semibold hover:underline"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}