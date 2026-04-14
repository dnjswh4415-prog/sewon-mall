import { translateText } from "@/src/api/translate";
import {
  getCachedTranslation,
  makeTranslationKey,
  setCachedTranslation,
} from "@/src/utils/translationCache";

export async function translateWithCache(payload: {
  text: string;
  direction: "koToJa" | "jaToKo";
}) {
  const trimmed = payload.text.trim();

  if (!trimmed) {
    return "";
  }

  const cacheKey = makeTranslationKey(payload.direction, trimmed);
  const cached = getCachedTranslation(cacheKey);

  if (cached) {
    return cached;
  }

  const result = await translateText({
    text: trimmed,
    direction: payload.direction,
  });

  const translated = result?.translatedText || trimmed;
  setCachedTranslation(cacheKey, translated);

  return translated;
}