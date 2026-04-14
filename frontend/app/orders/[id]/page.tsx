"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, Package, Truck } from "lucide-react";
import { cancelOrder, getOrderDetail } from "@/src/api/orders";
import DeliveryProgress from "@/src/components/DeliveryProgress";
import { translateText } from "@/src/api/translate";

type OrderItemOption = {
  id: number;
  value: {
    id: number;
    value: string;
    option: {
      id: number;
      name: string;
    };
  };
};

type OrderItemVariant = {
  id: number;
  sku: string;
  options?: OrderItemOption[];
};

type OrderItemProduct = {
  id: number;
  name: string;
  imageUrl?: string | null;
};

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: OrderItemProduct;
  variant?: OrderItemVariant | null;
};

type OrderAddress = {
  id: number;
  recipient: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2: string;
};

type Order = {
  id: number;
  orderNumber: string;
  totalPrice: number;
  status: string;
  paymentKey?: string | null;
  paidAt?: string | null;
  deliveryCompany?: string | null;
  trackingNumber?: string | null;
  createdAt: string;
  address?: OrderAddress | null;
  items: OrderItem[];
};

const API_BASE_URL = "http://localhost:5000";

const statusLabelMap = {
  ko: {
    PENDING_PAYMENT: "결제대기",
    PAYMENT_COMPLETE: "배송출고",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    CANCELLED: "주문취소",
    RETURNED: "반품완료",
    REFUNDED: "환불완료",
  },
  ja: {
    PENDING_PAYMENT: "決済待ち",
    PAYMENT_COMPLETE: "発送準備",
    SHIPPING: "配送中",
    DELIVERED: "配送完了",
    CANCELLED: "注文キャンセル",
    RETURNED: "返品完了",
    REFUNDED: "返金完了",
  },
} as const;

