import { Wind } from "lucide-react";

interface COEmissionCardProps {
  coPercentile: number;
  coAverage?: number | null;
}

export const COEmissionCard = ({ coPercentile, coAverage }: COEmissionCardProps) => {
  // co_percentile = % of vehicles with CO <= user's CO. Lower = cleaner.
  const lowerThanPct = Math.max(0, Math.min(100, 100 - coPercentile));
  const isCleaner = coPercentile <= 50;

  const message = isCleaner
    ? `Your carbon monoxide emissions are lower than ${lowerThanPct}% of vehicles analyzed.`
    : `Your engine emits more carbon monoxide than ${coPercentile}% of vehicles within the reference population.`;

  return (
    <div className="w-full space-y-3 rounded-2xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Wind className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">CO Emission Distribution</span>
        </div>
        {coAverage !== null && coAverage !== undefined && (
          <span className="text-xs text-muted-foreground">
            Avg CO: <span className="font-semibold text-foreground">{coAverage}%</span>
          </span>
        )}
      </div>

      <div className="relative h-8 rounded-full overflow-hidden bg-muted">
        {/* Green (low CO / clean) → Red (high CO / dirty) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--gauge-healthy)) 0%, hsl(var(--gauge-moderate)) 50%, hsl(var(--gauge-poor)) 100%)",
          }}
        />
        <div
          className="absolute top-0 h-full w-1 bg-foreground shadow-lg transition-all duration-1000"
          style={{ left: `${coPercentile}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-semibold bg-foreground text-background px-2 py-1 rounded">
              You
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Cleaner</span>
        <span>Reference Population</span>
        <span>Dirtier</span>
      </div>

      <p className="text-sm text-center text-muted-foreground pt-1">{message}</p>
    </div>
  );
};