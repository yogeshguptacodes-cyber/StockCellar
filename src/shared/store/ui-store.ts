import { create } from 'zustand';

/**
 * Ephemeral app-wide UI state (snackbars). Feature data never lives here.
 */
export interface SnackbarPayload {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

interface ActiveSnackbar extends SnackbarPayload {
  readonly id: number;
}

interface UiState {
  snackbar: ActiveSnackbar | null;
  showSnackbar: (payload: SnackbarPayload) => void;
  dismissSnackbar: () => void;
}

const AUTO_DISMISS_MS = 3500;

let nextId = 1;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>()((set, get) => ({
  snackbar: null,

  showSnackbar: (payload) => {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer);
    }
    const id = nextId++;
    set({ snackbar: { ...payload, id } });
    dismissTimer = setTimeout(() => {
      if (get().snackbar?.id === id) {
        set({ snackbar: null });
      }
    }, AUTO_DISMISS_MS);
  },

  dismissSnackbar: () => {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ snackbar: null });
  },
}));
