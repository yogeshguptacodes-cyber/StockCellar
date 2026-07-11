import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

export interface QuantityStepperProps {
  value: number;
  onAdjust: (delta: number) => void;
  onSet: (value: number) => void;
  accessibilityLabel: string;
}

/** Hold-to-repeat cadence for long-press increment/decrement. */
const REPEAT_INTERVAL_MS = 110;
const BUTTON_SIZE = 34;
const ICON_SIZE = 18;
const INPUT_WIDTH = 44;
const MAX_QUANTITY = 9999;

function clamp(value: number): number {
  return Math.max(0, Math.min(MAX_QUANTITY, value));
}

/**
 * Numeric stepper atom: tap to step, long-press to repeat, or type directly.
 */
export const QuantityStepper = memo(function QuantityStepper({
  value,
  onAdjust,
  onSet,
  accessibilityLabel,
}: QuantityStepperProps) {
  const theme = useTheme();
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current !== null) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  const startRepeat = useCallback(
    (delta: number) => {
      stopRepeat();
      repeatTimer.current = setInterval(() => onAdjust(delta), REPEAT_INTERVAL_MS);
    },
    [onAdjust, stopRepeat],
  );

  useEffect(() => stopRepeat, [stopRepeat]);

  const handleChangeText = useCallback(
    (text: string) => {
      const digits = text.replace(/[^0-9]/g, '');
      onSet(digits === '' ? 0 : clamp(Number.parseInt(digits, 10)));
    },
    [onSet],
  );

  const buttonStyle = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  };

  return (
    <View style={[styles.container, { gap: theme.spacing.xs }]}>
      <Pressable
        onPress={() => onAdjust(-1)}
        onLongPress={() => startRepeat(-1)}
        onPressOut={stopRepeat}
        disabled={value <= 0}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
        style={({ pressed }) => [
          styles.button,
          buttonStyle,
          { opacity: value <= 0 ? 0.35 : pressed ? 0.7 : 1 },
        ]}>
        <Ionicons name="remove" size={ICON_SIZE} color={theme.colors.textPrimary} />
      </Pressable>

      <TextInput
        value={value === 0 ? '' : String(value)}
        onChangeText={handleChangeText}
        placeholder="0"
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="number-pad"
        selectTextOnFocus
        maxLength={4}
        accessibilityLabel={`Quantity of ${accessibilityLabel}`}
        style={[
          styles.input,
          theme.typography.bodyStrong,
          {
            color: value > 0 ? theme.colors.primary : theme.colors.textTertiary,
            width: INPUT_WIDTH,
          },
        ]}
      />

      <Pressable
        onPress={() => onAdjust(1)}
        onLongPress={() => startRepeat(1)}
        onPressOut={stopRepeat}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${accessibilityLabel}`}
        style={({ pressed }) => [styles.button, buttonStyle, { opacity: pressed ? 0.7 : 1 }]}>
        <Ionicons name="add" size={ICON_SIZE} color={theme.colors.textPrimary} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    textAlign: 'center',
    paddingVertical: 0,
  },
});
