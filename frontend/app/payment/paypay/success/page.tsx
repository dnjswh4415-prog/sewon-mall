"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  confirmPayPayPayment,
  getPayPayStatus,
} from "@/src/api/paypay";

const CHECKOUT_ORDER_KEY = "sewon_checkout_client_order_key";
const CHECKOUT_CART_SIGNATURE_KEY = "sewon_checkout_cart_signature";
const PAYPAY_MERCHANT_PAYMENT_ID_KEY = "sewon_paypay_merchant_payment_id";

export default function PayPaySuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRunRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("PayPay 결제 상태를 확인 중입니다...");

  const clearCheckoutState = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CHECKOUT_ORDER_KEY);
      sessionStorage.removeItem(CHECKOUT_CART_SIGNATURE_KEY);
      sessionStorage.removeItem(PAYPAY_MERCHANT_PAYMENT_ID_KEY);
    }
  };

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      try {
        const merchantPaymentId =
          searchParams.get("merchantPaymentId") ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem(PAYPAY_MERCHANT_PAYMENT_ID_KEY)
            : "") ||
          searchParams.get("orderNumber") ||
          "";

        if (!merchantPaymentId) {
          setMessage("merchantPaymentId가 없습니다.");
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        const statusResult = await getPayPayStatus(merchantPaymentId);
        const paymentData = statusResult?.data ?? {};
        const status = String(paymentData?.status ?? "UNKNOWN");

        if (status !== "COMPLETED") {
          setMessage(`PayPay 결제가 완료 상태가 아닙니다. 현재 상태: ${status}`);
          setIsSuccess(false);
          setLoading(false);
          return;
        }

        const confirmResult = await confirmPayPayPayment(merchantPaymentId);

        clearCheckoutState();
        setMessage(confirmResult?.message || "PayPay 결제가 완료되었습니다.");
        setIsSuccess(true);
      } catch (error: any) {
        console.error("PayPay 결제 확인 실패:", error);
        setMessage(
          error?.response?.data?.message || "PayPay 결제 확인에 실패했습니다."
        );
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 p-8 text-center shadow-sm">
        {loading ? (
          <>
            <h1 className="text-2xl font-bold mb-4">PayPay 결제 확인 중</h1>
            <p className="text-gray-600">{message}</p>
          </>
        ) : isSuccess ? (
          <>
            <h1 className="text-2xl font-bold mb-3">PayPay 결제가 완료되었습니다</h1>
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
            <h1 className="text-2xl font-bold mb-3">PayPay 결제 처리 실패</h1>
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