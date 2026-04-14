"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTopActions from "@/src/components/PageTopActions";
import { getMyReview, updateReview } from "@/src/api/review";

export default function ReviewEditPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchReview = async () => {
    try {
      setLoading(true);
      const data = await getMyReview(reviewId);
      setReview(data);
      setRating(Number(data?.rating ?? 5));
      setComment(data?.comment ?? "");
    } catch (error: any) {
      console.error("리뷰 조회 실패:", error);
      alert(error?.response?.data?.message || "리뷰 정보를 불러오지 못했습니다.");
      router.replace("/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isInteger(reviewId) || reviewId < 1) {
      alert("잘못된 접근입니다.");
      router.replace("/orders");
      return;
    }

    fetchReview();
  }, [reviewId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      await updateReview(reviewId, {
        rating,
        comment: comment.trim(),
      });

      alert("리뷰가 수정되었습니다.");
      router.replace("/orders");
      router.refresh();
    } catch (error: any) {
      console.error("리뷰 수정 실패:", error);
      alert(error?.response?.data?.message || "리뷰 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
            리뷰 정보를 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">리뷰 수정</h1>
            <p className="mt-1 text-sm text-gray-500">
              {review?.product?.name ?? "상품"} 리뷰를 수정합니다.
            </p>
          </div>

          <PageTopActions backFallbackHref="/orders" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
                disabled={saving}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "수정 중..." : "리뷰 수정"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}