import { memo, useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

const PULSE_MS = 700;
const MIN_OPACITY = 0.45;

/** Pulsing placeholder block — compose rows of these for loading states. */
export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 16,
  radius,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const opacity = useSharedValue(MIN_OPACITY);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_MS }),
        withTiming(MIN_OPACITY, { duration: PULSE_MS }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.skeletonBase,
        },
        animatedStyle,
        style,
      ]}
    />
  );
});
