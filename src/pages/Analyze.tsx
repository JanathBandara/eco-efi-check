import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmissionInput, emissionFields } from "@/components/EmissionInput";
import { HeroBackground } from "@/components/HeroBackground";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, ArrowLeft, Loader2, Beaker } from "lucide-react";

type EmissionValues = Record<string, string>;

const Analyze = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState<EmissionValues>(
    emissionFields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {})
  );

  const handleChange = (id: string, value: string) => {
    setValues(prev => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
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
        body: input,
      });

      if (error) throw error;

      const efiScore = data.efi_score;

      // Store in database
      const { error: insertError } = await supabase
        .from("efi_records")
        .insert({
          input: input,
          efi_score: efiScore,
        });

      if (insertError) throw insertError;

      // Navigate to results with the score and input
      navigate("/results", { 
        state: { 
          score: efiScore, 
          input 
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
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
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
