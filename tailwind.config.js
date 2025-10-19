/** @type {import('tailwindcss').Config} */
const { designTokens } = require('./lib/design-tokens');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        neutral: designTokens.colors.neutral,
        
        // Semantic colors
        background: designTokens.colors.semantic.background,
        text: designTokens.colors.semantic.text,
        border: designTokens.colors.semantic.border,
      },
      
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
        display: designTokens.typography.fontFamily.display,
      },
      
      fontSize: {
        xs: designTokens.typography.fontSize.xs,
        sm: designTokens.typography.fontSize.sm,
        base: designTokens.typography.fontSize.base,
        lg: designTokens.typography.fontSize.lg,
        xl: designTokens.typography.fontSize.xl,
        '2xl': designTokens.typography.fontSize['2xl'],
        '3xl': designTokens.typography.fontSize['3xl'],
        '4xl': designTokens.typography.fontSize['4xl'],
        '5xl': designTokens.typography.fontSize['5xl'],
        '6xl': designTokens.typography.fontSize['6xl'],
      },
      
      fontWeight: designTokens.typography.fontWeight,
      letterSpacing: designTokens.typography.letterSpacing,
      
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      zIndex: designTokens.zIndex,
      
      screens: {
        xs: designTokens.breakpoints.xs,
        sm: designTokens.breakpoints.sm,
        md: designTokens.breakpoints.md,
        lg: designTokens.breakpoints.lg,
        xl: designTokens.breakpoints.xl,
        '2xl': designTokens.breakpoints['2xl'],
      },
      
      transitionDuration: designTokens.durations,
      transitionTimingFunction: designTokens.easing,
      
      // RTL support
      inset: {
        'start': '0',
        'end': '0',
      },
      
      // Custom utilities for RTL
      margin: {
        'start': '0',
        'end': '0',
      },
      
      padding: {
        'start': '0',
        'end': '0',
      },
    },
  },
  plugins: [
    // RTL plugin for better RTL support
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        // Logical properties for RTL
        '.ms-0': { marginInlineStart: '0' },
        '.me-0': { marginInlineEnd: '0' },
        '.ps-0': { paddingInlineStart: '0' },
        '.pe-0': { paddingInlineEnd: '0' },
        '.border-s': { borderInlineStart: '1px solid' },
        '.border-e': { borderInlineEnd: '1px solid' },
        '.rounded-s': { 
          borderTopLeftRadius: theme('borderRadius.lg'),
          borderBottomLeftRadius: theme('borderRadius.lg'),
        },
        '.rounded-e': { 
          borderTopRightRadius: theme('borderRadius.lg'),
          borderBottomRightRadius: theme('borderRadius.lg'),
        },
      };
      
      addUtilities(newUtilities);
    },
    
    // Custom component utilities
    function({ addComponents, theme }) {
      const components = {
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.200')}`,
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        
        '.btn-primary': {
          backgroundColor: theme('colors.primary.500'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
          },
          '&:active': {
            backgroundColor: theme('colors.primary.700'),
          },
        },
        
        '.btn-secondary': {
          backgroundColor: theme('colors.neutral.100'),
          color: theme('colors.neutral.900'),
          border: `1px solid ${theme('colors.neutral.300')}`,
          '&:hover': {
            backgroundColor: theme('colors.neutral.200'),
          },
        },
        
        '.card': {
          backgroundColor: theme('colors.background.primary'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.md'),
          border: `1px solid ${theme('colors.border.primary')}`,
        },
        
        '.input': {
          width: '100%',
          borderRadius: theme('borderRadius.lg'),
          border: `1px solid ${theme('colors.border.primary')}`,
          padding: theme('spacing.3'),
          fontSize: theme('fontSize.base'),
          transition: 'border-color 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`,
          },
        },
        
        '.chat-message': {
          maxWidth: '80%',
          padding: theme('spacing.3'),
          borderRadius: theme('borderRadius.lg'),
          marginBottom: theme('spacing.2'),
          wordWrap: 'break-word',
        },
        
        '.chat-message-user': {
          backgroundColor: theme('colors.primary.500'),
          color: theme('colors.white'),
          marginLeft: 'auto',
        },
        
        '.chat-message-assistant': {
          backgroundColor: theme('colors.neutral.100'),
          color: theme('colors.text.primary'),
          marginRight: 'auto',
        },
        
        '.itinerary-card': {
          backgroundColor: theme('colors.background.primary'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.lg'),
          border: `1px solid ${theme('colors.border.primary')}`,
          overflow: 'hidden',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.xl'),
          },
        },
      };
      
      addComponents(components);
    },
  ],
};