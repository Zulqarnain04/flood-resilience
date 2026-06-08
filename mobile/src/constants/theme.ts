/**
 * SIAGA design tokens — source of truth is
 * ../stitch_react_mobile_frontend_design/siaga_ui/DESIGN.md.
 * Mapped to React Native StyleSheet-friendly values.
 */

export const Colors = {
  primary: '#003d9b',
  onPrimary: '#ffffff',
  primaryContainer: '#0052cc',
  secondary: '#b6171e',          // CRITICAL RED — SOS only
  onSecondary: '#ffffff',
  tertiary: '#723000',           // WARNING ORANGE
  error: '#ba1a1a',
  surface: '#fcf8f9',
  surfaceContainer: '#f0edee',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#1b1b1c',
  onSurfaceVariant: '#434654',
  outline: '#737685',
  outlineVariant: '#c3c6d6',
  background: '#fcf8f9',
  // Urgency level colors (for map pins and card borders)
  urgencyCritical: '#b6171e',
  urgencyHigh: '#ea580c',
  urgencyModerate: '#ca8a04',
  urgencyLow: '#64748b',
  urgencySafe: '#1b5e20',
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const Radius = {
  sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, full: 9999,
};

export const Typography = {
  headlineLg: { fontSize: 28, fontWeight: '800', lineHeight: 36 },
  headlineMd: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  headlineSm: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  bodyLg:     { fontSize: 18, fontWeight: '400', lineHeight: 28 },
  bodyMd:     { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  labelLg:    { fontSize: 16, fontWeight: '600', lineHeight: 20 },
  labelMd:    { fontSize: 14, fontWeight: '600', lineHeight: 18 },
};
