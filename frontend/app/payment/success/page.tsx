"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPayment } from "@/src/api/payments";

const CHECKOUT_ORDER_KEY = "sewon_checkout_client_order_key";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRunRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("결제를 확인하는 중입니다...");

  const clearCheckoutKey = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHECKOUT_ORDER_KEY);
    }
  };

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const runConfirm = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      const amountValue = Number(amount);

      if (
        !paymentKey ||
        !orderId ||
        !amount ||
        !Number.isFinite(amountValue) ||
        amountValue <= 0
      ) {
        clearCheckoutKey();
        setMessage("결제 성공 정보가 올바르지 않습니다.");
        setIsSuccess(false);
        setLoading(false);
        return;
      }

      try {
        const result = await confirmPayment({
          paymentKey,
          orderId,
          amount: amountValue,
        });

        clearCheckoutKey();
        setMessage(result?.message || "결제가 완료되었습니다.");
        setIsSuccess(true);
      } catch (error: any) {
        console.error("결제 승인 실패:", error);
        console.error("백엔드 응답:", error?.response?.data);

        // 서버가 정상 응답한 비즈니스 에러는 키 정리
        if (error?.response) {
          clearCheckoutKey();
        }

        setMessage(
          error?.response?.data?.message || "결제 승인에 실패했습니다."
        );
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    runConfirm();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm">
        {loading ? (
          <>
            <h1 className="text-2xl font-bold mb-4">결제 확인 중</h1>
            <p className="text-gray-600">{message}</p>
          </>
        ) : isSuccess ? (
          <>
            <h1 className="text-2xl font-bold mb-3">결제가 완료되었습니다</h1>
            <p className="text-gray-600 mb-8">{message}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/orders")}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold"
              >
                주문내역 확인하기
              </button>

              <button
                onClick={() => router.push("/")}
                className="w-full h-12 rounded-xl border border-gray-300 bg-white font-semibold"
              >
                홈으로 가기
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-3">결제 처리 실패</h1>
            <p className="text-gray-600 mb-8">{message}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/orders")}
                className="w-full h-12 rounded-xl bg-black text-white font-semibold"
              >
                주문내역 확인하기
              </button>

              <button
                onClick={() => router.push("/")}
                className="w-full h-12 rounded-xl border border-gray-300 bg-white font-semibold"
              >
                홈으로 가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}