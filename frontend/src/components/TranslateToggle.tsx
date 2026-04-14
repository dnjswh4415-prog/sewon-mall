"use client";

import { useState } from "react";
import { translateText } from "@/src/api/translate";

type TranslateToggleProps = {
  text: string;
  direction?: "koToJa" | "jaToKo";
  emptyMessage?: string;
  className?: string;
};

export default function TranslateToggle({
  text,
  direction = "koToJa",
  emptyMessage = "번역할 내용이 없습니다.",
  className = "",
}: TranslateToggleProps) {
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslated, setIsTranslated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleTranslate = async () => {
    const trimmed = String(text ?? "").trim();

    if (!trimmed) {
      alert(emptyMessage);
      return;
    }

    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    try {
      setLoading(true);

      if (!translatedText) {
        const result = await translateText({
          text: trimmed,
          direction,
        });

        setTranslatedText(result?.translatedText || "");
      }

      setIsTranslated(true);
    } catch (error: any) {
      console.error("번역 실패:", error);
      alert(error?.response?.data?.message || "번역에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleToggleTranslate}
        disabled={loading}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {loading
          ? "번역 중..."
          : isTranslated
          ? "원문 보기"
          : "일본어 번역"}
      </button>

      <div className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
        {isTranslated ? translatedText : text}
      </div>
    </div>
  );
}