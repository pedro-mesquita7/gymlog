export function VolumeLegend() {
  const zones = [
    { token: 'var(--color-chart-zone-under)', label: 'Under MEV', desc: 'Not enough stimulus for growth' },
    { token: 'var(--color-chart-zone-minimum)', label: 'MEV-MAV', desc: 'Minimum effective volume' },
    { token: 'var(--color-chart-zone-optimal)', label: 'MAV Range', desc: 'Optimal growth zone' },
    { token: 'var(--color-chart-zone-high)', label: 'MAV-MRV', desc: 'High volume, approaching limit' },
    { token: 'var(--color-chart-zone-over)', label: 'Over MRV', desc: 'Exceeding recovery capacity' },
  ];

  return (
    <div className="bg-bg-secondary rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-medium text-text-primary">Volume Zones</h4>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {zones.map((zone) => (
          <div key={zone.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: zone.token }}
            />
            <span className="text-xs text-text-secondary">
              <span className="font-medium">{zone.label}</span> — {zone.desc}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted pt-2 border-t border-border-primary">
        MEV = Minimum Effective Volume, MAV = Maximum Adaptive Volume, MRV = Maximum Recoverable Volume.
        Based on Schoenfeld et al. (2017) and Renaissance Periodization guidelines.
      </p>
    </div>
  );
}
