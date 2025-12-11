import { useEffect, useState } from "react";

interface EFIGaugeProps {
  score: number;
  size?: number;
}

export const EFIGauge = ({ score, size = 280 }: EFIGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const getColor = (value: number) => {
    if (value >= 70) return "hsl(var(--gauge-healthy))";
    if (value >= 40) return "hsl(var(--gauge-moderate))";
    return "hsl(var(--gauge-poor))";
  };

  const getStatus = (value: number) => {
    if (value >= 70) return { label: "Healthy", color: "text-gauge-healthy" };
    if (value >= 40) return { label: "Moderate", color: "text-gauge-moderate" };
    return { label: "Poor", color: "text-gauge-poor" };
  };

  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const status = getStatus(animatedScore);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(animatedScore)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold text-foreground">
            {animatedScore}
          </span>
          <span className="text-lg text-muted-foreground font-medium">
            EFI Score
          </span>
        </div>
      </div>
      
      <div className={`text-2xl font-semibold ${status.color}`}>
        {status.label}
      </div>
    </div>
  );
};
