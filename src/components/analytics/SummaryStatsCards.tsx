import type { SummaryStats } from '../../types/analytics';

interface SummaryStatsCardsProps {
  stats: SummaryStats;
  isLoading?: boolean;
}

export function SummaryStatsCards({ stats, isLoading }: SummaryStatsCardsProps) {
  const cards = [
    { label: 'Workouts', value: stats.totalWorkouts },
    { label: 'Volume', value: stats.totalVolumeKg >= 1000
        ? `${(stats.totalVolumeKg / 1000).toFixed(1)}t`
        : `${Math.round(stats.totalVolumeKg)}kg` },
    { label: 'PRs Hit', value: stats.totalPrs },
    { label: 'Streak', value: `${stats.streakWeeks}wk` },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-secondary border border-border-primary rounded-2xl p-4 animate-pulse">
            <div className="h-7 w-16 bg-bg-tertiary rounded mb-2" />
            <div className="h-4 w-12 bg-bg-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-bg-secondary border border-border-primary rounded-2xl p-4">
          <div className="text-2xl font-bold text-text-primary">{card.value}</div>
          <div className="text-sm text-text-secondary mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
