const LANG_TO_BCP47: Record<string, string> = {
  English: 'en-US',
  French: 'fr-FR',
  Spanish: 'es-ES',
  German: 'de-DE',
  Portuguese: 'pt-BR',
  Italian: 'it-IT',
  Ukrainian: 'uk-UA',
  Polish: 'pl-PL',
};

export function langToSpeechCode(lang: string): string {
  return LANG_TO_BCP47[lang] ?? 'en-US';
}
