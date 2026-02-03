import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const BACKUP_THRESHOLD = 10;

interface BackupState {
  workoutsSinceBackup: number;
  lastBackupDate: string | null;
  reminderDismissed: boolean;

  incrementWorkoutCount: () => void;
  resetBackupCount: () => void;
  dismissReminder: () => void;
}

export const useBackupStore = create<BackupState>()(
  persist(
    (set) => ({
      workoutsSinceBackup: 0,
      lastBackupDate: null,
      reminderDismissed: false,

      incrementWorkoutCount: () => {
        set((state) => ({
          workoutsSinceBackup: state.workoutsSinceBackup + 1,
          reminderDismissed: false, // Reset dismiss on new workout
        }));
      },

      resetBackupCount: () => {
        set({
          workoutsSinceBackup: 0,
          lastBackupDate: new Date().toISOString(),
          reminderDismissed: false,
        });
      },

      dismissReminder: () => {
        set({ reminderDismissed: true });
      },
    }),
    {
      name: 'gymlog-backup', // localStorage key
      storage: createJSONStorage(() => localStorage), // Persist across tab close
    }
  )
);

// Selector for checking if reminder should be shown
export const selectShouldShowReminder = (state: BackupState) =>
  state.workoutsSinceBackup >= BACKUP_THRESHOLD && !state.reminderDismissed;
