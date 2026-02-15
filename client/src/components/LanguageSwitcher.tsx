import { useLanguage } from '../i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('he')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          language === 'he'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
        }`}
      >
        HE
      </button>
    </div>
  );
}
