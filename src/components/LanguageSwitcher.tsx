import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Globe } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { Language } from "@/i18n/translations";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18n();
  const currentLang = languages.find(l => l.code === language);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Globe className="h-4 w-4" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">
            {currentLang?.flag}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="end">
        <div className="flex flex-col gap-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors hover:bg-muted ${
                language === lang.code ? "bg-muted font-medium" : ""
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
