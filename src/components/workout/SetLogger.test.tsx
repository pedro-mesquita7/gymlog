import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SetLogger } from './SetLogger';

// Mock useExerciseMax
const mockUseExerciseMax = vi.fn();
vi.mock('../../hooks/useHistory', () => ({
  useExerciseMax: (exerciseId: string) => mockUseExerciseMax(exerciseId),
}));

// Mock useWorkoutStore
const mockWorkoutStore = {
  session: { gym_id: 'gym-1' },
};
vi.mock('../../stores/useWorkoutStore', () => ({
  useWorkoutStore: vi.fn((selector) => selector(mockWorkoutStore)),
}));

describe('SetLogger', () => {
  const mockOnLogSet = vi.fn();

  const defaultProps = {
    exerciseId: 'ex-bench',
    originalExerciseId: 'ex-bench',
    targetRepsMin: 8,
    targetRepsMax: 12,
    onLogSet: mockOnLogSet,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no max data (first time doing exercise)
    mockUseExerciseMax.mockReturnValue(null);
  });

  test('Log Set button disabled when weight=0 or reps=0', () => {
    render(<SetLogger {...defaultProps} />);

    const logButton = screen.getByRole('button', { name: /Log Set/i });
    expect(logButton).toBeDisabled();
  });

  test('Incrementing weight/reps via NumberStepper enables Log Set', async () => {
    const user = userEvent.setup();

    render(<SetLogger {...defaultProps} />);

    const logButton = screen.getByRole('button', { name: /Log Set/i });
    expect(logButton).toBeDisabled();

    // Get all increment buttons (there are multiple + buttons for weight, reps, RIR)
    const incrementButtons = screen.getAllByRole('button', { name: '+' });

    // Increment weight (first + button)
    await user.click(incrementButtons[0]);
    // Still disabled (need reps too)
    expect(logButton).toBeDisabled();

    // Increment reps (second + button)
    await user.click(incrementButtons[1]);
    // Now enabled
    expect(logButton).toBeEnabled();
  });

  test('Clicking Log Set calls onLogSet with correct data', async () => {
    const user = userEvent.setup();

    render(<SetLogger {...defaultProps} />);

    const incrementButtons = screen.getAllByRole('button', { name: '+' });

    // Set weight to 2.5kg (1 click at 2.5 step)
    await user.click(incrementButtons[0]);

    // Set reps to 1 (1 click)
    await user.click(incrementButtons[1]);

    // Click Log Set
    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    // Verify onLogSet was called with correct data
    expect(mockOnLogSet).toHaveBeenCalledTimes(1);
    expect(mockOnLogSet).toHaveBeenCalledWith({
      weight_kg: 2.5,
      reps: 1,
      rir: null,
    });
  });

  test('After logging, reps reset to 0 (auto-advance behavior)', async () => {
    const user = userEvent.setup();

    render(<SetLogger {...defaultProps} />);

    const incrementButtons = screen.getAllByRole('button', { name: '+' });

    // Set weight to 2.5kg and reps to 1
    await user.click(incrementButtons[0]);
    await user.click(incrementButtons[1]);

    // Log the set
    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    // Button should be disabled again (reps reset to 0)
    expect(logButton).toBeDisabled();

    // Weight should still be set (only reps reset)
    // We can verify this by clicking reps once - should enable the button
    await user.click(incrementButtons[1]);
    expect(logButton).toBeEnabled();
  });

  test('RIR can be set and is included in onLogSet', async () => {
    const user = userEvent.setup();

    render(<SetLogger {...defaultProps} />);

    const incrementButtons = screen.getAllByRole('button', { name: '+' });

    // Set weight, reps, and RIR
    await user.click(incrementButtons[0]); // weight
    await user.click(incrementButtons[1]); // reps
    // RIR starts at null, first click sets to 0, second click sets to 1
    await user.click(incrementButtons[2]); // RIR (third + button) - sets to 0
    await user.click(incrementButtons[2]); // RIR - sets to 1

    // Log the set
    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    // Verify RIR was included
    expect(mockOnLogSet).toHaveBeenCalledWith({
      weight_kg: 2.5,
      reps: 1,
      rir: 1,
    });
  });

  test('Displays target rep range', () => {
    render(<SetLogger {...defaultProps} targetRepsMin={5} targetRepsMax={8} />);

    expect(screen.getByText(/Target: 5-8 reps/i)).toBeInTheDocument();
  });

  test('Displays last session reference when provided', () => {
    render(<SetLogger {...defaultProps} lastWeight={80} lastReps={10} />);

    expect(screen.getByText(/Last:/i)).toBeInTheDocument();
    expect(screen.getByText(/80kg/i)).toBeInTheDocument();
    expect(screen.getByText(/10 reps/i)).toBeInTheDocument();
  });

  test('Displays current max weight and 1RM when available', () => {
    mockUseExerciseMax.mockReturnValue({
      max_weight: 100,
      max_1rm: 112.5,
    });

    render(<SetLogger {...defaultProps} />);

    // EstimatedMaxDisplay should show these values
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/112.5/)).toBeInTheDocument();
  });

  test('Weight step is 2.5kg', async () => {
    const user = userEvent.setup();

    render(<SetLogger {...defaultProps} />);

    const incrementButtons = screen.getAllByRole('button', { name: '+' });

    // Click weight + button twice
    await user.click(incrementButtons[0]);
    await user.click(incrementButtons[0]);

    // Set reps so we can log
    await user.click(incrementButtons[1]);

    // Log and verify weight is 5kg (2 * 2.5)
    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    expect(mockOnLogSet).toHaveBeenCalledWith({
      weight_kg: 5,
      reps: 1,
      rir: null,
    });
  });

  test('Reps step is 1', async () => {
    const user = userEvent.setup();

    render(<SetLogger {...defaultProps} />);

    const incrementButtons = screen.getAllByRole('button', { name: '+' });

    // Set weight
    await user.click(incrementButtons[0]);

    // Click reps + button three times
    await user.click(incrementButtons[1]);
    await user.click(incrementButtons[1]);
    await user.click(incrementButtons[1]);

    // Log and verify reps is 3
    const logButton = screen.getByRole('button', { name: /Log Set/i });
    await user.click(logButton);

    expect(mockOnLogSet).toHaveBeenCalledWith({
      weight_kg: 2.5,
      reps: 3,
      rir: null,
    });
  });
});
