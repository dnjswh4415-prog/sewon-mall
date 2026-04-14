"use client";

import { useRouter } from "next/navigation";

type PageTopActionsProps = {
  showHome?: boolean;
  showBack?: boolean;
  homeHref?: string;
  backFallbackHref?: string;
};

export default function PageTopActions({
  showHome = true,
  showBack = true,
  homeHref = "/",
  backFallbackHref = "/",
}: PageTopActionsProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backFallbackHref);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
        >
          뒤로가기
        </button>
      )}

      {showHome && (
        <button
          type="button"
          onClick={() => router.push(homeHref)}
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
        >
          홈으로
        </button>
      )}
    </div>
  );
}