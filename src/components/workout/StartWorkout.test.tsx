import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StartWorkout } from './StartWorkout';
import type { Template } from '../../types/template';
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

  const mockTemplates: Template[] = [
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
      name: 'Archived Template',
      is_archived: true,
      exercises: [],
    },
  ];

  const mockOnStarted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Start button disabled when no gym/template selected', () => {
    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    const startButton = screen.getByRole('button', { name: /Start Workout/i });
    expect(startButton).toBeDisabled();
  });

  test('Selecting gym and template enables start button', async () => {
    const user = userEvent.setup();

    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    const startButton = screen.getByRole('button', { name: /Start Workout/i });
    expect(startButton).toBeDisabled();

    // Get both select elements (gym is first, template is second)
    const selects = screen.getAllByRole('combobox');
    const gymSelect = selects[0];
    const templateSelect = selects[1];

    // Select gym
    await user.selectOptions(gymSelect, 'gym-1');

    // Button still disabled (need template too)
    expect(startButton).toBeDisabled();

    // Select template
    await user.selectOptions(templateSelect, 'template-1');

    // Button now enabled
    expect(startButton).toBeEnabled();
  });

  test('Clicking start calls startWorkout with correct IDs', async () => {
    const user = userEvent.setup();

    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    // Get both select elements (gym is first, template is second)
    const selects = screen.getAllByRole('combobox');

    // Select gym and template
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
    render(<StartWorkout templates={mockTemplates} gyms={[]} onStarted={mockOnStarted} />);

    expect(screen.getByText(/No gyms yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Add a gym below/i)).toBeInTheDocument();

    // Only 1 select should be present (template select, no gym select)
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(1);
  });

  test('Empty state message when no templates', () => {
    render(<StartWorkout templates={[]} gyms={mockGyms} onStarted={mockOnStarted} />);

    expect(screen.getByText(/No templates yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Create one in the Templates tab/i)).toBeInTheDocument();

    // Only 1 select should be present (gym select, no template select)
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(1);
  });

  test('Empty state when all templates are archived', () => {
    const archivedOnlyTemplates: Template[] = [
      {
        template_id: 'template-archived',
        name: 'Old Template',
        is_archived: true,
        exercises: [],
      },
    ];

    render(<StartWorkout templates={archivedOnlyTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    expect(screen.getByText(/No templates yet/i)).toBeInTheDocument();
  });

  test('Displays gym with location correctly', () => {
    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const gymSelect = selects[0];
    expect(gymSelect).toHaveTextContent('Gold Gym — Downtown');
  });

  test('Displays gym without location correctly', () => {
    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const gymSelect = selects[0];
    expect(gymSelect).toHaveTextContent('Home Gym');
  });

  test('Displays template with exercise count', () => {
    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const templateSelect = selects[1];
    expect(templateSelect).toHaveTextContent('Upper Body A (2 exercises)');
    expect(templateSelect).toHaveTextContent('Lower Body (1 exercises)');
  });

  test('Filters out archived templates from dropdown', () => {
    render(<StartWorkout templates={mockTemplates} gyms={mockGyms} onStarted={mockOnStarted} />);

    const selects = screen.getAllByRole('combobox');
    const templateSelect = selects[1];

    // Active templates should be visible
    expect(templateSelect).toHaveTextContent('Upper Body A');
    expect(templateSelect).toHaveTextContent('Lower Body');

    // Archived template should NOT be visible
    expect(templateSelect).not.toHaveTextContent('Archived Template');
  });
});
