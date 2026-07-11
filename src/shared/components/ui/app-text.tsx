import { memo } from 'react';
import { Text, type TextProps } from 'react-native';

import { useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  /** Semantic color role from the active theme. */
  color?: keyof ThemeColors;
}

/**
 * Themed text atom. All app copy renders through this component so variants,
 * color roles, and (future) dynamic type scaling stay centralized.
 */
export const AppText = memo(function AppText({
  variant = 'body',
  color = 'textPrimary',
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[theme.typography[variant], { color: theme.colors[color] }, style]}
    />
  );
});
