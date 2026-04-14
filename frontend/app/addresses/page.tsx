"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAddresses } from "@/src/api/address";
import PageTopActions from "@/src/components/PageTopActions";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await getAddresses();
        setAddresses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("배송지 조회 실패:", error);
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <p className="text-gray-500">배송지 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <PageTopActions backFallbackHref="/" />
          <h1 className="text-2xl font-bold">배송지 관리</h1>

          <div className="flex gap-3">
            <Link
              href="/profile"
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
            >
              마이페이지로
            </Link>
            <Link
              href="/addresses/new"
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
            >
              배송지 등록
            </Link>
          </div>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-gray-500 mb-4">등록된 배송지가 없습니다.</p>
            <Link
              href="/addresses/new"
              className="inline-flex px-4 py-2 rounded-xl bg-black text-white"
            >
              첫 배송지 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white border border-gray-200 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{address.recipient}</span>
                  {address.isDefault && (
                    <span className="text-xs px-2 py-1 rounded-full bg-black text-white">
                      기본배송지
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600">{address.phone}</div>
                <div className="text-sm text-gray-600 mt-1">
                  ({address.zipcode}) {address.address1} {address.address2}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}