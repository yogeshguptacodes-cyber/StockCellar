import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from './ui/app-button';
import { AppText } from './ui/app-text';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import { spacing } from '@/theme';

interface ErrorBoundaryState {
  hasError: boolean;
}

const log = createLogger('error-boundary');

/**
 * Global render-error catcher. Logs, reports to analytics, and offers
 * recovery instead of a white screen. Wraps the app in the root layout.
 */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const normalized = normalizeError(error);
    log.error('Unhandled render error', error, { componentStack: info.componentStack });
    container.analytics.track({
      name: 'error_occurred',
      payload: { code: normalized.code, message: normalized.message },
    });
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Intentionally theme-independent: must render even if theming breaks.
      return (
        <View style={styles.container}>
          <AppText variant="title" style={styles.centered}>
            Something went wrong
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.centered}>
            An unexpected error occurred. Your saved inventory is safe.
          </AppText>
          <AppButton label="Try again" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  centered: {
    textAlign: 'center',
  },
});
