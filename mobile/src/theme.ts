export const Theme = {
  colors: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    tertiary: '#0066FF', // Liquid Accent Blue
    neutral: '#FFFFFF',
    background: '#F8FAFC',
    backgroundAlt: '#F1F5F9',
    
    // Liquid Glass Surfaces
    glassSurface: 'rgba(255, 255, 255, 0.88)',
    glassSurfaceHover: 'rgba(255, 255, 255, 0.96)',
    glassSurfaceDark: 'rgba(26, 26, 26, 0.94)',
    glassCard: '#FFFFFF',
    glassModal: '#FFFFFF',
    
    // Borders & Stems
    border: 'rgba(226, 232, 240, 0.9)',
    borderSubtle: '#F1F5F9',
    borderGlass: 'rgba(255, 255, 255, 0.8)',
    borderAccent: 'rgba(0, 102, 255, 0.25)',
    borderDark: '#262626',
    
    // Text Hierarchy
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#71717A',
    textLight: '#94A3B8',
    textWhite: '#FFFFFF',
    
    // Semantic States
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    
    // Semantic Soft Tints
    tintSuccess: '#ECFDF5',
    tintWarning: '#FFFBEB',
    tintDanger: '#FEF2F2',
    tintAccent: '#EFF6FF',
    tintDark: '#262626',
  },
  
  radius: {
    xs: 6,
    sm: 8,
    md: 12, // Base corner radius: 12px (0.75rem) from design.md
    lg: 16,
    xl: 20,
    modal: 24,
    pill: 999,
  },
  
  shadows: {
    glass: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    card: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    floating: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    accentLift: {
      shadowColor: '#0066FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
      elevation: 4,
    },
  },
  
  typography: {
    display: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    h1: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: '#1A1A1A',
      letterSpacing: -0.2,
    },
    h2: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#1A1A1A',
    },
    h3: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#1A1A1A',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#4A4A4A',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: '#71717A',
    },
    labelCaps: {
      fontSize: 11,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
  },
};
