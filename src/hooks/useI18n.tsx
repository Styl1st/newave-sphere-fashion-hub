import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language } from "@/i18n/translations";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  isTransitioning: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "newave-language";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "en" || stored === "fr")) {
      return stored as Language;
    }
    // Default to browser language or English
    const browserLang = navigator.language.split("-")[0];
    return browserLang === "fr" ? "fr" : "en";
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setLanguage = (lang: Language) => {
    if (lang === language) return;
    
    // Start transition animation
    setIsTransitioning(true);
    
    // Change language after fade out
    setTimeout(() => {
      setLanguageState(lang);
      localStorage.setItem(STORAGE_KEY, lang);
      
      // End transition after fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 150);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Cast to match the expected type structure
  const t = translations[language] as typeof translations.en;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isTransitioning }}>
      <div 
        className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ minHeight: '100vh' }}
      >
        {children}
      </div>
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
