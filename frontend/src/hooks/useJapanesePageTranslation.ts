"use client";

import { useEffect, useMemo, useState } from "react";
import { translateText } from "@/src/api/translate";
import { useLanguage } from "@/src/contexts/LanguageContext";

const TRANSLATION_CACHE_KEY = "sewon_translation_cache_v1";

type Direction = "koToJa" | "jaToKo";

type TranslationItem = {
  key: string;
  text: string | null | undefined;
};

type UseJapanesePageTranslationParams = {
  items: TranslationItem[];
};

type TranslationCache = Record<string, string>;

function getTranslationCache(): TranslationCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(TRANSLATION_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setTranslationCache(cache: TranslationCache) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function makeTranslationKey(direction: Direction, text: string) {
  return `${direction}::${text.trim()}`;
}

export function useJapanesePageTranslation({
  items,
}: UseJapanesePageTranslationParams) {
  const { language, setLanguage, mounted } = useLanguage();
  const [translating, setTranslating] = useState(false);
  const [translatedMap, setTranslatedMap] = useState<Record<string, string>>({});

  const itemsSignature = JSON.stringify(
    items.map((item) => ({
      key: item.key,
      text: String(item.text ?? "").trim(),
    }))
  );

  const normalizedItems = useMemo(() => {
    try {
      return JSON.parse(itemsSignature) as { key: string; text: string }[];
    } catch {
      return [];
    }
  }, [itemsSignature]);

  const mergeTranslatedMap = (updates: Record<string, string>) => {
    if (Object.keys(updates).length === 0) return;

    setTranslatedMap((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [key, value] of Object.entries(updates)) {
        if (next[key] !== value) {
          next[key] = value;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  };

  const restoreCachedTranslations = () => {
    const cache = getTranslationCache();
    const restored: Record<string, string> = {};

    for (const item of normalizedItems) {
      if (!item.key || !item.text) continue;

      const cacheKey = makeTranslationKey("koToJa", item.text);
      if (cache[cacheKey]) {
        restored[item.key] = cache[cacheKey];
      }
    }

    mergeTranslatedMap(restored);
  };

  const translateAllToJapanese = async () => {
    try {
      setTranslating(true);

      const cache = getTranslationCache();
      const updates: Record<string, string> = {};

      for (const item of normalizedItems) {
        if (!item.key || !item.text) continue;
        if (translatedMap[item.key]) continue;

        const cacheKey = makeTranslationKey("koToJa", item.text);

        if (cache[cacheKey]) {
          updates[item.key] = cache[cacheKey];
          continue;
        }

        try {
          const result = await translateText({
            text: item.text,
            direction: "koToJa",
          });

          const translated = result?.translatedText || item.text;
          cache[cacheKey] = translated;
          updates[item.key] = translated;
        } catch (error) {
          console.error(`번역 실패: ${item.key}`, error);
        }
      }

      setTranslationCache(cache);
      mergeTranslatedMap(updates);
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    restoreCachedTranslations();
  }, [mounted, itemsSignature]);

  useEffect(() => {
    const run = async () => {
      if (!mounted) return;
      if (language !== "ja") return;
      await translateAllToJapanese();
    };

    run();
  }, [mounted, language, itemsSignature]);

  const handleToggleLanguage = async () => {
    if (language === "ja") {
      setLanguage("ko");
      return;
    }

    await translateAllToJapanese();
    setLanguage("ja");
  };

  const getText = (key: string, fallback: string | null | undefined) => {
    const original = String(fallback ?? "");
    if (language !== "ja") return original;
    return translatedMap[key] || original;
  };

  return {
    language,
    mounted,
    translating,
    translatedMap,
    getText,
    handleToggleLanguage,
  };
}