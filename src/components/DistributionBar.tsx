interface DistributionBarProps {
  percentile: number;
}

export const DistributionBar = ({ percentile }: DistributionBarProps) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Population Distribution</span>
        <span className="font-medium text-foreground">Top {100 - percentile}%</span>
      </div>
      
      <div className="relative h-8 rounded-full overflow-hidden bg-muted">
        {/* Gradient background representing distribution */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, hsl(var(--gauge-poor)) 0%, hsl(var(--gauge-moderate)) 50%, hsl(var(--gauge-healthy)) 100%)"
          }}
        />
        
        {/* Marker for user's position */}
        <div 
          className="absolute top-0 h-full w-1 bg-foreground shadow-lg transition-all duration-1000"
          style={{ left: `${percentile}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-semibold bg-foreground text-background px-2 py-1 rounded">
              You
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

    </div>
  );
};
