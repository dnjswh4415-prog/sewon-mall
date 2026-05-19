"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAddress } from "@/src/api/address";
import PageTopActions from "@/src/components/PageTopActions";

declare global {
  interface Window {
    daum?: any;
  }
}

export default function NewAddressPage() {
  const router = useRouter();

  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src*="postcode.v2.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error("다음 주소 스크립트 로딩 실패");
      setError("주소 검색 서비스를 불러오지 못했습니다.");
    };

    document.body.appendChild(script);
  }, []);

  const handleSearchAddress = () => {
    if (!scriptLoaded || !window.daum) {
      alert("주소 검색 서비스를 아직 불러오는 중입니다.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname && data.bname !== "") {
            extraAddress += data.bname;
          }

          if (data.buildingName && data.buildingName !== "") {
            extraAddress += extraAddress
              ? `, ${data.buildingName}`
              : data.buildingName;
          }

          if (extraAddress) {
            fullAddress += ` (${extraAddress})`;
          }
        }

        setZipcode(data.zonecode);
        setAddress1(fullAddress);
      },
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recipient || !phone || !zipcode || !address1 || !address2) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      await createAddress({
        recipient,
        phone,
        zipcode,
        address1,
        address2,
        isDefault,
      });

      alert("배송지가 등록되었습니다.");
      router.push("/addresses");
      router.refresh();
    } catch (err: any) {
      console.error("배송지 등록 실패:", err);
      setError(err?.response?.data?.message || "배송지 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <PageTopActions backFallbackHref="/" />
          <h1 className="text-2xl font-bold">배송지 등록</h1>
          <Link
            href="/addresses"
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
          >
            배송지 목록
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수령인
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="수령인 이름"
                className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우편번호
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={zipcode}
                  readOnly
                  placeholder="우편번호 검색"
                  className="flex-1 h-12 px-4 rounded-xl border border-gray-300 bg-gray-50 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  className="px-5 h-12 rounded-xl bg-black text-white font-semibold hover:opacity-90"
                >
                  주소 검색
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기본 주소
              </label>
              <input
                type="text"
                value={address1}
                readOnly
                placeholder="주소 검색 버튼을 눌러주세요"
                className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-gray-50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상세 주소
              </label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="상세 주소를 입력하세요"
                className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:border-black bg-white"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              기본 배송지로 설정
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-black text-white font-semibold disabled:opacity-50"
            >
              {loading ? "등록 중..." : "배송지 등록"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}