"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkEmailExists, signupUser } from "@/src/api/auth";
import PageTopActions from "@/src/components/PageTopActions";
import { useLanguage } from "@/src/contexts/LanguageContext";

const pageText = {
  ko: {
    title: "회원가입",
    subtitle: "회원 정보를 입력해주세요.",
    email: "이메일",
    password: "비밀번호",
    passwordConfirm: "비밀번호 확인",
    name: "이름",
    phone: "전화번호",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "영문 + 숫자 + 특수문자 8자 이상",
    passwordConfirmPlaceholder: "비밀번호를 다시 입력해주세요",
    namePlaceholder: "이름",
    phonePlaceholder: "01012345678",
    submit: "회원가입",
    loading: "가입 중...",
    invalidEmail: "유효한 이메일을 입력해주세요.",
    duplicateEmail: "이미 사용 중인 이메일입니다.",
    passwordRule:
      "비밀번호는 8자 이상, 영문 + 숫자 + 특수문자를 포함해야 합니다.",
    passwordMismatch: "비밀번호가 일치하지 않습니다.",
    passwordCheck: "비밀번호 기준을 확인해주세요.",
    signupSuccess: "회원가입 완료! 로그인 페이지로 이동합니다.",
    signupFail: "회원가입에 실패했습니다.",
    languageButton: "日本語",
  },
  ja: {
    title: "会員登録",
    subtitle: "会員情報を入力してください。",
    email: "メールアドレス",
    password: "パスワード",
    passwordConfirm: "パスワード確認",
    name: "名前",
    phone: "電話番号",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "英字 + 数字 + 記号を含む8文字以上",
    passwordConfirmPlaceholder: "パスワードをもう一度入力してください",
    namePlaceholder: "名前",
    phonePlaceholder: "01012345678",
    submit: "会員登録",
    loading: "登録中...",
    invalidEmail: "有効なメールアドレスを入力してください。",
    duplicateEmail: "すでに使用中のメールアドレスです。",
    passwordRule:
      "パスワードは8文字以上で、英字・数字・記号を含める必要があります。",
    passwordMismatch: "パスワードが一致しません。",
    passwordCheck: "パスワード条件を確認してください。",
    signupSuccess: "会員登録が完了しました。ログインページへ移動します。",
    signupFail: "会員登録に失敗しました。",
    languageButton: "한국어",
  },
} as const;

export default function SignupPage() {
  const router = useRouter();
  const { language, toggleLanguage, mounted } = useLanguage();

  const currentLanguage = mounted ? language : "ko";
  const t = pageText[currentLanguage];

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
      setPasswordError(t.passwordRule);
    } else {
      setPasswordError("");
    }

    if (passwordConfirm && password !== passwordConfirm) {
      setPasswordConfirmError(t.passwordMismatch);
    } else {
      setPasswordConfirmError("");
    }
  }, [password, passwordConfirm, currentLanguage]);

  useEffect(() => {
    if (!email) {
      setEmailError("");
      setDuplicateEmail(false);
      return;
    }

    if (!email.includes("@")) {
      setEmailError(t.invalidEmail);
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
  }, [email, currentLanguage]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (duplicateEmail) {
      setSubmitError(t.duplicateEmail);
      return;
    }

    if (!validatePassword(password)) {
      setSubmitError(t.passwordCheck);
      return;
    }

    if (password !== passwordConfirm) {
      setSubmitError(t.passwordMismatch);
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

      alert(t.signupSuccess);
      router.push("/login");
    } catch (err: any) {
      console.error("회원가입 실패:", err);
      setSubmitError(
        currentLanguage === "ja"
          ? t.signupFail
          : err?.response?.data?.message || t.signupFail
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

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
                {emailError && (
                  <p className="text-sm text-red-500 mt-2">{emailError}</p>
                )}
                {duplicateEmail && !emailError && (
                  <p className="text-sm text-orange-500 mt-2">
                    {t.duplicateEmail}
                  </p>
                )}
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
                {passwordError && (
                  <p className="text-sm text-red-500 mt-2">{passwordError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.passwordConfirm}
                </label>
                <input
                  type="password"
                  placeholder={t.passwordConfirmPlaceholder}
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

              {submitError && (
                <p className="text-sm text-red-500 text-center">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold mt-2 disabled:opacity-50"
              >
                {loading ? t.loading : t.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}