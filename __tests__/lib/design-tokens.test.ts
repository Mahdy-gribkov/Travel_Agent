/**
 * Unit tests for design tokens
 */

import { designTokens } from '@/lib/design-tokens';

describe('Design Tokens', () => {
  describe('Colors', () => {
    it('should have all primary color variants', () => {
      expect(designTokens.colors.primary).toBeDefined();
      expect(designTokens.colors.primary[50]).toBe('#f0f9ff');
      expect(designTokens.colors.primary[500]).toBe('#0ea5e9');
      expect(designTokens.colors.primary[950]).toBe('#082f49');
    });

    it('should have all secondary color variants', () => {
      expect(designTokens.colors.secondary).toBeDefined();
      expect(designTokens.colors.secondary[50]).toBe('#fefce8');
      expect(designTokens.colors.secondary[500]).toBe('#eab308');
      expect(designTokens.colors.secondary[950]).toBe('#422006');
    });

    it('should have semantic colors', () => {
      expect(designTokens.colors.semantic.background.primary).toBe('#ffffff');
      expect(designTokens.colors.semantic.text.primary).toBe('#0f172a');
      expect(designTokens.colors.semantic.border.primary).toBe('#e2e8f0');
    });

    it('should have success, warning, and error colors', () => {
      expect(designTokens.colors.success[500]).toBe('#22c55e');
      expect(designTokens.colors.warning[500]).toBe('#f59e0b');
      expect(designTokens.colors.error[500]).toBe('#ef4444');
    });
  });

  describe('Typography', () => {
    it('should have font families', () => {
      expect(designTokens.typography.fontFamily.sans).toEqual(['Inter', 'system-ui', 'sans-serif']);
      expect(designTokens.typography.fontFamily.mono).toEqual(['JetBrains Mono', 'Consolas', 'monospace']);
    });

    it('should have font sizes with line heights', () => {
      expect(designTokens.typography.fontSize.xs).toEqual(['0.75rem', { lineHeight: '1rem' }]);
      expect(designTokens.typography.fontSize.base).toEqual(['1rem', { lineHeight: '1.5rem' }]);
      expect(designTokens.typography.fontSize['6xl']).toEqual(['3.75rem', { lineHeight: '1' }]);
    });

    it('should have font weights', () => {
      expect(designTokens.typography.fontWeight.normal).toBe('400');
      expect(designTokens.typography.fontWeight.bold).toBe('700');
    });
  });

  describe('Spacing', () => {
    it('should have consistent spacing scale', () => {
      expect(designTokens.spacing[0]).toBe('0px');
      expect(designTokens.spacing[1]).toBe('0.25rem');
      expect(designTokens.spacing[4]).toBe('1rem');
      expect(designTokens.spacing[16]).toBe('4rem');
    });
  });

  describe('Border Radius', () => {
    it('should have border radius values', () => {
      expect(designTokens.borderRadius.none).toBe('0px');
      expect(designTokens.borderRadius.sm).toBe('0.125rem');
      expect(designTokens.borderRadius.full).toBe('9999px');
    });
  });

  describe('Shadows', () => {
    it('should have shadow definitions', () => {
      expect(designTokens.shadows.sm).toContain('rgb(0 0 0 / 0.05)');
      expect(designTokens.shadows.lg).toContain('rgb(0 0 0 / 0.1)');
      expect(designTokens.shadows.none).toBe('none');
    });
  });

  describe('Breakpoints', () => {
    it('should have responsive breakpoints', () => {
      expect(designTokens.breakpoints.xs).toBe('475px');
      expect(designTokens.breakpoints.sm).toBe('640px');
      expect(designTokens.breakpoints.lg).toBe('1024px');
      expect(designTokens.breakpoints['2xl']).toBe('1536px');
    });
  });

  describe('Components', () => {
    it('should have button component tokens', () => {
      expect(designTokens.components.button.height.sm).toBe('2rem');
      expect(designTokens.components.button.height.md).toBe('2.5rem');
      expect(designTokens.components.button.height.lg).toBe('3rem');
    });

    it('should have input component tokens', () => {
      expect(designTokens.components.input.height.sm).toBe('2rem');
      expect(designTokens.components.input.height.md).toBe('2.5rem');
    });

    it('should have card component tokens', () => {
      expect(designTokens.components.card.padding.sm).toBe('1rem');
      expect(designTokens.components.card.borderRadius).toBe('0.75rem');
    });
  });

  describe('RTL Support', () => {
    it('should have RTL properties', () => {
      expect(designTokens.rtl.start).toBe('left');
      expect(designTokens.rtl.end).toBe('right');
      expect(designTokens.rtl.marginStart).toBe('margin-left');
      expect(designTokens.rtl.marginEnd).toBe('margin-right');
    });
  });

  describe('Dark Mode', () => {
    it('should have dark mode color overrides', () => {
      expect(designTokens.darkMode.colors.background.primary).toBe('#0f172a');
      expect(designTokens.darkMode.colors.text.primary).toBe('#f8fafc');
      expect(designTokens.darkMode.colors.border.primary).toBe('#334155');
    });
  });
});
