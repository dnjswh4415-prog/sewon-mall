"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkEmailExists, signupUser } from "@/src/api/auth";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (pw: string) => {
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(pw);
  };

  useEffect(() => {
    if (password && !validatePassword(password)) {
      setPasswordError(
        "비밀번호는 8자 이상, 영문 + 숫자 + 특수문자를 포함해야 합니다."
      );
    } else {
      setPasswordError("");
    }

    if (passwordConfirm && password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordConfirmError("");
    }
  }, [password, passwordConfirm]);

  useEffect(() => {
    if (!email) {
      setEmailError("");
      setDuplicateEmail(false);
      return;
    }

    if (!email.includes("@")) {
      setEmailError("유효한 이메일을 입력해주세요.");
      setDuplicateEmail(false);
      return;
    }

    setEmailError("");

    const timer = setTimeout(async () => {
      try {
        const res = await checkEmailExists(email);
        setDuplicateEmail(!!res.exists);
      } catch (err) {
        console.error("이메일 중복 확인 실패:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (duplicateEmail) {
      setSubmitError("이미 사용 중인 이메일입니다.");
      return;
    }

    if (!validatePassword(password)) {
      setSubmitError("비밀번호 기준을 확인해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setSubmitError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);

      await signupUser({
        email,
        password,
        name,
        phone,
      });

      alert("회원가입 완료! 로그인 페이지로 이동합니다.");
      router.push("/login");
    } catch (err: any) {
      console.error("회원가입 실패:", err);
      setSubmitError(
        err?.response?.data?.message || "회원가입에 실패했습니다."
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
            <h1 className="text-2xl font-bold text-center mb-2">회원가입</h1>
            <p className="text-sm text-gray-500 text-center mb-8">
              회원 정보를 입력해주세요.
            </p>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
                {emailError && (
                  <p className="text-sm text-red-500 mt-2">{emailError}</p>
                )}
                {duplicateEmail && !emailError && (
                  <p className="text-sm text-orange-500 mt-2">
                    이미 사용 중인 이메일입니다.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  placeholder="영문 + 숫자 + 특수문자 8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-500 mt-2">{passwordError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
                  required
                />
                {passwordConfirmError && (
                  <p className="text-sm text-red-500 mt-2">
                    {passwordConfirmError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  placeholder="이름"
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

              {submitError && (
                <p className="text-sm text-red-500 text-center">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold mt-2 disabled:opacity-50"
              >
                {loading ? "가입 중..." : "회원가입"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}