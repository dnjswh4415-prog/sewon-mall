"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Language = "ko" | "ja";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  mounted: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "sewon_language";

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("ko");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem(STORAGE_KEY)
        : null;

    if (saved === "ko" || saved === "ja") {
      setLanguageState(saved);
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "ko" ? "ja" : "ko");
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      mounted,
    }),
    [language, mounted]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}