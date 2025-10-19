/**
 * RTL (Right-to-Left) Support Utilities
 * Provides utilities for Hebrew and Arabic language support
 */

export type Direction = 'ltr' | 'rtl';

export interface RTLConfig {
  direction: Direction;
  locale: string;
  isRTL: boolean;
}

// Supported RTL languages
export const RTL_LANGUAGES = [
  'ar', // Arabic
  'he', // Hebrew
  'fa', // Persian
  'ur', // Urdu
  'ku', // Kurdish
] as const;

export type RTLLanguage = typeof RTL_LANGUAGES[number];

/**
 * Check if a language code is RTL
 */
export function isRTLLanguage(locale: string): boolean {
  return RTL_LANGUAGES.includes(locale as RTLLanguage);
}

/**
 * Get text direction from locale
 */
export function getDirection(locale: string): Direction {
  return isRTLLanguage(locale) ? 'rtl' : 'ltr';
}

/**
 * Create RTL configuration
 */
export function createRTLConfig(locale: string): RTLConfig {
  const direction = getDirection(locale);
  return {
    direction,
    locale,
    isRTL: direction === 'rtl',
  };
}

/**
 * RTL-aware CSS properties
 */
export const rtlProperties = {
  marginStart: 'margin-inline-start',
  marginEnd: 'margin-inline-end',
  paddingStart: 'padding-inline-start',
  paddingEnd: 'padding-inline-end',
  borderStart: 'border-inline-start',
  borderEnd: 'border-inline-end',
  textAlign: 'text-align',
  float: 'float',
  clear: 'clear',
} as const;

/**
 * Get RTL-aware CSS class names
 */
export function getRTLClasses(isRTL: boolean, classes: string): string {
  if (!isRTL) return classes;
  
  return classes
    .replace(/\bml-\d+/g, (match) => match.replace('ml-', 'ms-'))
    .replace(/\bmr-\d+/g, (match) => match.replace('mr-', 'me-'))
    .replace(/\bpl-\d+/g, (match) => match.replace('pl-', 'ps-'))
    .replace(/\bpr-\d+/g, (match) => match.replace('pr-', 'pe-'))
    .replace(/\btext-left/g, 'text-start')
    .replace(/\btext-right/g, 'text-end')
    .replace(/\bfloat-left/g, 'float-start')
    .replace(/\bfloat-right/g, 'float-end');
}

/**
 * RTL-aware spacing utilities
 */
export const rtlSpacing = {
  start: (value: string) => ({ marginInlineStart: value }),
  end: (value: string) => ({ marginInlineEnd: value }),
  paddingStart: (value: string) => ({ paddingInlineStart: value }),
  paddingEnd: (value: string) => ({ paddingInlineEnd: value }),
} as const;

const rtlUtils = {
  isRTLLanguage,
  getDirection,
  createRTLConfig,
  rtlProperties,
  getRTLClasses,
  rtlSpacing,
};

export default rtlUtils;
