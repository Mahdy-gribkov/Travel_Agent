/**
 * Unit tests for RTL utilities
 */

import { isRTLLanguage, getDirection, createRTLConfig, getRTLClasses, rtlSpacing } from '@/lib/rtl';

describe('RTL Utilities', () => {
  describe('isRTLLanguage', () => {
    it('should identify RTL languages correctly', () => {
      expect(isRTLLanguage('ar')).toBe(true); // Arabic
      expect(isRTLLanguage('he')).toBe(true); // Hebrew
      expect(isRTLLanguage('fa')).toBe(true); // Persian
      expect(isRTLLanguage('ur')).toBe(true); // Urdu
      expect(isRTLLanguage('ku')).toBe(true); // Kurdish
    });

    it('should identify LTR languages correctly', () => {
      expect(isRTLLanguage('en')).toBe(false); // English
      expect(isRTLLanguage('es')).toBe(false); // Spanish
      expect(isRTLLanguage('fr')).toBe(false); // French
      expect(isRTLLanguage('de')).toBe(false); // German
      expect(isRTLLanguage('zh')).toBe(false); // Chinese
    });

    it('should handle invalid language codes', () => {
      expect(isRTLLanguage('')).toBe(false);
      expect(isRTLLanguage('invalid')).toBe(false);
      expect(isRTLLanguage('123')).toBe(false);
    });
  });

  describe('getDirection', () => {
    it('should return rtl for RTL languages', () => {
      expect(getDirection('ar')).toBe('rtl');
      expect(getDirection('he')).toBe('rtl');
      expect(getDirection('fa')).toBe('rtl');
    });

    it('should return ltr for LTR languages', () => {
      expect(getDirection('en')).toBe('ltr');
      expect(getDirection('es')).toBe('ltr');
      expect(getDirection('fr')).toBe('ltr');
    });
  });

  describe('createRTLConfig', () => {
    it('should create correct RTL configuration for RTL languages', () => {
      const config = createRTLConfig('ar');
      expect(config).toEqual({
        direction: 'rtl',
        locale: 'ar',
        isRTL: true,
      });
    });

    it('should create correct RTL configuration for LTR languages', () => {
      const config = createRTLConfig('en');
      expect(config).toEqual({
        direction: 'ltr',
        locale: 'en',
        isRTL: false,
      });
    });
  });

  describe('getRTLClasses', () => {
    it('should return original classes for LTR', () => {
      const classes = 'ml-4 mr-2 pl-3 pr-1 text-left float-left';
      expect(getRTLClasses(false, classes)).toBe(classes);
    });

    it('should convert margin classes for RTL', () => {
      const classes = 'ml-4 mr-2';
      const expected = 'ms-4 me-2';
      expect(getRTLClasses(true, classes)).toBe(expected);
    });

    it('should convert padding classes for RTL', () => {
      const classes = 'pl-3 pr-1';
      const expected = 'ps-3 pe-1';
      expect(getRTLClasses(true, classes)).toBe(expected);
    });

    it('should convert text alignment classes for RTL', () => {
      const classes = 'text-left text-right';
      const expected = 'text-start text-end';
      expect(getRTLClasses(true, classes)).toBe(expected);
    });

    it('should convert float classes for RTL', () => {
      const classes = 'float-left float-right';
      const expected = 'float-start float-end';
      expect(getRTLClasses(true, classes)).toBe(expected);
    });

    it('should handle mixed classes', () => {
      const classes = 'ml-4 text-left pl-3 float-right mr-2';
      const expected = 'ms-4 text-start ps-3 float-end me-2';
      expect(getRTLClasses(true, classes)).toBe(expected);
    });

    it('should handle classes with numbers', () => {
      const classes = 'ml-8 mr-16 pl-12 pr-24';
      const expected = 'ms-8 me-16 ps-12 pe-24';
      expect(getRTLClasses(true, classes)).toBe(expected);
    });
  });

  describe('rtlSpacing', () => {
    it('should create correct margin start styles', () => {
      const style = rtlSpacing.start('1rem');
      expect(style).toEqual({ marginInlineStart: '1rem' });
    });

    it('should create correct margin end styles', () => {
      const style = rtlSpacing.end('2rem');
      expect(style).toEqual({ marginInlineEnd: '2rem' });
    });

    it('should create correct padding start styles', () => {
      const style = rtlSpacing.paddingStart('0.5rem');
      expect(style).toEqual({ paddingInlineStart: '0.5rem' });
    });

    it('should create correct padding end styles', () => {
      const style = rtlSpacing.paddingEnd('1.5rem');
      expect(style).toEqual({ paddingInlineEnd: '1.5rem' });
    });
  });
});
