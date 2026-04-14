"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageTopActions from "@/src/components/PageTopActions";
import { createReview } from "@/src/api/review";

export default function ReviewWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderItemId = useMemo(
    () => Number(searchParams.get("orderItemId")),
    [searchParams]
  );

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const isInvalidOrderItemId =
    !Number.isInteger(orderItemId) || orderItemId < 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isInvalidOrderItemId) {
      alert("주문 상품 정보가 올바르지 않습니다.");
      return;
    }

    if (!comment.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      await createReview({
        orderItemId,
        rating,
        comment: comment.trim(),
      });

      alert("리뷰가 등록되었습니다.");
      router.replace("/orders");
      router.refresh();
    } catch (error: any) {
      console.error("리뷰 등록 실패:", error);
      alert(error?.response?.data?.message || "리뷰 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">리뷰 작성</h1>
            <p className="mt-1 text-sm text-gray-500">
              배송중 또는 배송완료 상품만 리뷰를 작성할 수 있습니다.
            </p>
          </div>

          <PageTopActions backFallbackHref="/orders" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {isInvalidOrderItemId ? (
            <div className="text-sm text-red-500">
              잘못된 접근입니다. 주문 상품 정보가 없습니다.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  평점
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none focus:border-black"
                >
                  <option value={5}>5점</option>
                  <option value={4}>4점</option>
                  <option value={3}>3점</option>
                  <option value={2}>2점</option>
                  <option value={1}>1점</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  리뷰 내용
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  placeholder="상품에 대한 후기를 작성해주세요."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/orders")}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? "등록 중..." : "리뷰 등록"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}