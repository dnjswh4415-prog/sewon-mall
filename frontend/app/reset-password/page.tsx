"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/src/api/auth";

export default function ResetPasswordPage() {
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

      setMessage(result.message || "비밀번호가 성공적으로 변경되었습니다.");
      setEmail("");
      setName("");
      setPhone("");
      setNewPassword("");
    } catch (err: any) {
      console.error("비밀번호 재설정 실패:", err);
      setError(
        err?.response?.data?.message || "비밀번호 재설정에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-7xl mx-auto px-4">
        <header className="h-24 flex items-center">
          <Link
            href="/"
            className="text-[34px] font-extrabold tracking-[-0.03em] text-black"
          >
            sewon-mall
          </Link>
        </header>

        <div className="flex justify-center py-10">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-center mb-2">
              비밀번호 재설정
            </h1>
            <p className="text-sm text-gray-500 text-center mb-8">
              가입 정보 확인 후 새 비밀번호를 설정해주세요.
            </p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
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
                  이름
                </label>
                <input
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <input
                  type="text"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
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
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-500 flex justify-center gap-3">
              <Link href="/login" className="hover:text-black">
                로그인
              </Link>
              <span>|</span>
              <Link href="/find-email" className="hover:text-black">
                아이디 찾기
              </Link>
            </div>

            <div className="mt-6 text-sm text-center text-gray-500">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-black font-semibold hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}