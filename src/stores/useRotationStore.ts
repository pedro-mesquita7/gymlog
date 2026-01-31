import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { uuidv7 } from 'uuidv7';

export interface Rotation {
  rotation_id: string;
  name: string;
  template_ids: string[];  // Ordered list of template IDs
  current_position: number; // 0-based index into template_ids
}

interface RotationState {
  rotations: Rotation[];
  activeRotationId: string | null;
  defaultGymId: string | null;

  // CRUD
  createRotation: (name: string, templateIds: string[]) => string; // returns rotation_id
  updateRotation: (id: string, updates: { name?: string; template_ids?: string[] }) => void;
  deleteRotation: (id: string) => void;

  // Active rotation
  setActiveRotation: (id: string | null) => void;
  setDefaultGym: (gymId: string | null) => void;

  // Position management
  advanceRotation: (rotationId: string) => void; // wraps around using modulo
  resetPosition: (rotationId: string) => void;
}

export const useRotationStore = create<RotationState>()(
  persist(
    (set, get) => ({
      rotations: [],
      activeRotationId: null,
      defaultGymId: null,

      createRotation: (name, templateIds) => {
        const rotationId = uuidv7();
        const newRotation: Rotation = {
          rotation_id: rotationId,
          name,
          template_ids: templateIds,
          current_position: 0,
        };

        set((state) => ({
          rotations: [...state.rotations, newRotation],
        }));

        return rotationId;
      },

      updateRotation: (id, updates) => {
        set((state) => ({
          rotations: state.rotations.map((rotation) =>
            rotation.rotation_id === id
              ? {
                  ...rotation,
                  ...(updates.name !== undefined && { name: updates.name }),
                  ...(updates.template_ids !== undefined && { template_ids: updates.template_ids }),
                }
              : rotation
          ),
        }));
      },

      deleteRotation: (id) => {
        const state = get();
        set({
          rotations: state.rotations.filter((r) => r.rotation_id !== id),
          // Clear active rotation if we're deleting it
          activeRotationId: state.activeRotationId === id ? null : state.activeRotationId,
        });
      },

      setActiveRotation: (id) => {
        set({ activeRotationId: id });
      },

      setDefaultGym: (gymId) => {
        set({ defaultGymId: gymId });
      },

      advanceRotation: (rotationId) => {
        set((state) => ({
          rotations: state.rotations.map((rotation) =>
            rotation.rotation_id === rotationId
              ? {
                  ...rotation,
                  current_position: (rotation.current_position + 1) % rotation.template_ids.length,
                }
              : rotation
          ),
        }));
      },

      resetPosition: (rotationId) => {
        set((state) => ({
          rotations: state.rotations.map((rotation) =>
            rotation.rotation_id === rotationId
              ? { ...rotation, current_position: 0 }
              : rotation
          ),
        }));
      },
    }),
    {
      name: 'gymlog-rotations',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rotations: state.rotations,
        activeRotationId: state.activeRotationId,
        defaultGymId: state.defaultGymId,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<RotationState>),
      }),
    }
  )
);

// Selector: Get next template info from active rotation
export const selectNextTemplate = (state: RotationState): {
  templateId: string;
  position: number;
  total: number;
  rotationName: string;
} | null => {
  if (!state.activeRotationId) return null;

  const activeRotation = state.rotations.find(
    (r) => r.rotation_id === state.activeRotationId
  );

  if (!activeRotation || activeRotation.template_ids.length === 0) return null;

  const templateId = activeRotation.template_ids[activeRotation.current_position];

  return {
    templateId,
    position: activeRotation.current_position,
    total: activeRotation.template_ids.length,
    rotationName: activeRotation.name,
  };
};
