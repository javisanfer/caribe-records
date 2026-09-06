export const makeEditorialBlockId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export const createTextBlock = (text = "") => ({
  id: makeEditorialBlockId(),
  type: "paragraph",
  text,
});
