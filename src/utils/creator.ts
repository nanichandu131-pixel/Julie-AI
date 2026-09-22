/**
 * Utility to identify questions about Julie AI's creator and developer.
 */
export function isCreatorQuery(rawText: string): boolean {
  if (!rawText || typeof rawText !== 'string') return false;

  const text = rawText
    .toLowerCase()
    .replace(/[?!.,;:_'"()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Target phrases requested by the user
  const exactPatterns = [
    'who is your creator',
    'who created you',
    'who is your developer',
    'who developed you',
    'who made you',
    'who built julie ai',
    // Helpful close variants
    'who built you',
    'who is the creator',
    'who is the developer',
    'who is julie ai creator',
    'who is your maker',
    'who created julie ai',
    'who developed julie ai',
    'who made julie ai',
    'who is the creator of julie ai',
    'who is the developer of julie ai',
    'creator of julie ai',
    'developer of julie ai',
    'tell me about your creator',
    'tell me who created you',
    'tell me who developed you',
    'who is sidda venkata sai tejashree',
  ];

  if (exactPatterns.some((pattern) => text.includes(pattern))) {
    return true;
  }

  // Regex pattern matching: "who [is your / created / developed / built / made] [you / julie ai]"
  const creatorRegex =
    /\bwho\s+(is\s+(your|the)\s+(creator|developer|maker|builder)|(created|developed|built|made)\s+(you|julie(\s+ai)?))\b/i;

  return creatorRegex.test(text);
}
