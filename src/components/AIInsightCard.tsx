import { Brain, AlertCircle, Wrench, Lightbulb } from "lucide-react";

interface AIInsight {
  summary: string;
  likely_causes: string[];
  recommended_actions: string[];
  maintenance_tips: string[];
}

interface AIInsightCardProps {
  insight: AIInsight | null;
}

export const AIInsightCard = ({ insight }: AIInsightCardProps) => {
  if (!insight) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg gradient-eco">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">AI Diagnostic Insight</h2>
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-muted/50 border border-border/50 p-4">
        <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
      </div>

      {/* Likely Causes */}
      {insight.likely_causes?.length > 0 && (
        <div className="rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-gauge-moderate" />
            <h3 className="font-semibold text-sm text-foreground">Likely Causes</h3>
          </div>
          <ul className="space-y-2">
            {insight.likely_causes.map((cause, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-gauge-moderate mt-0.5">•</span>
                {cause}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {insight.recommended_actions?.length > 0 && (
        <div className="rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Recommended Actions</h3>
          </div>
          <ul className="space-y-2">
            {insight.recommended_actions.map((action, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Maintenance Tips */}
      {insight.maintenance_tips?.length > 0 && (
        <div className="rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-gauge-healthy" />
            <h3 className="font-semibold text-sm text-foreground">Maintenance Tips</h3>
          </div>
          <ul className="space-y-2">
            {insight.maintenance_tips.map((tip, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-gauge-healthy mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
