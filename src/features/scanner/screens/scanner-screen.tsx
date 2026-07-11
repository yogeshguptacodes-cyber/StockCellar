import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { useScannerStore } from '../store/scanner-store';

import { createLogger } from '@/core/logger';
import { formatBottleSize } from '@/domain/models';
import { useInventoryStore } from '@/features/inventory/store/inventory-store';
import { Screen } from '@/shared/components/layouts/screen';
import { AppButton, AppCard, AppText, EmptyState } from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { useTheme } from '@/theme';

const log = createLogger('scanner:screen');
const PREVIEW_HEIGHT = 260;
const IMAGE_QUALITY = 0.8;
/** Below this confidence the row gets flagged for manual review. */
const LOW_CONFIDENCE = 0.8;

export function ScannerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const phase = useScannerStore((state) => state.phase);
  const imageUri = useScannerStore((state) => state.imageUri);
  const result = useScannerStore((state) => state.result);
  const errorMessage = useScannerStore((state) => state.errorMessage);

  const catalog = useInventoryStore((state) => state.catalog);
  const initializeInventory = useInventoryStore((state) => state.initialize);

  const pickFromGallery = useCallback(async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: IMAGE_QUALITY,
      });
      const asset = picked.assets?.[0];
      if (!picked.canceled && asset) {
        useScannerStore.getState().setImage(asset.uri, 'gallery');
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
      const captured = await ImagePicker.launchCameraAsync({ quality: IMAGE_QUALITY });
      const asset = captured.assets?.[0];
      if (!captured.canceled && asset) {
        useScannerStore.getState().setImage(asset.uri, 'camera');
      }
    } catch (error) {
      log.error('Camera capture failed', error);
      showSnackbar({ message: 'Could not open the camera' });
    }
  }, [showSnackbar]);

  const handleExtract = useCallback(() => {
    void initializeInventory(); // catalog needed to resolve extracted bottle ids
    void useScannerStore.getState().extract();
  }, [initializeInventory]);

  const handleApply = useCallback(() => {
    const extraction = useScannerStore.getState().result;
    if (!extraction) {
      return;
    }
    useInventoryStore.getState().applyExtraction(extraction.entries);
    useScannerStore.getState().markApplied();
    showSnackbar({ message: `Added ${extraction.entries.length} items to the count` });
    router.navigate('/(tabs)/inventory');
  }, [router, showSnackbar]);

  const bottleName = useCallback(
    (bottleId: string): string => {
      const bottle = catalog.find((b) => b.id === bottleId);
      return bottle ? `${bottle.brand} ${bottle.name} · ${formatBottleSize(bottle.sizeMl)}` : bottleId;
    },
    [catalog],
  );

  return (
    <Screen>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <AppText variant="headline">Scan sheet</AppText>
        <AppText variant="body" color="textSecondary">
          Photograph a handwritten inventory sheet and let StockCellar extract the counts.
        </AppText>

        {phase === 'idle' && (
          <View style={{ gap: theme.spacing.md }}>
            {Platform.OS !== 'web' && (
              <AppButton
                label="Take photo"
                icon="camera-outline"
                size="lg"
                fullWidth
                onPress={() => void captureWithCamera()}
              />
            )}
            <AppButton
              label="Choose from gallery"
              icon="images-outline"
              size="lg"
              variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
              fullWidth
              onPress={() => void pickFromGallery()}
            />
          </View>
        )}

        {(phase === 'preview' || phase === 'extracting') && imageUri && (
          <View style={{ gap: theme.spacing.md }}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.preview, { borderRadius: theme.radius.lg, height: PREVIEW_HEIGHT }]}
              contentFit="cover"
              accessibilityLabel="Selected inventory sheet"
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
                  <AppText variant="body" color="textSecondary">
                    Reading bottle quantities…
                  </AppText>
                </View>
              </AppCard>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                <AppButton label="Extract quantities" icon="sparkles-outline" fullWidth onPress={handleExtract} />
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
            <AppText variant="title">Found {result.entries.length} items</AppText>
            {result.entries.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="Nothing recognized"
                message="The sheet couldn't be read. Try a clearer photo."
                actionLabel="Start over"
                onAction={() => useScannerStore.getState().reset()}
              />
            ) : (
              <>
                {result.entries.map((entry) => (
                  <AppCard key={entry.bottleId} style={{ padding: theme.spacing.md }}>
                    <View style={[styles.reviewRow, { gap: theme.spacing.md }]}>
                      <View style={styles.reviewInfo}>
                        <AppText variant="label" numberOfLines={1}>
                          {bottleName(entry.bottleId)}
                        </AppText>
                        {entry.confidence < LOW_CONFIDENCE ? (
                          <AppText variant="caption" color="warning">
                            Low confidence — double-check this row
                          </AppText>
                        ) : null}
                      </View>
                      <AppText variant="bodyStrong" color="primary">
                        ×{entry.quantity}
                      </AppText>
                    </View>
                  </AppCard>
                ))}
                <AppButton label="Apply to inventory count" icon="checkmark" fullWidth onPress={handleApply} />
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
  preview: {
    width: '100%',
  },
  extracting: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
  },
});
