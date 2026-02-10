export interface ColorScheme {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  tabBar: string;
  tabBarBorder: string;
}

export const LightTheme: ColorScheme = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#58CC02',
  successLight: '#E8F5E9',
  error: '#EF4444',
  errorLight: '#FFEBEE',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
};

export const DarkTheme: ColorScheme = {
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  background: '#111827',
  surface: '#1F2937',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  border: '#374151',
  success: '#58CC02',
  successLight: '#1B3A1B',
  error: '#EF4444',
  errorLight: '#3A1B1B',
  tabBar: '#1F2937',
  tabBarBorder: '#374151',
};
