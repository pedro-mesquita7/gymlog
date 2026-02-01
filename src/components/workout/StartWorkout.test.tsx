import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StartWorkout } from './StartWorkout';
import type { Plan } from '../../types/plan';
import type { Gym } from '../../types/database';

// Mock the Zustand store
const mockStartWorkout = vi.fn();
vi.mock('../../stores/useWorkoutStore', () => ({
  useWorkoutStore: vi.fn((selector) =>
    selector({ startWorkout: mockStartWorkout })
  ),
}));

describe('StartWorkout', () => {
  const mockGyms: Gym[] = [
    { gym_id: 'gym-1', name: 'Gold Gym', location: 'Downtown', exercise_count: 10 },
    { gym_id: 'gym-2', name: 'Home Gym', location: null, exercise_count: 5 },
  ];

  const mockPlans: Plan[] = [
    {
      template_id: 'template-1',
      name: 'Upper Body A',
      is_archived: false,
      exercises: [
        {
          exercise_id: 'ex-bench',
          order_index: 0,
          target_reps_min: 8,
          target_reps_max: 12,
          suggested_sets: 3,
          rest_seconds: null,
          replacement_exercise_id: null,
        },
        {
          exercise_id: 'ex-row',
          order_index: 1,
          target_reps_min: 8,
          target_reps_max: 12,
          suggested_sets: 3,
          rest_seconds: null,
          replacement_exercise_id: null,
        },
      ],
    },
    {
      template_id: 'template-2',
      name: 'Lower Body',
      is_archived: false,
      exercises: [
        {
          exercise_id: 'ex-squat',
          order_index: 0,
          target_reps_min: 5,
          target_reps_max: 8,
          suggested_sets: 4,
          rest_seconds: null,
          replacement_exercise_id: null,
        },
      ],
    },
    {
      template_id: 'template-3',
      name: 'Archived Plan',
      is_archived: true,
      exercises: [],
    },
  ];

  const mockOnStarted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Start button disabled when no gym/plan selected', () => {
    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    const startButton = screen.getByRole('button', { name: /Start Workout/i });
    expect(startButton).toBeDisabled();
  });

  test('Selecting gym and plan enables start button', async () => {
    const user = userEvent.setup();

    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    const startButton = screen.getByRole('button', { name: /Start Workout/i });
    expect(startButton).toBeDisabled();

    // Get both select elements (gym is first, plan is second)
    const selects = screen.getAllByRole('combobox');
    const gymSelect = selects[0];
    const planSelect = selects[1];

    // Select gym
    await user.selectOptions(gymSelect, 'gym-1');

    // Button still disabled (need plan too)
    expect(startButton).toBeDisabled();

    // Select plan
    await user.selectOptions(planSelect, 'template-1');

    // Button now enabled
    expect(startButton).toBeEnabled();
  });

  test('Clicking start calls startWorkout with correct IDs', async () => {
    const user = userEvent.setup();

    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    // Get both select elements (gym is first, plan is second)
    const selects = screen.getAllByRole('combobox');

    // Select gym and plan
    await user.selectOptions(selects[0], 'gym-2');
    await user.selectOptions(selects[1], 'template-2');

    // Click start
    const startButton = screen.getByRole('button', { name: /Start Workout/i });
    await user.click(startButton);

    // Verify startWorkout was called with correct IDs
    expect(mockStartWorkout).toHaveBeenCalledTimes(1);
    expect(mockStartWorkout).toHaveBeenCalledWith('template-2', 'gym-2');

    // Verify onStarted callback was called
    expect(mockOnStarted).toHaveBeenCalledTimes(1);
  });

  test('Empty state message when no gyms', () => {
    render(<StartWorkout plans={mockPlans} gyms={[]} onStarted={mockOnStarted} />);

    expect(screen.getByText(/No gyms yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add a gym below/i)).toBeInTheDocument();

    // Only 1 select should be present (plan select, no gym select)
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(1);
  });

  test('Empty state message when no plans', () => {
    render(<StartWorkout plans={[]} gyms={mockGyms} onStarted={mockOnStarted} />);

    expect(screen.getByText(/No plans yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Create one in the Plans tab/i)).toBeInTheDocument();

    // Only 1 select should be present (gym select, no plan select)
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(1);
  });

  test('Empty state when all plans are archived', () => {
    const archivedOnlyPlans: Plan[] = [
      {
        template_id: 'template-archived',
        name: 'Old Plan',
        is_archived: true,
        exercises: [],
      },
    ];

    render(<StartWorkout plans={archivedOnlyPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    expect(screen.getByText(/No plans yet/i)).toBeInTheDocument();
  });

  test('Displays gym with location correctly', () => {
    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const gymSelect = selects[0];
    expect(gymSelect).toHaveTextContent('Gold Gym — Downtown');
  });

  test('Displays gym without location correctly', () => {
    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const gymSelect = selects[0];
    expect(gymSelect).toHaveTextContent('Home Gym');
  });

  test('Displays plan with exercise count', () => {
    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const planSelect = selects[1];
    expect(planSelect).toHaveTextContent('Upper Body A (2 exercises)');
    expect(planSelect).toHaveTextContent('Lower Body (1 exercises)');
  });

  test('Filters out archived plans from dropdown', () => {
    render(<StartWorkout plans={mockPlans} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const planSelect = selects[1];

    // Active plans should be visible
    expect(planSelect).toHaveTextContent('Upper Body A');
    expect(planSelect).toHaveTextContent('Lower Body');

    // Archived plan should NOT be visible
    expect(planSelect).not.toHaveTextContent('Archived Plan');
  });
});
