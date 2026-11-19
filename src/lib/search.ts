/** Lower case without accents, so "Révision" matches "revision". */
export const fold = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Every word of the query appears in the text; an empty query matches everything. */
export const matches = (query: string, text: string): boolean => {
  const hay = fold(text);
  return fold(query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};