const detailText = {
  ko: {
    back: "뒤로가기",
    home: "홈으로",
    orderNumber: "주문번호",
    orderDate: "주문일시",
    orderProducts: "주문 상품",
    noImage: "이미지 없음",
    quantity: "수량",
    itemPrice: "상품금액",
    paymentInfo: "결제 정보",
    orderStatus: "주문 상태",
    totalPrice: "총 결제금액",
    paidAt: "결제 완료일",
    paymentKey: "결제키",
    shippingInfo: "배송 정보",
    recipient: "수령인",
    phone: "연락처",
    address: "배송지",
    courier: "택배사",
    trackingNumber: "송장번호",
    noAddress: "배송지 정보가 없습니다.",
    quickMenu: "빠른 이동",
    goOrders: "주문 목록으로",
    goCart: "장바구니로",
    cancelOrder: "주문취소",
    cancelLoading: "취소 처리 중...",
    shippingUpdating: "배송 상태가 업데이트되고 있습니다.",
    notFound: "주문 정보를 찾을 수 없습니다.",
    loading: "주문 정보를 불러오는 중입니다...",
    languageButton: "日本語",
    languageLoading: "번역 중...",
    sku: "SKU",
  },
  ja: {
    back: "戻る",
    home: "ホームへ",
    orderNumber: "注文番号",
    orderDate: "注文日時",
    orderProducts: "注文商品",
    noImage: "画像なし",
    quantity: "数量",
    itemPrice: "商品金額",
    paymentInfo: "決済情報",
    orderStatus: "注文状態",
    totalPrice: "合計金額",
    paidAt: "決済完了日",
    paymentKey: "決済キー",
    shippingInfo: "配送情報",
    recipient: "受取人",
    phone: "連絡先",
    address: "配送先",
    courier: "配送会社",
    trackingNumber: "追跡番号",
    noAddress: "配送先情報がありません。",
    quickMenu: "クイックメニュー",
    goOrders: "注文一覧へ",
    goCart: "カートへ",
    cancelOrder: "注文キャンセル",
    cancelLoading: "キャンセル処理中...",
    shippingUpdating: "配送状態が更新されています。",
    notFound: "注文情報が見つかりません。",
    loading: "注文情報を読み込み中です...",
    languageButton: "한국어",
    languageLoading: "翻訳中...",
    sku: "SKU",
  },
} as const;

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [language, setLanguage] = useState<"ko" | "ja">("ko");
  const [detailTranslating, setDetailTranslating] = useState(false);

  const [translatedProductNames, setTranslatedProductNames] = useState<
    Record<number, string>
  >({});
  const [translatedOptionNames, setTranslatedOptionNames] = useState<
    Record<number, string>
  >({});
  const [translatedOptionValues, setTranslatedOptionValues] = useState<
    Record<number, string>
  >({});
  const [translatedRecipient, setTranslatedRecipient] = useState("");
  const [translatedAddress1, setTranslatedAddress1] = useState("");
  const [translatedAddress2, setTranslatedAddress2] = useState("");
  const [translatedCourier, setTranslatedCourier] = useState("");

  const dt = detailText[language];

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const found = await getOrderDetail(orderId);
        setOrder(found || null);
      } catch (error) {
        console.error("주문 상세 조회 실패:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const normalizeImageUrl = (url?: string | null) => {
    if (!url) return "/no-image.png";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (url.startsWith("/uploads/")) {
      return `${API_BASE_URL}${url}`;
    }

    if (url.startsWith("uploads/")) {
      return `${API_BASE_URL}/${url}`;
    }

    return "/no-image.png";
  };

  const statusLabel = useMemo(() => {
    if (!order) return "";
    return statusLabelMap[language][order.status as keyof (typeof statusLabelMap)["ko"]] || order.status;
  }, [order, language]);

  const canCancel =
    order?.status === "PAYMENT_COMPLETE" || order?.status === "SHIPPING";

  const handleCancel = async () => {
    if (!order) return;

    const ok = confirm(
      language === "ja"
        ? "本当に注文をキャンセルしますか？"
        : "정말 주문을 취소하시겠습니까?"
    );
    if (!ok) return;

    try {
      setCancelLoading(true);
      await cancelOrder(order.id);
      alert(
        language === "ja"
          ? "注文がキャンセルされました。"
          : "주문이 취소되었습니다."
      );

      const refreshed = await getOrderDetail(order.id);
      setOrder(refreshed);
    } catch (error: any) {
      console.error("주문 취소 실패:", error);
      alert(
        error?.response?.data?.message ||
          (language === "ja"
            ? "注文キャンセルに失敗しました。"
            : "주문 취소에 실패했습니다.")
      );
    } finally {
      setCancelLoading(false);
    }
  };

  const handleToggleLanguage = async () => {
    if (!order) return;

    if (language === "ja") {
      setLanguage("ko");
      return;
    }

    try {
      setDetailTranslating(true);

      for (const item of order.items) {
        if (!translatedProductNames[item.id] && item.product?.name) {
          try {
            const result = await translateText({
              text: item.product.name,
              direction: "koToJa",
            });

            setTranslatedProductNames((prev) => ({
              ...prev,
              [item.id]: result?.translatedText || item.product.name,
            }));
          } catch (error) {
            console.error("상품명 번역 실패:", error);
          }
        }

        if (Array.isArray(item.variant?.options)) {
          for (const opt of item.variant.options) {
            if (!translatedOptionNames[opt.value.option.id] && opt.value.option.name) {
              try {
                const result = await translateText({
                  text: opt.value.option.name,
                  direction: "koToJa",
                });

                setTranslatedOptionNames((prev) => ({
                  ...prev,
                  [opt.value.option.id]: result?.translatedText || opt.value.option.name,
                }));
              } catch (error) {
                console.error("옵션명 번역 실패:", error);
              }
            }

            if (!translatedOptionValues[opt.value.id] && opt.value.value) {
              try {
                const result = await translateText({
                  text: opt.value.value,
                  direction: "koToJa",
                });

                setTranslatedOptionValues((prev) => ({
                  ...prev,
                  [opt.value.id]: result?.translatedText || opt.value.value,
                }));
              } catch (error) {
                console.error("옵션값 번역 실패:", error);
              }
            }
          }
        }
      }

      if (order.address?.recipient && !translatedRecipient) {
        try {
          const result = await translateText({
            text: order.address.recipient,
            direction: "koToJa",
          });
          setTranslatedRecipient(result?.translatedText || order.address.recipient);
        } catch (error) {
          console.error("수령인 번역 실패:", error);
        }
      }

      if (order.address?.address1 && !translatedAddress1) {
        try {
          const result = await translateText({
            text: order.address.address1,
            direction: "koToJa",
          });
          setTranslatedAddress1(result?.translatedText || order.address.address1);
        } catch (error) {
          console.error("주소1 번역 실패:", error);
        }
      }

      if (order.address?.address2 && !translatedAddress2) {
        try {
          const result = await translateText({
            text: order.address.address2,
            direction: "koToJa",
          });
          setTranslatedAddress2(result?.translatedText || order.address.address2);
        } catch (error) {
          console.error("주소2 번역 실패:", error);
        }
      }

      if (order.deliveryCompany && !translatedCourier) {
        try {
          const result = await translateText({
            text: order.deliveryCompany,
            direction: "koToJa",
          });
          setTranslatedCourier(result?.translatedText || order.deliveryCompany);
        } catch (error) {
          console.error("택배사 번역 실패:", error);
        }
      }

      setLanguage("ja");
    } catch (error: any) {
      console.error("주문 상세 일본어 전환 실패:", error);
      alert(
        error?.response?.data?.message ||
          (language === "ja"
            ? "翻訳に失敗しました。"
            : "일본어 번역에 실패했습니다.")
      );
    } finally {
      setDetailTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">{dt.loading}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{dt.notFound}</p>
          <Link
            href="/orders"
            className="inline-flex px-4 py-2 rounded-xl bg-black text-white"
          >
            {dt.goOrders}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            {dt.back}
          </button>

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Home size={18} />
            {dt.home}
          </button>

          <button
            onClick={handleToggleLanguage}
            disabled={detailTranslating}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            {detailTranslating ? dt.languageLoading : dt.languageButton}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">{dt.orderNumber}</p>
                  <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                  <p className="text-sm text-gray-500 mt-2">
                    {dt.orderDate}: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-full bg-black text-white text-sm font-semibold w-fit">
                  {statusLabel}
                </div>
              </div>

              <DeliveryProgress status={order.status} />
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-5">{dt.orderProducts}</h2>

              <div className="space-y-4">
                {order.items.map((item) => {
                  const optionText =
                    item.variant?.options?.length
                      ? item.variant.options
                          .map((opt: OrderItemOption) => {
                            const optionName =
                              language === "ja"
                                ? translatedOptionNames[opt.value.option.id] ||
                                  opt.value.option.name
                                : opt.value.option.name;

                            const optionValue =
                              language === "ja"
                                ? translatedOptionValues[opt.value.id] ||
                                  opt.value.value
                                : opt.value.value;

                            return `${optionName}: ${optionValue}`;
                          })
                          .join(" / ")
                      : "";

                  const productName =
                    language === "ja"
                      ? translatedProductNames[item.id] || item.product?.name
                      : item.product?.name;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-2xl p-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {item.product?.imageUrl ? (
                            <img
                              src={normalizeImageUrl(item.product.imageUrl)}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/no-image.png";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              {dt.noImage}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base">
                            {productName}
                          </div>

                          {optionText && (
                            <div className="text-sm text-gray-500 mt-1">
                              {optionText}
                            </div>
                          )}

                          {item.variant?.sku && (
                            <div className="text-xs text-gray-400 mt-1">
                              {dt.sku}: {item.variant.sku}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>
                              {dt.quantity} {item.quantity}개
                            </span>
                            <span>
                              {dt.itemPrice} {Number(item.price).toLocaleString()}원
                            </span>
                          </div>

                          <div className="mt-2 text-lg font-bold">
                            {(Number(item.price) * Number(item.quantity)).toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-5">{dt.paymentInfo}</h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{dt.orderStatus}</span>
                  <span className="font-semibold">{statusLabel}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{dt.totalPrice}</span>
                  <span className="font-semibold">
                    {Number(order.totalPrice).toLocaleString()}원
                  </span>
                </div>

                {order.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{dt.paidAt}</span>
                    <span className="font-semibold">
                      {new Date(order.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {order.paymentKey && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-gray-500 mb-1">{dt.paymentKey}</p>
                    <p className="text-xs break-all text-gray-700">
                      {order.paymentKey}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-5">{dt.shippingInfo}</h2>

              {order.address ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">{dt.recipient}</p>
                    <p className="font-semibold">
                      {language === "ja"
                        ? translatedRecipient || order.address.recipient
                        : order.address.recipient}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">{dt.phone}</p>
                    <p className="font-semibold">{order.address.phone}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">{dt.address}</p>
                    <p className="font-semibold">
                      ({order.address.zipcode}){" "}
                      {language === "ja"
                        ? translatedAddress1 || order.address.address1
                        : order.address.address1}{" "}
                      {language === "ja"
                        ? translatedAddress2 || order.address.address2
                        : order.address.address2}
                    </p>
                  </div>

                  {(order.deliveryCompany || order.trackingNumber) && (
                    <div className="pt-3 border-t border-gray-100">
                      {order.deliveryCompany && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500">{dt.courier}</span>
                          <span className="font-semibold">
                            {language === "ja"
                              ? translatedCourier || order.deliveryCompany
                              : order.deliveryCompany}
                          </span>
                        </div>
                      )}

                      {order.trackingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">{dt.trackingNumber}</span>
                          <span className="font-semibold">
                            {order.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{dt.noAddress}</p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} />
                <h2 className="text-lg font-bold">{dt.quickMenu}</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Link
                  href="/orders"
                  className="h-12 rounded-2xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  {dt.goOrders}
                </Link>

                <Link
                  href="/cart"
                  className="h-12 rounded-2xl border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  {dt.goCart}
                </Link>

                <Link
                  href="/"
                  className="h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:opacity-90"
                >
                  {dt.home}
                </Link>

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="h-12 rounded-2xl bg-red-500 text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {cancelLoading ? dt.cancelLoading : dt.cancelOrder}
                  </button>
                )}
              </div>

              {(order.status === "SHIPPING" || order.status === "DELIVERED") && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Truck size={16} />
                  {dt.shippingUpdating}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}