import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DismissedAlert {
  exerciseId: string;
  status: 'plateau' | 'regressing';
  dismissedAt: string; // ISO timestamp
}

interface ProgressionAlertState {
  dismissedAlerts: DismissedAlert[];
  sessionStartTime: string | null;

  dismissAlert: (exerciseId: string, status: 'plateau' | 'regressing') => void;
  isAlertDismissed: (exerciseId: string, status: 'plateau' | 'regressing') => boolean;
  initSession: () => void;
}

export const useProgressionAlertStore = create<ProgressionAlertState>()(
  persist(
    (set, get) => ({
      dismissedAlerts: [],
      sessionStartTime: null,

      dismissAlert: (exerciseId, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          dismissedAlerts: [
            ...state.dismissedAlerts,
            { exerciseId, status, dismissedAt: now },
          ],
        }));
      },

      isAlertDismissed: (exerciseId, status) => {
        const { dismissedAlerts, sessionStartTime } = get();

        if (!sessionStartTime) return false;

        // Find matching dismissal
        const dismissed = dismissedAlerts.find(
          (alert) => alert.exerciseId === exerciseId && alert.status === status
        );

        if (!dismissed) return false;

        // Check if dismissal happened in current session (dismissedAt >= sessionStartTime)
        return dismissed.dismissedAt >= sessionStartTime;
      },

      initSession: () => {
        const { sessionStartTime } = get();
        const now = new Date();

        // If no sessionStartTime, this is first visit - just set it
        if (!sessionStartTime) {
          set({ sessionStartTime: now.toISOString() });
          return;
        }

        // Check if 2+ hours have passed since last session start
        const lastSession = new Date(sessionStartTime);
        const hoursSinceLastSession = (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastSession >= 2) {
          // New session - clear dismissals and reset session start time
          set({
            dismissedAlerts: [],
            sessionStartTime: now.toISOString(),
          });
        }
        // If < 2 hours, keep existing session (do nothing)
      },
    }),
    {
      name: 'gymlog-progression-alerts', // localStorage key
      storage: createJSONStorage(() => localStorage), // Persist across tab close
    }
  )
);
