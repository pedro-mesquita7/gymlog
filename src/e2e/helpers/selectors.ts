export const SEL = {
  // Navigation
  navWorkouts: '[data-testid="nav-workouts"]',
  navTemplates: '[data-testid="nav-templates"]',
  navAnalytics: '[data-testid="nav-analytics"]',
  navSettings: '[data-testid="nav-settings"]',
  // Workout
  gymSelect: '[data-testid="gym-select"]',
  templateSelect: '[data-testid="template-select"]',
  btnStartWorkout: '[data-testid="btn-start-workout"]',
  btnFinishWorkout: '[data-testid="btn-finish-workout"]',
  btnSaveWorkout: '[data-testid="btn-save-workout"]',
  btnDoneWorkout: '[data-testid="btn-done-workout"]',
  btnGoBack: '[data-testid="btn-go-back"]',
  noSetsWarning: '[data-testid="no-sets-warning"]',
  workoutCompleteHeading: '[data-testid="workout-complete-heading"]',
  workoutSavedHeading: '[data-testid="workout-saved-heading"]',
  // Quick Start
  quickStartCard: '[data-testid="quick-start-card"]',
  btnQuickStart: '[data-testid="btn-quick-start"]',
  rotationInfo: '[data-testid="rotation-info"]',
  // Set logging
  btnAddSet: '[data-testid="btn-add-set"]',
  firstTimeHint: '[data-testid="first-time-hint"]',
  loadingGhostData: '[data-testid="loading-ghost-data"]',
  activeExerciseName: '[data-testid="active-exercise-name"]',
  // Settings
  btnLoadDemo: '[data-testid="btn-load-demo"]',
  btnClearData: '[data-testid="btn-clear-data"]',
  btnExportBackup: '[data-testid="btn-export-backup"]',
  btnImportBackup: '[data-testid="btn-import-backup"]',
  fileInputParquet: '[data-testid="file-input-parquet"]',
  eventCount: '[data-testid="event-count"]',
  importResult: '[data-testid="import-result"]',
  // Templates
  templateNameInput: '[data-testid="template-name-input"]',
  btnCreateTemplate: '[data-testid="btn-create-template"]',
  btnTemplateMenu: '[data-testid="btn-template-menu"]',
  btnTemplateDelete: '[data-testid="btn-template-delete"]',
  // Exercises
  exerciseNameInput: '[data-testid="exercise-name-input"]',
  exerciseMuscleSelect: '[data-testid="exercise-muscle-select"]',
  btnAddExercise: '[data-testid="btn-add-exercise"]',
  // Gyms
  gymNameInput: '[data-testid="gym-name-input"]',
  gymLocationInput: '[data-testid="gym-location-input"]',
  btnAddGym: '[data-testid="btn-add-gym"]',
  // Analytics
  analyticsExerciseSelect: '[data-testid="analytics-exercise-select"]',
  analyticsCharts: '[data-testid="analytics-charts"]',
  analyticsEmpty: '[data-testid="analytics-empty"]',
  // Delete confirmation
  btnConfirmDelete: '[data-testid="btn-confirm-delete"]',
  btnCancelDelete: '[data-testid="btn-cancel-delete"]',
} as const;

// Dynamic selectors for set rows
export const setRow = (n: number) => ({
  weight: `[data-testid="set-${n}-weight"]`,
  reps: `[data-testid="set-${n}-reps"]`,
  rir: `[data-testid="set-${n}-rir"]`,
  remove: `[data-testid="set-${n}-remove"]`,
  pr: `[data-testid="set-${n}-pr"]`,
});
