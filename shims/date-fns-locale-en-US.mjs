/**
 * Shim for date-fns v2 locale to satisfy libraries that expect:
 * - default export
 * - named `enUS`
 */
export { default } from 'date-fns/locale/en-US';
export { default as enUS } from 'date-fns/locale/en-US';
export const defaultLocale = enUS;