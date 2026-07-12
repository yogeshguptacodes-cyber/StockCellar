import { ChevronDown, ChevronUp, Minus, Plus, X } from 'lucide-react-native';
import { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import type { BottleSize, EditableStockField } from '@/domain/models';
import { AppText, IconButton } from '@/shared/components/ui';
import { useTheme } from '@/theme';

export interface QuantityPadTarget {
  readonly itemId: string;
  readonly itemName: string;
  readonly field: EditableStockField | 'amount';
  readonly size: BottleSize | null;
}

export interface QuantityPadProps {
  target: QuantityPadTarget;
  value: number;
  /** Absolute set (typed input, quick chips, clear). */
  onSet: (value: number) => void;
  /** Relative step (+/- buttons, hold-to-repeat) — parent reads fresh state. */
  onStep: (delta: number) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
}

const FIELD_LABEL: Record<QuantityPadTarget['field'], string> = {
  opening: 'Opening stock',
  received: 'Stock received',
  sale: 'Sale',
  amount: 'Sale amount',
};

const REPEAT_INTERVAL_MS = 110;
const STEP_BUTTON_SIZE = 52;

/**
 * Floating quantity editor — the fast path for register entry. Tap a grid
 * cell to target it, then adjust with big one-thumb controls: step buttons
 * (hold to repeat), case-size chips, or direct typing. Prev/Next walks the
 * item list without touching the grid again.
 */
export const QuantityPad = memo(function QuantityPad({
  target,
  value,
  onSet,
  onStep,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onClose,
}: QuantityPadProps) {
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
      repeatTimer.current = setInterval(() => onStep(delta), REPEAT_INTERVAL_MS);
    },
    [onStep, stopRepeat],
  );

  useEffect(() => stopRepeat, [stopRepeat]);

  const handleTyped = useCallback(
    (text: string) => {
      const digits = text.replace(/[^0-9]/g, '');
      onSet(digits === '' ? 0 : Number.parseInt(digits, 10));
    },
    [onSet],
  );

  const isAmount = target.field === 'amount';
  const quickSteps = isAmount ? [100, 500] : [6, 12];

  const stepButton = (delta: number, emphasized: boolean) => {
    const Icon = delta > 0 ? Plus : Minus;
    const disabled = delta < 0 && value <= 0;
    return (
      <Pressable
        onPress={() => onStep(delta)}
        onLongPress={() => startRepeat(delta)}
        onPressOut={stopRepeat}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${delta > 0 ? 'Increase' : 'Decrease'} ${FIELD_LABEL[target.field]}`}
        style={({ pressed }) => [
          styles.stepButton,
          {
            backgroundColor: emphasized ? theme.colors.primary : theme.colors.surfaceMuted,
            borderRadius: theme.radius.lg,
            opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}>
        <Icon
          size={22}
          color={emphasized ? theme.colors.onPrimary : theme.colors.textPrimary}
          strokeWidth={2.5}
        />
      </Pressable>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(theme.motion.duration.normal)}
      exiting={FadeOutDown.duration(theme.motion.duration.fast)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: theme.radius.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
          gap: theme.spacing.md,
          ...theme.elevation.level4,
        },
      ]}>
      {/* Target + navigation */}
      <View style={[styles.headerRow, { gap: theme.spacing.xs }]}>
        <View style={styles.headerText}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {target.itemName}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {FIELD_LABEL[target.field]}
            {target.size ? ` · ${target.size} ml` : ''}
          </AppText>
        </View>
        <IconButton icon={ChevronUp} label="Previous item" onPress={onPrev} disabled={!hasPrev} variant="tonal" />
        <IconButton icon={ChevronDown} label="Next item" onPress={onNext} disabled={!hasNext} variant="tonal" />
        <IconButton icon={X} label="Close quantity pad" onPress={onClose} />
      </View>

      {/* Stepper + direct typing */}
      <View style={[styles.stepperRow, { gap: theme.spacing.md }]}>
        {stepButton(-1, false)}
        <TextInput
          value={value === 0 ? '' : String(value)}
          onChangeText={handleTyped}
          placeholder="0"
          placeholderTextColor={theme.colors.textTertiary}
          keyboardType="number-pad"
          selectTextOnFocus
          maxLength={isAmount ? 8 : 4}
          accessibilityLabel={`${FIELD_LABEL[target.field]} value`}
          style={[
            styles.valueInput,
            theme.typography.headline,
            {
              color: value > 0 ? theme.colors.primary : theme.colors.textTertiary,
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.md,
            },
          ]}
        />
        {stepButton(1, true)}
      </View>

      {/* Quick chips */}
      <View style={[styles.chipsRow, { gap: theme.spacing.sm }]}>
        {quickSteps.map((step) => (
          <Pressable
            key={step}
            onPress={() => onStep(step)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${step}`}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.full,
                paddingHorizontal: theme.spacing.lg,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <AppText variant="label" color="textSecondary">
              +{step}
            </AppText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onSet(0)}
          disabled={value === 0}
          accessibilityRole="button"
          accessibilityLabel="Clear value"
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: 'transparent',
              borderRadius: theme.radius.full,
              paddingHorizontal: theme.spacing.lg,
              opacity: value === 0 ? 0.35 : pressed ? 0.7 : 1,
            },
          ]}>
          <AppText variant="label" color="danger">
            Clear
          </AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepButton: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueInput: {
    flex: 1,
    height: STEP_BUTTON_SIZE,
    textAlign: 'center',
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
