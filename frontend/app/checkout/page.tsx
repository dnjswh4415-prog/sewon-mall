"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { getCart } from "@/src/api/cart";
import { createOrder } from "@/src/api/orders";
import { getAddresses, createAddress } from "@/src/api/address";
import { useJapanesePageTranslation } from "@/src/hooks/useJapanesePageTranslation";
import { createPayPayCode } from "@/src/api/paypay";

const TOSS_CLIENT_KEY = "test_ck_E92LAa5PVbq2QDQozOB937YmpXyJ";
const DAUM_POSTCODE_SCRIPT =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

const CHECKOUT_ORDER_KEY = "sewon_checkout_client_order_key";
const CHECKOUT_CART_SIGNATURE_KEY = "sewon_checkout_cart_signature";
const PAYPAY_MERCHANT_PAYMENT_ID_KEY = "sewon_paypay_merchant_payment_id";

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
    daum?: any;
    }
  }

const pageText = {
  ko: {
    title: "주문서",
    goCart: "장바구니로",
    languageButton: "日本語",
    languageLoading: "번역 중...",
    loading: "주문서를 불러오는 중입니다...",
    shippingTitle: "배송지 선택",
    newAddressOpen: "새 배송지 입력",
    newAddressClose: "입력 폼 닫기",
    noAddresses: "등록된 배송지가 없습니다.",
    defaultAddress: "기본 배송지",
    recipient: "받는 분",
    phone: "연락처",
    zipcode: "우편번호",
    address1: "기본 주소",
    address2: "상세 주소",
    findZipcode: "우편번호 찾기",
    saveAsDefault: "기본 배송지로 저장",
    saveAddress: "배송지 저장",
    savingAddress: "저장 중...",
    orderItems: "주문 상품",
    quantityUnit: "수량",
    totalPayment: "총 결제 금액",
    payButton: "토스페이 결제하기",
    payPayButton: "PayPay로 결제하기",
    payingButton: "결제 요청 중...",
    postcodeLoadFail: "우편번호 서비스를 불러오지 못했습니다.",
    orderLoadFail: "주문서 정보를 불러오는 데 실패했습니다.",
    recipientRequired: "받는 분 이름을 입력해주세요.",
    phoneRequired: "연락처를 입력해주세요.",
    zipcodeRequired: "우편번호를 입력해주세요.",
    address1Required: "기본 주소를 입력해주세요.",
    addressSaved: "배송지가 저장되었습니다.",
    addressSaveFailed: "배송지 저장에 실패했습니다.",
    selectAddress: "배송지를 선택하거나 먼저 등록해주세요.",
    emptyCart: "장바구니에 상품이 없습니다.",
    paymentFailed: "결제 요청에 실패했습니다.",
    payPayLinkFailed: "PayPay 결제 링크를 받지 못했습니다.",
    orderNameFallback: "주문상품",
    customerFallback: "고객",
  },
  ja: {
    title: "注文書",
    goCart: "カートへ",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
    loading: "注文書を読み込み中です...",
    shippingTitle: "配送先選択",
    newAddressOpen: "新しい配送先入力",
    newAddressClose: "入力フォームを閉じる",
    noAddresses: "登録された配送先がありません。",
    defaultAddress: "基本配送先",
    recipient: "受取人",
    phone: "連絡先",
    zipcode: "郵便番号",
    address1: "基本住所",
    address2: "詳細住所",
    findZipcode: "郵便番号検索",
    saveAsDefault: "基本配送先として保存",
    saveAddress: "配送先を保存",
    savingAddress: "保存中...",
    orderItems: "注文商品",
    quantityUnit: "数量",
    totalPayment: "合計お支払い金額",
    payButton: "Toss Payで決済する",
    payPayButton: "PayPayで決済する",
    payingButton: "決済リクエスト中...",
    postcodeLoadFail: "郵便番号サービスを読み込めませんでした。",
    orderLoadFail: "注文書情報の読み込みに失敗しました。",
    recipientRequired: "受取人名を入力してください。",
    phoneRequired: "連絡先を入力してください。",
    zipcodeRequired: "郵便番号を入力してください。",
    address1Required: "基本住所を入力してください。",
    addressSaved: "配送先が保存されました。",
    addressSaveFailed: "配送先の保存に失敗しました。",
    selectAddress: "配送先を選択するか先に登録してください。",
    emptyCart: "カートに商品がありません。",
    paymentFailed: "決済リクエストに失敗しました。",
    payPayLinkFailed: "PayPay決済リンクを受け取れませんでした。",
    orderNameFallback: "注文商品",
    customerFallback: "お客様",
  },
} as const;

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

