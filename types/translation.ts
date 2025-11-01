export interface TranslationHistory {
  id: string;
  original_text: string;
  translated_text: string;
  target_language: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTranslationRequest {
  original_text: string;
  translated_text: string;
  target_language: string;
}
