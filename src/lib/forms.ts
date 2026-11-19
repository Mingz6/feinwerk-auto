// HTML `pattern` values. Browsers compile them with the `v` flag, where ( ) and - inside a class
// must be escaped; an invalid pattern is silently ignored. tests/dist.test.ts compiles every one.
/** Seven or more digits, with spaces, brackets, dots, dashes or a plus between them. */
export const PHONE_PATTERN = String.raw`[\s\(\)+.\-]*(?:\d[\s\(\)+.\-]*){7,}`;
/** Same rule as the booking provider: something@something.something. */
export const EMAIL_PATTERN = String.raw`[^\s@]+@[^\s@]+\.[^\s@]+`;
