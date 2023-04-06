import { LanguageCode } from "../types/types";

export function languageCodeToString(languageCode: LanguageCode): string {
  switch (languageCode) {
    case LanguageCode.EN:
      return "English";
    case LanguageCode.FR:
      return "French";
    case LanguageCode.ES:
      return "Spanish";
    case LanguageCode.DE:
      return "German";
    case LanguageCode.KR:
      return "Korean";
    case LanguageCode.ZH:
      return "Chinese";
    default:
      return "";
  }
}
