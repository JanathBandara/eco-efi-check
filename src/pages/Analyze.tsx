import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmissionInput, emissionFields } from "@/components/EmissionInput";
import { HeroBackground } from "@/components/HeroBackground";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Leaf, ArrowLeft, Loader2, Beaker, LogOut, Car, Info, Fuel } from "lucide-react";

type EmissionValues = Record<string, string>;

const VEHICLE_BRANDS = [
  "Toyota", "Honda", "Nissan", "Mazda", "Suzuki", "Mitsubishi", "Subaru",
  "Ford", "Chevrolet", "BMW", "Mercedes-Benz", "Audi", "Volkswagen",
  "Hyundai", "Kia", "Peugeot", "Renault", "Fiat", "Volvo", "Jeep",
  "Land Rover", "Lexus", "Porsche", "Tesla", "Isuzu", "Daihatsu",
  "Tata", "Mahindra", "Proton", "Perodua", "Other",
];

const Analyze = () => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState<EmissionValues>(
    emissionFields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {})
  );
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [fuelSystem, setFuelSystem] = useState("");

  const handleChange = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    if (!fuelSystem) {
      toast.error("Please select a fuel system type");
      return false;
    }
    for (const field of emissionFields) {
      const value = values[field.id];
      if (!value || value.trim() === "") {
        toast.error(`Please enter a value for ${field.label}`);
        return false;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        toast.error(`${field.label} must be a valid positive number`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Prepare input data
      const input = {
        acc_hc: parseFloat(values.acc_hc),
        acc_co: parseFloat(values.acc_co),
        acc_co2: parseFloat(values.acc_co2),
        acc_o2: parseFloat(values.acc_o2),
        acc_lambda: parseFloat(values.acc_lambda),
        acc_rpm: parseFloat(values.acc_rpm),
        idle_hc: parseFloat(values.idle_hc),
        idle_co: parseFloat(values.idle_co),
        idle_co2: parseFloat(values.idle_co2),
        idle_o2: parseFloat(values.idle_o2),
        idle_lambda: parseFloat(values.idle_lambda),
        idle_rpm: parseFloat(values.idle_rpm),
      };

      // Call edge function
      const { data, error } = await supabase.functions.invoke("predict_efi", {
        body: { ...input, fuel_system: fuelSystem },
      });

      if (error) throw error;

      const efiScore = data.efi_score;
      const percentile = data.percentile ?? 50;
      const condition = data.condition ?? "Moderate";
      const aiInsight = data.ai_insight ?? null;
      const aiError = data.ai_insight?.ai_error ?? null;
      const coPercentile = data.co_percentile ?? null;
      const coAverage = data.co_average ?? null;

      if (aiError) {
        console.warn("AI Insight error from backend:", aiError);
        toast.warning(`AI Insight unavailable: ${aiError}`);
      }

      // Build vehicle info object (only include non-empty values)
      const vehicleInfo = {
        ...(vehicleBrand ? { vehicle_brand: vehicleBrand } : {}),
        ...(vehicleModel.trim() ? { vehicle_model: vehicleModel.trim() } : {}),
        ...(vehicleYear ? { vehicle_year: parseInt(vehicleYear) } : {}),
        fuel_system: fuelSystem,
      };

      // Store in database
      const { error: insertError } = await supabase
        .from("efi_records")
        .insert({
          input: input,
          efi_score: efiScore,
          user_id: session?.user?.id,
          percentile,
          condition,
          ai_insight: aiInsight,
          co_percentile: coPercentile,
          co_average: coAverage,
          ...vehicleInfo,
        } as any);

      if (insertError) throw insertError;

      // Navigate to results with the score, percentile, and input
      navigate("/results", { 
        state: { 
          score: efiScore, 
          percentile,
          condition,
          input,
          vehicleBrand: vehicleBrand || undefined,
          vehicleModel: vehicleModel.trim() || undefined,
          vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
          fuelSystem,
          aiInsight,
          coPercentile,
          coAverage,
        } 
      });

    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to analyze emissions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-eco">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">EFI Analyzer</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Form Card */}
        <div className="bg-card rounded-3xl shadow-card border border-border/50 p-6 md:p-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl gradient-eco">
              <Beaker className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Emission Test Input
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your vehicle's emission readings below
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Fuel System (Mandatory) */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full gradient-eco flex items-center justify-center text-primary-foreground text-sm">
                  <Fuel className="h-4 w-4" />
                </span>
                Fuel System
                <span className="text-xs font-normal text-destructive ml-1">*Required</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFuelSystem("Carbureted")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    fuelSystem === "Carbureted"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-foreground">Carbureted</p>
                  <p className="text-xs text-muted-foreground mt-1">Traditional carburetor fuel system</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFuelSystem("EFI")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    fuelSystem === "EFI"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-foreground">EFI</p>
                  <p className="text-xs text-muted-foreground mt-1">Electronic Fuel Injection</p>
                </button>
              </div>
            </div>

            {/* Vehicle Information (Optional) */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  <Car className="h-4 w-4" />
                </span>
                Vehicle Information
                <span className="text-xs font-normal text-muted-foreground ml-1">(Optional)</span>
              </h2>
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-muted/40 border border-border/50">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Vehicle details help you identify your records in history and may be used to improve our analysis model in the future. This information is optional.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_brand" className="text-sm font-medium text-foreground">Brand</Label>
                  <Select value={vehicleBrand} onValueChange={setVehicleBrand}>
                    <SelectTrigger className="h-11 rounded-lg border-border bg-card">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model" className="text-sm font-medium text-foreground">Model</Label>
                  <Input
                    id="vehicle_model"
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="e.g. Corolla"
                    maxLength={50}
                    className="h-11 rounded-lg border-border bg-card"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_year" className="text-sm font-medium text-foreground">Year</Label>
                  <Input
                    id="vehicle_year"
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="e.g. 2020"
                    min={1950}
                    max={new Date().getFullYear() + 1}
                    className="h-11 rounded-lg border-border bg-card"
                  />
                </div>
              </div>
            </div>

            {/* Acceleration readings */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full gradient-eco flex items-center justify-center text-primary-foreground text-sm font-bold">1</span>
                Acceleration Readings
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emissionFields.slice(0, 6).map(field => (
                  <EmissionInput
                    key={field.id}
                    id={field.id}
                    label={field.label}
                    value={values[field.id]}
                    onChange={(v) => handleChange(field.id, v)}
                    icon={field.icon}
                    unit={field.unit}
                  />
                ))}
              </div>
            </div>

            {/* Idle readings */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full gradient-eco flex items-center justify-center text-primary-foreground text-sm font-bold">2</span>
                Idle Readings
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emissionFields.slice(6).map(field => (
                  <EmissionInput
                    key={field.id}
                    id={field.id}
                    label={field.label}
                    value={values[field.id]}
                    onChange={(v) => handleChange(field.id, v)}
                    icon={field.icon}
                    unit={field.unit}
                  />
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              variant="eco" 
              size="xl" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Calculate EFI"
              )}
            </Button>
          </form>
        </div>

        {/* Future features placeholder */}
        <div className="mt-8 p-6 rounded-2xl border border-dashed border-border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            🔮 Coming soon: Air-fuel mixture graphs and advanced analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analyze;
