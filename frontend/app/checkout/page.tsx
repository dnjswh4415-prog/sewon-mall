"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { getCart } from "@/src/api/cart";
import { createOrder } from "@/src/api/orders";
import { getAddresses, createAddress } from "@/src/api/address";

const TOSS_CLIENT_KEY = "test_ck_E92LAa5PVbq2QDQozOB937YmpXyJ";
const DAUM_POSTCODE_SCRIPT =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
const CHECKOUT_ORDER_KEY = "sewon_checkout_client_order_key";

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: {
        oncomplete: (data: any) => void;
        onclose?: (state: string) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        open: () => void;
      };
    };
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: any) => void;
        onclose?: (state: string) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        open: () => void;
      };
    };
  }
}

const getOrCreateClientOrderKey = () => {
  if (typeof window === "undefined") return "";

  const existing = sessionStorage.getItem(CHECKOUT_ORDER_KEY);
  if (existing) return existing;

  const newKey =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  sessionStorage.setItem(CHECKOUT_ORDER_KEY, newKey);
  return newKey;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  const selectedAddress = useMemo(() => {
    return addresses.find((address: any) => address.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum: number, item: any) => {
      const unitPrice =
        item.variant?.price != null
          ? Number(item.variant.price)
          : Number(item.product?.price ?? 0);

      return sum + unitPrice * Number(item.quantity);
    }, 0);
  }, [cartItems]);

  const loadPostcodeScript = async () => {
    if (typeof window === "undefined") return;

    if (window.kakao?.Postcode || window.daum?.Postcode) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${DAUM_POSTCODE_SCRIPT}"]`
      ) as HTMLScriptElement | null;

      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("우편번호 스크립트 로드 실패")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = DAUM_POSTCODE_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("우편번호 스크립트 로드 실패"));
      document.body.appendChild(script);
    });
  };

  const handleOpenPostcode = async () => {
    try {
      await loadPostcodeScript();

      const PostcodeConstructor =
        window.kakao?.Postcode || window.daum?.Postcode;

      if (!PostcodeConstructor) {
        alert("우편번호 서비스를 불러오지 못했습니다.");
        return;
      }

      new PostcodeConstructor({
        oncomplete: (data: any) => {
          const mainAddress = data.roadAddress || data.address || "";
          let extraAddress = "";

          if (data.bname && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }

          if (data.buildingName && data.apartment === "Y") {
            extraAddress += extraAddress
              ? `, ${data.buildingName}`
              : data.buildingName;
          }

          const finalAddress = extraAddress
            ? `${mainAddress} (${extraAddress})`
            : mainAddress;

          setZipcode(data.zonecode || "");
          setAddress1(finalAddress);
        },
      }).open();
    } catch (error) {
      console.error("우편번호 서비스 실행 실패:", error);
      alert("우편번호 서비스를 불러오지 못했습니다.");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [cartData, addressData] = await Promise.all([
        getCart(),
        getAddresses(),
      ]);

      const cartArray = Array.isArray(cartData) ? cartData : [];
      const addressArray = Array.isArray(addressData) ? addressData : [];

      setCartItems(cartArray);
      setAddresses(addressArray);

      const defaultAddress =
        addressArray.find((addr: any) => addr.isDefault) || addressArray[0] || null;

      setSelectedAddressId(defaultAddress?.id ?? null);

      if (addressArray.length === 0) {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error("주문서 데이터 로딩 실패:", error);
      alert("주문서 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetAddressForm = () => {
    setRecipient("");
    setPhone("");
    setZipcode("");
    setAddress1("");
    setAddress2("");
    setIsDefault(true);
  };

  const handleCreateAddress = async () => {
    if (savingAddress) return;

    if (!recipient.trim()) {
      alert("받는 분 이름을 입력해주세요.");
      return;
    }

    if (!phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    if (!zipcode.trim()) {
      alert("우편번호를 입력해주세요.");
      return;
    }

    if (!address1.trim()) {
      alert("기본 주소를 입력해주세요.");
      return;
    }

    try {
      setSavingAddress(true);

      const newAddress = await createAddress({
        recipient: recipient.trim(),
        phone: phone.trim(),
        zipcode: zipcode.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        isDefault,
      });

      const nextAddresses = await getAddresses();
      const addressArray = Array.isArray(nextAddresses) ? nextAddresses : [];

      setAddresses(addressArray);

      const newId =
        newAddress?.id ||
        addressArray.find(
          (addr: any) =>
            addr.recipient === recipient.trim() &&
            addr.phone === phone.trim() &&
            addr.address1 === address1.trim()
        )?.id;

      if (newId) {
        setSelectedAddressId(Number(newId));
      }

      setShowAddressForm(false);
      resetAddressForm();
      alert("배송지가 저장되었습니다.");
    } catch (error: any) {
      console.error("배송지 저장 실패:", error);
      alert(error?.response?.data?.message || "배송지 저장에 실패했습니다.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePayment = async () => {
    if (isPaying) return;

    if (!selectedAddressId) {
      alert("배송지를 선택하거나 먼저 등록해주세요.");
      return;
    }

    if (!cartItems.length) {
      alert("장바구니에 상품이 없습니다.");
      return;
    }

    try {
      setIsPaying(true);

      const clientOrderKey = getOrCreateClientOrderKey();

      const order = await createOrder({
        addressId: Number(selectedAddressId),
        clientOrderKey,
        items: cartItems.map((item: any) => ({
          productId: Number(item.productId),
          variantId: item.variantId ? Number(item.variantId) : null,
          quantity: Number(item.quantity),
        })),
      });

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

      await tossPayments.requestPayment("카드", {
        amount: Number(order.totalPrice),
        orderId: order.orderNumber,
        orderName:
          cartItems.length > 1
            ? `${cartItems[0].product?.name} 외 ${cartItems.length - 1}건`
            : cartItems[0].product?.name || "주문상품",
        customerName: selectedAddress?.recipient || "고객",
        successUrl: "http://localhost:3000/payment/success",
        failUrl: "http://localhost:3000/payment/fail",
      });
    } catch (error: any) {
      console.error("결제 요청 실패:", error);
      alert(error?.response?.data?.message || error?.message || "결제 요청에 실패했습니다.");
      setIsPaying(false);
    }
  };

  if (loading) {
    return <div className="p-10">주문서를 불러오는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold">주문서</h1>
          <button
            type="button"
            onClick={() => {
              if (isPaying) return;
              router.push("/cart");
            }}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            disabled={isPaying}
          >
            장바구니로
          </button>
        </div>

        <section className="bg-white rounded-3xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">배송지 선택</h2>

            <button
              type="button"
              onClick={() => setShowAddressForm((prev) => !prev)}
              disabled={isPaying}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white disabled:opacity-50"
            >
              {showAddressForm ? "입력 폼 닫기" : "새 배송지 입력"}
            </button>
          </div>

          {addresses.length === 0 && !showAddressForm ? (
            <p className="text-gray-500">등록된 배송지가 없습니다.</p>
          ) : null}

          {addresses.length > 0 && (
            <div className="space-y-3 mb-6">
              {addresses.map((address: any) => (
                <label
                  key={address.id}
                  className="flex items-start gap-3 border rounded-2xl p-4 cursor-pointer"
                >
                  <input
                    type="radio"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    disabled={isPaying}
                  />
                  <div>
                    <div className="font-semibold">
                      {address.recipient}
                      {address.isDefault && (
                        <span className="ml-2 text-xs text-blue-600">기본 배송지</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{address.phone}</div>
                    <div className="text-sm text-gray-600">
                      ({address.zipcode}) {address.address1} {address.address2}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {showAddressForm && (
            <div className="border rounded-2xl p-4 space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="받는 분"
                  className="border rounded-xl px-4 py-3 bg-white"
                  disabled={isPaying || savingAddress}
                />

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="연락처"
                  className="border rounded-xl px-4 py-3 bg-white"
                  disabled={isPaying || savingAddress}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-4">
                <input
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  placeholder="우편번호"
                  className="border rounded-xl px-4 py-3 bg-white"
                  readOnly
                />

                <input
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="기본 주소"
                  className="border rounded-xl px-4 py-3 bg-white"
                  readOnly
                />

                <button
                  type="button"
                  onClick={handleOpenPostcode}
                  disabled={isPaying || savingAddress}
                  className="px-4 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
                >
                  우편번호 찾기
                </button>
              </div>

              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="상세 주소"
                className="w-full border rounded-xl px-4 py-3 bg-white"
                disabled={isPaying || savingAddress}
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={isPaying || savingAddress}
                />
                기본 배송지로 저장
              </label>

              <button
                type="button"
                onClick={handleCreateAddress}
                disabled={savingAddress || isPaying}
                className="px-5 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
              >
                {savingAddress ? "저장 중..." : "배송지 저장"}
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">주문 상품</h2>

          <div className="space-y-4">
            {cartItems.map((item: any) => {
              const unitPrice =
                item.variant?.price != null
                  ? Number(item.variant.price)
                  : Number(item.product?.price ?? 0);

              return (
                <div key={item.id} className="flex justify-between border-b pb-4">
                  <div>
                    <div className="font-semibold">{item.product?.name}</div>
                    <div className="text-sm text-gray-500">
                      수량 {item.quantity}개
                    </div>
                  </div>
                  <div className="font-bold">
                    {(unitPrice * Number(item.quantity)).toLocaleString()}원
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-bold">총 결제 금액</span>
            <span className="text-2xl font-extrabold">
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          <button
            type="button"
            onClick={handlePayment}
            disabled={isPaying || loading || cartItems.length === 0}
            className="w-full h-14 rounded-2xl bg-black text-white font-semibold disabled:opacity-50"
          >
            {isPaying ? "결제 요청 중..." : "토스페이 결제하기"}
          </button>
        </section>
      </div>
    </div>
  );
}