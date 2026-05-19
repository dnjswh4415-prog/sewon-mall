"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const CHECKOUT_ORDER_KEY = "sewon_checkout_client_order_key";
const CHECKOUT_CART_SIGNATURE_KEY = "sewon_checkout_cart_signature";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const rawMessage = searchParams.get("message");

  const message = rawMessage
    ? decodeURIComponent(rawMessage)
    : "다시 시도해주세요.";

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHECKOUT_ORDER_KEY);
      sessionStorage.removeItem(CHECKOUT_CART_SIGNATURE_KEY);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold mb-3">결제에 실패했습니다</h1>

        <div className="text-left bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8">
          <p className="text-sm text-gray-500 mb-2">에러 코드</p>
          <p className="font-semibold mb-4">{code || "-"}</p>

          <p className="text-sm text-gray-500 mb-2">사유</p>
          <p className="font-semibold">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/cart")}
            className="w-full h-12 rounded-xl bg-black text-white font-semibold"
          >
            장바구니로 가기
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full h-12 rounded-xl border border-gray-300 bg-white font-semibold"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
          <p className="text-gray-500">결제 실패 페이지를 불러오는 중입니다...</p>
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}