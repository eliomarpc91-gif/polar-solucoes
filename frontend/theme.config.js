/** @type {const} */
const themeColors = {
  // === CORES PRIMÁRIAS PREMIUM ===
  primary: { light: '#0066FF', dark: '#3B82F6' },
  primaryLight: { light: '#EBF3FF', dark: '#1E3A5F' },
  primaryDark: { light: '#0047CC', dark: '#2563EB' },

  // === FUNDO TECNOLÓGICO ===
  // Branco gelo com toque azul extremamente sutil
  background: { light: '#F8FAFF', dark: '#0A0E1A' },
  backgroundAlt: { light: '#F0F5FF', dark: '#0D1220' },
  backgroundDeep: { light: '#E8F0FF', dark: '#080C16' },

  // === SUPERFÍCIES GLASSMORPHISM ===
  surface: { light: '#FFFFFF', dark: '#111827' },
  surfaceSecondary: { light: '#F5F8FF', dark: '#1A2236' },
  surfaceGlass: { light: 'rgba(255,255,255,0.85)', dark: 'rgba(17,24,39,0.85)' },
  surfaceGlassStrong: { light: 'rgba(255,255,255,0.95)', dark: 'rgba(17,24,39,0.95)' },

  // === TEXTO ===
  foreground: { light: '#0A0F1E', dark: '#F1F5FF' },
  foregroundSecondary: { light: '#1E2D4A', dark: '#CBD5E1' },
  muted: { light: '#64748B', dark: '#94A3B8' },
  mutedLight: { light: '#94A3B8', dark: '#64748B' },

  // === BORDAS PREMIUM ===
  border: { light: '#E2E8F0', dark: '#1E293B' },
  borderLight: { light: '#EEF2FF', dark: '#1E2D4A' },
  borderGlow: { light: 'rgba(0,102,255,0.2)', dark: 'rgba(59,130,246,0.3)' },

  // === ESTADOS ===
  success: { light: '#10B981', dark: '#34D399' },
  successLight: { light: '#ECFDF5', dark: '#064E3B' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  warningLight: { light: '#FFFBEB', dark: '#451A03' },
  error: { light: '#EF4444', dark: '#F87171' },
  errorLight: { light: '#FEF2F2', dark: '#450A0A' },

  // === CORES ESPECIAIS PREMIUM ===
  accent: { light: '#7C3AED', dark: '#8B5CF6' },       // Roxo premium
  accentLight: { light: '#F5F3FF', dark: '#2E1065' },
  cyan: { light: '#06B6D4', dark: '#22D3EE' },          // Ciano IA
  cyanLight: { light: '#ECFEFF', dark: '#083344' },

  // === GLOW / EFEITOS ===
  glowBlue: { light: 'rgba(0,102,255,0.15)', dark: 'rgba(59,130,246,0.2)' },
  glowCyan: { light: 'rgba(6,182,212,0.15)', dark: 'rgba(34,211,238,0.2)' },
  glowPurple: { light: 'rgba(124,58,237,0.15)', dark: 'rgba(139,92,246,0.2)' },

  // === GRADIENTE TOPO ===
  gradientStart: { light: '#FFFFFF', dark: '#0A0E1A' },
  gradientEnd: { light: '#EBF3FF', dark: '#0D1525' },

  // === ALIASES LEGADOS ===
  tint: { light: '#0066FF', dark: '#3B82F6' },
  link: { light: '#0066FF', dark: '#60A5FA' },
  graphite: { light: '#374151', dark: '#9CA3AF' },
  slate: { light: '#64748B', dark: '#94A3B8' },
};

module.exports = { themeColors };
