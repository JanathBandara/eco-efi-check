import { TreeDeciduous } from "lucide-react";

interface EcoTipCardProps {
  environmentalSummary?: string | null;
}

const DEFAULT_MESSAGE =
  "Improving combustion efficiency by preventive maintenance may reduce hydrocarbon and carbon monoxide emissions.";

export const EcoTipCard = ({ environmentalSummary }: EcoTipCardProps = {}) => {
  const message =
    environmentalSummary && environmentalSummary.trim().length > 0
      ? environmentalSummary
      : DEFAULT_MESSAGE;
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-gauge-healthy/40 bg-gauge-healthy/5 p-5 shadow-card">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gauge-healthy" />
      <div className="flex items-start gap-3 pl-2">
        <div className="p-2 rounded-lg bg-gauge-healthy/15 flex-shrink-0">
          <TreeDeciduous className="h-5 w-5 text-gauge-healthy" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground mb-1.5">
            Environmental Impact
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