const getResolvedProductId = (item: any) => {
  return Number(item.productId ?? item.product?.id ?? 0);
};

const getResolvedVariantId = (item: any) => {
  if (item.variantId != null) return Number(item.variantId);
  if (item.variant?.id != null) return Number(item.variant.id);
  return null;
};

const getResolvedUnitPrice = (item: any) => {
  const resolvedVariantId = getResolvedVariantId(item);

  if (resolvedVariantId != null && item.variant?.price != null) {
    return Number(item.variant.price);
  }

  return Number(item.product?.price ?? 0);
};

const makeCartSignature = (items: any[]) => {
  return JSON.stringify(
    [...items]
      .map((item: any) => ({
        productId: getResolvedProductId(item),
        variantId: getResolvedVariantId(item),
        quantity: Number(item.quantity ?? 0),
      }))
      .sort((a, b) => {
        if (a.productId !== b.productId) return a.productId - b.productId;
        if ((a.variantId ?? 0) !== (b.variantId ?? 0)) {
          return (a.variantId ?? 0) - (b.variantId ?? 0);
        }
        return a.quantity - b.quantity;
      })
  );
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

  const translationItems = useMemo(() => {
    return [
      ...addresses.flatMap((address: any) => [
        {
          key: `address-recipient-${address.id}`,
          text: address?.recipient || "",
        },
        {
          key: `address1-${address.id}`,
          text: address?.address1 || "",
        },
        {
          key: `address2-${address.id}`,
          text: address?.address2 || "",
        },
      ]),
      ...cartItems.map((item: any) => ({
        key: `checkout-product-${item.id}`,
        text: item?.product?.name || "",
      })),
    ];
  }, [addresses, cartItems]);

  const {
    language,
    mounted,
    translating,
    getText,
    handleToggleLanguage,
  } = useJapanesePageTranslation({
    items: translationItems,
  });

  const pt = pageText[language];

  const selectedAddress = useMemo(() => {
    return (
      addresses.find((address: any) => address.id === selectedAddressId) || null
    );
  }, [addresses, selectedAddressId]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum: number, item: any) => {
      return sum + getResolvedUnitPrice(item) * Number(item.quantity);
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
          () => reject(new Error(pt.postcodeLoadFail)),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = DAUM_POSTCODE_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(pt.postcodeLoadFail));
      document.body.appendChild(script);
    });
  };

  const handleOpenPostcode = async () => {
    try {
      await loadPostcodeScript();

      const PostcodeConstructor =
        window.kakao?.Postcode || window.daum?.Postcode;

      if (!PostcodeConstructor) {
        alert(pt.postcodeLoadFail);
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
      alert(pt.postcodeLoadFail);
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

      const nextSignature = makeCartSignature(cartArray);

      if (typeof window !== "undefined") {
        const savedSignature = sessionStorage.getItem(CHECKOUT_CART_SIGNATURE_KEY);

        if (savedSignature !== nextSignature) {
          sessionStorage.removeItem(CHECKOUT_ORDER_KEY);
          sessionStorage.removeItem(PAYPAY_MERCHANT_PAYMENT_ID_KEY);
          sessionStorage.setItem(CHECKOUT_CART_SIGNATURE_KEY, nextSignature);
        }
      }

      const defaultAddress =
        addressArray.find((addr: any) => addr.isDefault) ||
        addressArray[0] ||
        null;

      setSelectedAddressId(defaultAddress?.id ?? null);

      if (addressArray.length === 0) {
        setShowAddressForm(true);
      }
    } catch (error) {
      console.error("주문서 데이터 로딩 실패:", error);
      alert(pt.orderLoadFail);
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
      alert(pt.recipientRequired);
      return;
    }

    if (!phone.trim()) {
      alert(pt.phoneRequired);
      return;
    }

    if (!zipcode.trim()) {
      alert(pt.zipcodeRequired);
      return;
    }

    if (!address1.trim()) {
      alert(pt.address1Required);
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
      alert(pt.addressSaved);
    } catch (error: any) {
      console.error("배송지 저장 실패:", error);
      alert(error?.response?.data?.message || pt.addressSaveFailed);
    } finally {
      setSavingAddress(false);
    }
  };

  const createPendingOrder = async () => {
    const payloadItems = cartItems.map((item: any) => ({
      cartItemId: item.id,
      productId: getResolvedProductId(item),
      rawProductId: item.productId,
      productObjId: item.product?.id,
      variantId: getResolvedVariantId(item),
      rawVariantId: item.variantId,
      variantObjId: item.variant?.id,
      unitPrice: getResolvedUnitPrice(item),
      productPrice: item.product?.price,
      variantPrice: item.variant?.price,
      quantity: Number(item.quantity),
      lineTotal: getResolvedUnitPrice(item) * Number(item.quantity),
    }));

    console.table(payloadItems);
    console.log("checkout totalPrice (front)", totalPrice);

    const clientOrderKey = getOrCreateClientOrderKey();
    console.log("clientOrderKey", clientOrderKey);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        CHECKOUT_CART_SIGNATURE_KEY,
        makeCartSignature(cartItems)
      );
    }

    const orderPayload = {
      addressId: Number(selectedAddressId),
      clientOrderKey,
      items: cartItems.map((item: any) => ({
        productId: getResolvedProductId(item),
        variantId: getResolvedVariantId(item),
        quantity: Number(item.quantity),
      })),
    };

    console.log("createOrder payload", orderPayload);

    const order = await createOrder(orderPayload);

    console.log("order.totalPrice (server)", Number(order.totalPrice));
    console.log("order.orderNumber (server)", order.orderNumber);
    console.log("front vs server diff", {
      frontTotalPrice: Number(totalPrice),
      serverTotalPrice: Number(order.totalPrice),
      diff: Number(order.totalPrice) - Number(totalPrice),
    });

    return order;
  };

  const validateCheckout = () => {
    if (isPaying) return false;

    if (!selectedAddressId) {
      alert(pt.selectAddress);
      return false;
    }

    if (!cartItems.length) {
      alert(pt.emptyCart);
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateCheckout()) return;

    try {
      setIsPaying(true);

      const order = await createPendingOrder();
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

      await tossPayments.requestPayment("카드", {
        amount: Number(order.totalPrice),
        orderId: order.orderNumber,
        orderName:
          cartItems.length > 1
            ? `${cartItems[0].product?.name} 외 ${cartItems.length - 1}건`
            : cartItems[0].product?.name || pt.orderNameFallback,
        customerName: selectedAddress?.recipient || pt.customerFallback,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error: any) {
      console.error("결제 요청 실패:", error);
      alert(error?.response?.data?.message || error?.message || pt.paymentFailed);
      setIsPaying(false);
    }
  };

  const handlePayPayPayment = async () => {
    if (!validateCheckout()) return;

    try {
      setIsPaying(true);

      const order = await createPendingOrder();
      const targetOrderId = Number(order?.id ?? order?.orderId);

      if (!targetOrderId) {
        console.error("createOrder response:", order);
        alert(pt.paymentFailed);
        setIsPaying(false);
        return;
      }

      const result = await createPayPayCode(targetOrderId);

      const payPayUrl =
        result?.data?.url ||
        result?.data?.deeplink ||
        result?.data?.urlScheme ||
        "";

      const merchantPaymentId =
        result?.merchantPaymentId ||
        result?.data?.merchantPaymentId ||
        order?.orderNumber ||
        "";

      if (!payPayUrl) {
        console.error("PayPay create-code response:", result);
        alert(pt.payPayLinkFailed);
        setIsPaying(false);
        return;
      }

      if (typeof window !== "undefined" && merchantPaymentId) {
        sessionStorage.setItem(
          PAYPAY_MERCHANT_PAYMENT_ID_KEY,
          merchantPaymentId
        );
      }

      window.location.href = payPayUrl;
    } catch (error: any) {
      console.error("PayPay 결제 생성 실패:", error);
      alert(error?.response?.data?.message || error?.message || pt.paymentFailed);
      setIsPaying(false);
    }
  };

  if (!mounted) {
    return <div className="p-10">{pageText.ko.loading}</div>;
  }

  if (loading) {
    return <div className="p-10">{pt.loading}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-extrabold">{pt.title}</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLanguage}
              disabled={translating}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {translating ? pt.languageLoading : pt.languageButton}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isPaying) return;
                router.push("/cart");
              }}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              disabled={isPaying}
            >
              {pt.goCart}
            </button>
          </div>
        </div>

        <section className="bg-white rounded-3xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{pt.shippingTitle}</h2>

            <button
              type="button"
              onClick={() => setShowAddressForm((prev) => !prev)}
              disabled={isPaying}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white disabled:opacity-50"
            >
              {showAddressForm ? pt.newAddressClose : pt.newAddressOpen}
            </button>
          </div>

          {addresses.length === 0 && !showAddressForm ? (
            <p className="text-gray-500">{pt.noAddresses}</p>
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
                      {getText(`address-recipient-${address.id}`, address.recipient)}
                      {address.isDefault && (
                        <span className="ml-2 text-xs text-blue-600">
                          {pt.defaultAddress}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{address.phone}</div>
                    <div className="text-sm text-gray-600">
                      ({address.zipcode}){" "}
                      {getText(`address1-${address.id}`, address.address1)}{" "}
                      {getText(`address2-${address.id}`, address.address2)}
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
                  placeholder={pt.recipient}
                  className="border rounded-xl px-4 py-3 bg-white"
                  disabled={isPaying || savingAddress}
                />

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={pt.phone}
                  className="border rounded-xl px-4 py-3 bg-white"
                  disabled={isPaying || savingAddress}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-4">
                <input
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  placeholder={pt.zipcode}
                  className="border rounded-xl px-4 py-3 bg-white"
                  readOnly
                />

                <input
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder={pt.address1}
                  className="border rounded-xl px-4 py-3 bg-white"
                  readOnly
                />

                <button
                  type="button"
                  onClick={handleOpenPostcode}
                  disabled={isPaying || savingAddress}
                  className="px-4 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
                >
                  {pt.findZipcode}
                </button>
              </div>

              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder={pt.address2}
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
                {pt.saveAsDefault}
              </label>

              <button
                type="button"
                onClick={handleCreateAddress}
                disabled={savingAddress || isPaying}
                className="px-5 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
              >
                {savingAddress ? pt.savingAddress : pt.saveAddress}
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">{pt.orderItems}</h2>

          <div className="space-y-4">
            {cartItems.map((item: any) => {
              const unitPrice = getResolvedUnitPrice(item);

              return (
                <div key={item.id} className="flex justify-between border-b pb-4">
                  <div>
                    <div className="font-semibold">
                      {getText(`checkout-product-${item.id}`, item.product?.name)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pt.quantityUnit} {item.quantity}개
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
            <span className="text-lg font-bold">{pt.totalPayment}</span>
            <span className="text-2xl font-extrabold">
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePayment}
              disabled={isPaying || loading || cartItems.length === 0}
              className="w-full h-14 rounded-2xl bg-black text-white font-semibold disabled:opacity-50"
            >
              {isPaying ? pt.payingButton : pt.payButton}
            </button>

            <button
              type="button"
              onClick={handlePayPayPayment}
              disabled={isPaying || loading || cartItems.length === 0}
              className="w-full h-14 rounded-2xl bg-red-500 border border-red-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {isPaying ? pt.payingButton : pt.payPayButton}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}