const CACHE_KEY = "sewon_translation_cache_v1";

type TranslationCache = Record<string, string>;

function getCache(): TranslationCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(cache: TranslationCache) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function getCachedTranslation(key: string) {
  const cache = getCache();
  return cache[key] || null;
}

export function setCachedTranslation(key: string, value: string) {
  const cache = getCache();
  cache[key] = value;
  setCache(cache);
}

export function makeTranslationKey(direction: "koToJa" | "jaToKo", text: string) {
  return `${direction}::${text.trim()}`;
}