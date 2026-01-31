import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorCard } from './ErrorCard';
import { FeatureErrorBoundary } from './FeatureErrorBoundary';
import { type ReactNode } from 'react';

describe('ErrorCard', () => {
  test('renders default "Something went wrong" message', () => {
    const mockError = new Error('Test error message');
    const mockReset = vi.fn();

    render(<ErrorCard error={mockError} resetErrorBoundary={mockReset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An error occurred while rendering this section/i)).toBeInTheDocument();
  });

  test('renders custom title when provided', () => {
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(
      <ErrorCard
        error={mockError}
        resetErrorBoundary={mockReset}
        title="Custom Error Title"
      />
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('"Show details" toggle reveals error info', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Detailed error message');
    mockError.name = 'CustomError';
    const mockReset = vi.fn();

    render(<ErrorCard error={mockError} resetErrorBoundary={mockReset} />);

    // Initially, error details are hidden
    expect(screen.queryByText('Detailed error message')).not.toBeInTheDocument();
    expect(screen.queryByText('CustomError')).not.toBeInTheDocument();

    // Click "Show details"
    const showDetailsButton = screen.getByText('Show details');
    await user.click(showDetailsButton);

    // Error details are now visible
    expect(screen.getByText('Detailed error message')).toBeInTheDocument();
    expect(screen.getByText('CustomError')).toBeInTheDocument();
    expect(screen.getByText('Hide details')).toBeInTheDocument();
  });

  test('shows context when provided', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(
      <ErrorCard
        error={mockError}
        resetErrorBoundary={mockReset}
        context="Workouts"
      />
    );

    // Expand details
    await user.click(screen.getByText('Show details'));

    // Context should be visible
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
  });

  test('"Try again" button calls resetErrorBoundary', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Test error');
    const mockReset = vi.fn();

    render(<ErrorCard error={mockError} resetErrorBoundary={mockReset} />);

    const tryAgainButton = screen.getByText('Try again');
    await user.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

describe('FeatureErrorBoundary', () => {
  // Helper component that throws an error when shouldThrow is true
  function ThrowError({ shouldThrow, children }: { shouldThrow: boolean; children?: ReactNode }) {
    if (shouldThrow) {
      throw new Error('Test component error');
    }
    return <>{children || 'Success'}</>;
  }

  test('renders children when no error occurs', () => {
    render(
      <FeatureErrorBoundary feature="Workouts">
        <ThrowError shouldThrow={false}>
          <div>Component content</div>
        </ThrowError>
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Component content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  test('catches error and renders ErrorCard', () => {
    // Suppress console.error for this test (ErrorBoundary logs to console)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FeatureErrorBoundary feature="Workouts">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Error card should be visible
    expect(screen.getByText('Workouts Error')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  test('resetErrorBoundary allows recovery', async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    let shouldThrow = true;

    const { rerender } = render(
      <FeatureErrorBoundary feature="Templates">
        <ThrowError shouldThrow={shouldThrow} />
      </FeatureErrorBoundary>
    );

    // Error boundary catches the error
    expect(screen.getByText('Templates Error')).toBeInTheDocument();

    // Fix the error
    shouldThrow = false;

    // Rerender with the same component (simulates state update)
    rerender(
      <FeatureErrorBoundary feature="Templates">
        <ThrowError shouldThrow={shouldThrow} />
      </FeatureErrorBoundary>
    );

    // Click "Try again"
    await user.click(screen.getByText('Try again'));

    // Component should render successfully now
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.queryByText('Templates Error')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  test('logs error to localStorage', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Clear localStorage before test
    localStorage.clear();

    render(
      <FeatureErrorBoundary feature="Analytics">
        <ThrowError shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    // Verify localStorage contains error log
    const errorLogString = localStorage.getItem('gymlog-error-log');
    expect(errorLogString).toBeDefined();

    // Parse the logged error
    const errorLog = JSON.parse(errorLogString!);
    expect(errorLog).toHaveLength(1);
    expect(errorLog[0]).toMatchObject({
      feature: 'Analytics',
      errorName: 'Error',
      errorMessage: 'Test component error',
    });
    expect(errorLog[0].timestamp).toBeDefined();

    consoleError.mockRestore();
  });
});
