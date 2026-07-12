import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  FlaskConical,
  Images,
  Sparkles,
} from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { useScannerStore } from '../store/scanner-store';

import { container } from '@/core/di/container';
import { createLogger } from '@/core/logger';
import { useRegisterStore } from '@/features/inventory/store/register-store';
import { Screen } from '@/shared/components/layouts/screen';
import { AppButton, AppCard, AppText, EmptyState } from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { formatRupees } from '@/shared/utils/format-currency';
import { useTheme } from '@/theme';
import type { ExtractedSizes } from '@/services/extraction/inventory-extraction-service';

const log = createLogger('scanner:screen');
const PREVIEW_HEIGHT = 280;
const IMAGE_QUALITY = 0.8;
/** Below this confidence the row gets flagged for manual review. */
const LOW_CONFIDENCE = 0.8;

function units(sizes: ExtractedSizes | undefined): number {
  return sizes ? Object.values(sizes).reduce((sum, n) => sum + n, 0) : 0;
}

export function ScannerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const phase = useScannerStore((state) => state.phase);
  const image = useScannerStore((state) => state.image);
  const result = useScannerStore((state) => state.result);
  const errorMessage = useScannerStore((state) => state.errorMessage);

  const initializeRegister = useRegisterStore((state) => state.initialize);

  const pickFromGallery = useCallback(async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: IMAGE_QUALITY,
      });
      const asset = picked.assets?.[0];
      if (!picked.canceled && asset) {
        useScannerStore.getState().setImage(
          {
            uri: asset.uri,
            ...(asset.mimeType ? { mimeType: asset.mimeType } : {}),
            ...(asset.width ? { width: asset.width } : {}),
          },
          'gallery',
        );
      }
    } catch (error) {
      log.error('Gallery pick failed', error);
      showSnackbar({ message: 'Could not open the photo library' });
    }
  }, [showSnackbar]);

  const captureWithCamera = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showSnackbar({ message: 'Camera permission is required to scan sheets' });
        return;
      }
      const captured = await ImagePicker.launchCameraAsync({
        quality: IMAGE_QUALITY,
      });
      const asset = captured.assets?.[0];
      if (!captured.canceled && asset) {
        useScannerStore.getState().setImage(
          {
            uri: asset.uri,
            ...(asset.mimeType ? { mimeType: asset.mimeType } : {}),
            ...(asset.width ? { width: asset.width } : {}),
          },
          'camera',
        );
      }
    } catch (error) {
      log.error('Camera capture failed', error);
      showSnackbar({ message: 'Could not open the camera' });
    }
  }, [showSnackbar]);

  const handleExtract = useCallback(() => {
    void initializeRegister(); // catalog needed to match extracted names
    void useScannerStore.getState().extract();
  }, [initializeRegister]);

  const handleApply = useCallback(() => {
    const extraction = useScannerStore.getState().result;
    if (!extraction) {
      return;
    }
    const { matched, unmatched } = useRegisterStore.getState().applyExtraction(extraction.rows);
    useScannerStore.getState().markApplied();
    showSnackbar({
      message:
        unmatched > 0
          ? `Filled ${matched} rows · ${unmatched} not recognized`
          : `Filled ${matched} rows in the register`,
    });
    router.navigate('/(tabs)/inventory');
  }, [router, showSnackbar]);

  const geminiActive = container.extractionProvider === 'gemini';

  return (
    <Screen>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xxs }}>
          <AppText variant="headline">Scan sheet</AppText>
          <AppText variant="body" color="textSecondary">
            Photograph the register and let StockCellar fill the counts.
          </AppText>
        </View>

        {phase === 'idle' && (
          <View style={{ gap: theme.spacing.md }}>
            {/* Upload zone */}
            <View
              style={[
                styles.uploadZone,
                {
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radius.xl,
                  padding: theme.spacing.xxl,
                  gap: theme.spacing.md,
                  backgroundColor: theme.colors.surface,
                },
              ]}>
              <View
                style={[
                  styles.uploadIcon,
                  { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.full },
                ]}>
                <FileText size={26} color={theme.colors.accent} strokeWidth={1.75} />
              </View>
              <AppText variant="subtitle" style={styles.centered}>
                Capture your stock register
              </AppText>
              <AppText variant="caption" color="textSecondary" style={styles.centered}>
                Lay the sheet flat, good light, all columns visible
              </AppText>
              <View style={[styles.uploadButtons, { gap: theme.spacing.sm }]}>
                {Platform.OS !== 'web' && (
                  <AppButton label="Take photo" icon={Camera} onPress={() => void captureWithCamera()} />
                )}
                <AppButton
                  label="Choose image"
                  icon={Images}
                  variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
                  onPress={() => void pickFromGallery()}
                />
              </View>
            </View>

            {/* Provider transparency */}
            <View style={[styles.providerRow, { gap: theme.spacing.sm }]}>
              {geminiActive ? (
                <Sparkles size={13} color={theme.colors.accent} strokeWidth={2} />
              ) : (
                <FlaskConical size={13} color={theme.colors.textTertiary} strokeWidth={2} />
              )}
              <AppText variant="caption" color="textTertiary">
                {geminiActive
                  ? 'AI extraction powered by Google Gemini'
                  : 'Demo mode — add a Gemini API key in .env for real extraction'}
              </AppText>
            </View>
          </View>
        )}

        {(phase === 'preview' || phase === 'extracting') && image && (
          <View style={{ gap: theme.spacing.md }}>
            <Image
              source={{ uri: image.uri }}
              style={[styles.preview, { borderRadius: theme.radius.lg, height: PREVIEW_HEIGHT }]}
              contentFit="cover"
              accessibilityLabel="Selected register sheet"
            />
            {errorMessage ? (
              <AppText variant="label" color="danger">
                {errorMessage}
              </AppText>
            ) : null}
            {phase === 'extracting' ? (
              <AppCard>
                <View style={[styles.extracting, { gap: theme.spacing.md }]}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <View style={styles.extractingText}>
                    <AppText variant="bodyStrong">Reading the sheet…</AppText>
                    <AppText variant="caption" color="textSecondary">
                      Names, sizes and counts are being extracted
                    </AppText>
                  </View>
                </View>
              </AppCard>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                <AppButton
                  label="Extract quantities"
                  icon={Sparkles}
                  size="lg"
                  fullWidth
                  onPress={handleExtract}
                />
                <AppButton
                  label="Choose another image"
                  variant="ghost"
                  fullWidth
                  onPress={() => useScannerStore.getState().reset()}
                />
              </View>
            )}
          </View>
        )}

        {phase === 'review' && result && (
          <View style={{ gap: theme.spacing.md }}>
            <AppText variant="title">Found {result.rows.length} rows</AppText>
            {result.rows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nothing recognized"
                message="The sheet couldn't be read. Try a clearer photo."
                actionLabel="Start over"
                onAction={() => useScannerStore.getState().reset()}
              />
            ) : (
              <>
                {result.rows.map((row) => (
                  <AppCard key={row.itemName} style={{ padding: theme.spacing.md }}>
                    <View style={[styles.reviewRow, { gap: theme.spacing.md }]}>
                      <View style={styles.reviewInfo}>
                        <AppText variant="bodyStrong" numberOfLines={1}>
                          {row.itemName}
                        </AppText>
                        <AppText variant="caption" color="textSecondary">
                          Opening {units(row.opening)} · Received {units(row.received)} · Sale{' '}
                          {units(row.sale)}
                          {typeof row.amountRs === 'number' ? ` · ${formatRupees(row.amountRs)}` : ''}
                        </AppText>
                        {row.confidence < LOW_CONFIDENCE ? (
                          <AppText variant="caption" color="warning">
                            Low confidence — double-check this row
                          </AppText>
                        ) : null}
                      </View>
                      {row.confidence < LOW_CONFIDENCE ? (
                        <AlertCircle size={19} color={theme.colors.warning} strokeWidth={2} />
                      ) : (
                        <CheckCircle2 size={19} color={theme.colors.success} strokeWidth={2} />
                      )}
                    </View>
                  </AppCard>
                ))}
                <AppButton
                  label="Fill the register"
                  icon={Check}
                  size="lg"
                  fullWidth
                  onPress={handleApply}
                />
                <AppButton
                  label="Discard"
                  variant="ghost"
                  fullWidth
                  onPress={() => useScannerStore.getState().reset()}
                />
              </>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
  uploadZone: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
  },
  extracting: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extractingText: {
    flex: 1,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
  },
});
