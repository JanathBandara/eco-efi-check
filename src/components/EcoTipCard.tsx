import { TreeDeciduous } from "lucide-react";

interface EcoTipCardProps {
  environmentalSummary?: string | null;
  environmentalStatus?: string | null;
}

const DEFAULT_MESSAGE =
  "Improving combustion efficiency by preventive maintenance may reduce hydrocarbon and carbon monoxide emissions.";

export const EcoTipCard = ({ environmentalSummary, environmentalStatus }: EcoTipCardProps = {}) => {
  const message =
    environmentalSummary && environmentalSummary.trim().length > 0
      ? environmentalSummary
      : DEFAULT_MESSAGE;
  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gauge-healthy/10 flex-shrink-0">
          <TreeDeciduous className="h-5 w-5 text-gauge-healthy" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground">
              Environmental Impact
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
