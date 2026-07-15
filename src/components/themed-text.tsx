import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useShield } from '@/context/ShieldContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // Safe fallback retrieval of global font size accessibility setting
  let scale = 1.0;
  try {
    const shield = useShield();
    if (shield.fontSize === 'Small') {
      scale = 0.85;
    } else if (shield.fontSize === 'Large') {
      scale = 1.2;
    }
  } catch (e) {
    // Fallback if rendered outside ShieldProvider
  }

  const baseStyle = styles[type] || styles.default;
  const baseStyleObj = baseStyle as any;
  const fontSize = baseStyleObj.fontSize ? baseStyleObj.fontSize * scale : undefined;
  const lineHeight = baseStyleObj.lineHeight ? baseStyleObj.lineHeight * scale : undefined;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        baseStyle,
        fontSize !== undefined && { fontSize, lineHeight },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
