// Pure logic for the "Share link" feature: packing the editor's text into
// a URL and reading it back out. No DOM access beyond the URL constructor
// (available in Node too), so this is directly unit-testable.

// Encode UTF-8 text as URL-safe base64 (RFC 4648 §5, unpadded), so a
// shared link's hash needs no percent-encoding: pinyin's tone marks
// cost 6 characters apiece as %C7%90 etc. in plain UTF-8, but the
// same bytes cost under 2 characters apiece in base64.
export function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
// The inverse of toBase64Url. Throws on malformed input; callers
// catch that to fall back to the saved draft.
export function fromBase64Url(encoded) {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
// Read the shared text out of a location.hash-shaped string (leading
// '#' optional). Returns null when empty or malformed so callers can
// fall back to the saved draft.
export function readSharedText(hash) {
  const encoded = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!encoded) {
    return null;
  }
  try {
    return fromBase64Url(encoded);
  } catch {
    return null;
  }
}
// Decide what should be in the editor on load: a shared link's text
// wins over the saved draft, but does not itself become the draft
// until the visitor edits it (so the draft stays safe).
export function resolveInitialText(hash, storedDraft) {
  const shared = readSharedText(hash);
  if (shared !== null) {
    return { text: shared, fromShare: true };
  }
  return { text: storedDraft || '', fromShare: false };
}
// Build a shareable URL carrying the current text, base64url-encoded
// in the hash fragment. Not human-readable, but far shorter than the
// same text percent-encoded, and never sent to a server (fragments
// aren't included in HTTP requests).
export function buildShareUrl(text, href) {
  const url = new URL(href);
  url.search = '';
  url.hash = text ? toBase64Url(text) : '';
  return url.href;
}
