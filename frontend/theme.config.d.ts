export const themeColors: {
  primary: { light: string; dark: string };
  primaryLight: { light: string; dark: string };
  primaryDark: { light: string; dark: string };
  background: { light: string; dark: string };
  backgroundAlt: { light: string; dark: string };
  backgroundDeep: { light: string; dark: string };
  surface: { light: string; dark: string };
  surfaceSecondary: { light: string; dark: string };
  surfaceGlass: { light: string; dark: string };
  surfaceGlassStrong: { light: string; dark: string };
  foreground: { light: string; dark: string };
  foregroundSecondary: { light: string; dark: string };
  muted: { light: string; dark: string };
  mutedLight: { light: string; dark: string };
  border: { light: string; dark: string };
  borderLight: { light: string; dark: string };
  borderGlow: { light: string; dark: string };
  success: { light: string; dark: string };
  successLight: { light: string; dark: string };
  warning: { light: string; dark: string };
  warningLight: { light: string; dark: string };
  error: { light: string; dark: string };
  errorLight: { light: string; dark: string };
  accent: { light: string; dark: string };
  accentLight: { light: string; dark: string };
  cyan: { light: string; dark: string };
  cyanLight: { light: string; dark: string };
  glowBlue: { light: string; dark: string };
  glowCyan: { light: string; dark: string };
  glowPurple: { light: string; dark: string };
  gradientStart: { light: string; dark: string };
  gradientEnd: { light: string; dark: string };
  tint: { light: string; dark: string };
  link: { light: string; dark: string };
  graphite: { light: string; dark: string };
  slate: { light: string; dark: string };
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;
