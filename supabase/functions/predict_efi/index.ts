import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmissionInput {
  acc_hc: number;
  acc_co: number;
  acc_co2: number;
  acc_o2: number;
  acc_lambda: number;
  acc_rpm: number;
  idle_hc: number;
  idle_co: number;
  idle_co2: number;
  idle_o2: number;
  idle_lambda: number;
  idle_rpm: number;
}

// Simulated Random Forest prediction logic
// In production, this would load an actual model file
function predictEFI(input: EmissionInput): number {
  console.log("Predicting EFI for input:", input);
  
  // Normalize and weight each parameter
  // Lower HC, CO, O2 deviation from optimal = better
  // Higher CO2, closer Lambda to 1 = better
  // Optimal RPM ranges considered
  
  let score = 100;
  
  // HC scoring (lower is better, optimal < 100ppm)
  const hcPenalty = (input.acc_hc + input.idle_hc) / 2;
  if (hcPenalty > 200) score -= 20;
  else if (hcPenalty > 100) score -= 10;
  else if (hcPenalty > 50) score -= 5;
  
  // CO scoring (lower is better, optimal < 0.5%)
  const coPenalty = (input.acc_co + input.idle_co) / 2;
  if (coPenalty > 2) score -= 20;
  else if (coPenalty > 1) score -= 15;
  else if (coPenalty > 0.5) score -= 5;
  
  // CO2 scoring (higher is better for combustion efficiency, optimal 13-15%)
  const co2Avg = (input.acc_co2 + input.idle_co2) / 2;
  if (co2Avg < 10) score -= 15;
  else if (co2Avg < 12) score -= 8;
  else if (co2Avg > 15) score -= 5;
  
  // O2 scoring (lower is better, optimal < 2%)
  const o2Avg = (input.acc_o2 + input.idle_o2) / 2;
  if (o2Avg > 5) score -= 15;
  else if (o2Avg > 3) score -= 10;
  else if (o2Avg > 2) score -= 5;
  
  // Lambda scoring (closer to 1 is better)
  const lambdaDeviation = Math.abs(1 - (input.acc_lambda + input.idle_lambda) / 2);
  if (lambdaDeviation > 0.1) score -= 20;
  else if (lambdaDeviation > 0.05) score -= 10;
  else if (lambdaDeviation > 0.02) score -= 5;
  
  // RPM health check (idle should be 650-900, acc should be appropriate)
  if (input.idle_rpm < 500 || input.idle_rpm > 1100) score -= 10;
  if (input.acc_rpm < 2000 || input.acc_rpm > 4000) score -= 5;
  
  // Add some controlled randomness for realism (+/- 5%)
  const variance = (Math.random() - 0.5) * 10;
  score = Math.round(score + variance);
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: EmissionInput = await req.json();
    
    console.log("Received emission data:", input);
    
    // Validate input
    const requiredFields = [
      'acc_hc', 'acc_co', 'acc_co2', 'acc_o2', 'acc_lambda', 'acc_rpm',
      'idle_hc', 'idle_co', 'idle_co2', 'idle_o2', 'idle_lambda', 'idle_rpm'
    ];
    
    for (const field of requiredFields) {
      if (typeof input[field as keyof EmissionInput] !== 'number') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }
    
    // Predict EFI score
    const efiScore = predictEFI(input);
    
    console.log("Predicted EFI score:", efiScore);
    
    return new Response(
      JSON.stringify({ efi_score: efiScore }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error('Error in predict_efi function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
