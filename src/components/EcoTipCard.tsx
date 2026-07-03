import { TreeDeciduous } from "lucide-react";

export const EcoTipCard = () => {
  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card/50 p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gauge-healthy/10 flex-shrink-0">
          <TreeDeciduous className="h-5 w-5 text-gauge-healthy" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Environmental Impact
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Improving combustion efficiency by preventive maintenance may reduce
            hydrocarbon and carbon monoxide emissions.
          </p>
        </div>
      </div>
    </div>
  );
};
