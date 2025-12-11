import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gauge, 
  Wind, 
  Droplets, 
  Atom, 
  Waves, 
  Activity,
  type LucideIcon 
} from "lucide-react";

interface EmissionInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  unit?: string;
  placeholder?: string;
}

export const EmissionInput = ({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  unit,
  placeholder = "0.00"
}: EmissionInputProps) => {
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <Icon className="h-4 w-4 text-primary" />
        {label}
        {unit && <span className="text-muted-foreground">({unit})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg border-border bg-card focus:border-primary focus:ring-primary"
      />
    </div>
  );
};

export const emissionFields = [
  { id: "acc_hc", label: "Acc HC", icon: Wind, unit: "ppm" },
  { id: "acc_co", label: "Acc CO", icon: Droplets, unit: "%" },
  { id: "acc_co2", label: "Acc CO₂", icon: Atom, unit: "%" },
  { id: "acc_o2", label: "Acc O₂", icon: Waves, unit: "%" },
  { id: "acc_lambda", label: "Acc Lambda", icon: Activity, unit: "" },
  { id: "acc_rpm", label: "Acc RPM", icon: Gauge, unit: "rpm" },
  { id: "idle_hc", label: "Idle HC", icon: Wind, unit: "ppm" },
  { id: "idle_co", label: "Idle CO", icon: Droplets, unit: "%" },
  { id: "idle_co2", label: "Idle CO₂", icon: Atom, unit: "%" },
  { id: "idle_o2", label: "Idle O₂", icon: Waves, unit: "%" },
  { id: "idle_lambda", label: "Idle Lambda", icon: Activity, unit: "" },
  { id: "idle_rpm", label: "Idle RPM", icon: Gauge, unit: "rpm" },
];
