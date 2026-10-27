export type ProviderId = 'platform' | 'openai' | 'gemini' | 'groq';
export type ProviderStatus = {
  id: ProviderId;
  label: string;
  connection: 'platform' | 'oauth' | 'api-key';
  note: string;
};

// UX definitions only. Do not imply that unsupported consumer OAuth flows exist.
export const providerOptions: ProviderStatus[] = [
  { id: 'platform', label: 'Platform AI', connection: 'platform', note: 'Use an explicitly available free allowance. No paid fallback.' },
  { id: 'openai', label: 'OpenAI / ChatGPT', connection: 'oauth', note: 'Account-based inference is only available where OpenAI officially supports and approves the integration; otherwise an API key may be required.' },
  { id: 'gemini', label: 'Google Gemini', connection: 'oauth', note: 'Google sign-in alone does not guarantee Gemini API access; API access may require project setup or an API key.' },
  { id: 'groq', label: 'Groq', connection: 'api-key', note: 'Standard API access generally uses a Groq API key. Never enter your Groq password here.' }
];
