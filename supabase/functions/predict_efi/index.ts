import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import modelData from "./efi_forest_model_lite.json" with { type: "json" };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

interface TreeNode {
  t: "n" | "l";
  f?: number;
  th?: number;
  l?: TreeNode;
  r?: TreeNode;
  v?: number;
}

const FEATURE_KEYS: (keyof EmissionInput)[] = [
  'acc_hc', 'acc_co', 'acc_co2', 'acc_o2', 'acc_lambda', 'acc_rpm',
  'idle_hc', 'idle_co', 'idle_co2', 'idle_o2', 'idle_lambda', 'idle_rpm',
];

// Cached distribution data - loaded once per cold start
let distributionScores: number[] | null = null;

async function loadDistribution(): Promise<number[]> {
  if (distributionScores !== null) {
    return distributionScores;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.storage
    .from("efi-distribution")
    .download("efi_distribution.json");

  if (error || !data) {
    console.error("Failed to load distribution file:", error);
    throw new Error("Could not load EFI distribution dataset");
  }

  const text = await data.text();
  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid distribution file format");
  }

  distributionScores = parsed.map(Number).sort((a, b) => a - b);
  console.log(`Distribution loaded: ${distributionScores.length} scores cached`);
  return distributionScores;
}

function computePercentile(score: number, distribution: number[]): number {
  const belowOrEqual = distribution.filter(s => s <= score).length;
  const percentile = Math.round((belowOrEqual / distribution.length) * 100);
  return Math.max(0, Math.min(100, percentile));
}

function getCondition(score: number): string {
  if (score >= 73) return "Good";
  if (score >= 50) return "Moderate";
  return "Poor";
}

function computeDiagnosticFlags(input: EmissionInput) {
  const avgHC = (input.acc_hc + input.idle_hc) / 2;
  const avgCO = (input.acc_co + input.idle_co) / 2;
  const avgO2 = (input.acc_o2 + input.idle_o2) / 2;
  const avgLambda = (input.acc_lambda + input.idle_lambda) / 2;

  const mixture_state = avgLambda < 1.00 ? "Rich" : avgLambda <= 1.12 ? "Balanced" : "Lean";

  const combustion_quality = avgHC < 75 ? "Efficient Combustion" : avgHC <= 170 ? "Moderate Combustion Efficiency" : "Incomplete Combustion";

  const fuel_burn_efficiency = avgCO < 0.2 ? "Clean Fuel Burn" : avgCO <= 0.55 ? "Moderate Fuel Efficiency" : "Excess Fuel / Inefficient Burn";

  const oxygen_balance = avgO2 < 2 ? "Normal Oxygen Level" : avgO2 <= 4 ? "Elevated Oxygen" : "Excess Oxygen (Lean Mixture Indicator)";

  return { mixture_state, combustion_quality, fuel_burn_efficiency, oxygen_balance };
}

function traverseTree(node: TreeNode, features: number[]): number {
  if (node.t === "l") {
    return node.v!;
  }
  if (features[node.f!] <= node.th!) {
    return traverseTree(node.l!, features);
  } else {
    return traverseTree(node.r!, features);
  }
}

function predictEFI(input: EmissionInput): number {
  const features = FEATURE_KEYS.map(k => input[k]);
  const trees = modelData as TreeNode[];

  let sum = 0;
  for (const tree of trees) {
    sum += traverseTree(tree, features);
  }
  const raw = sum / trees.length;

  console.log("Raw model prediction:", raw);
  return Math.max(1, Math.min(100, Math.round(raw)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: EmissionInput = await req.json();
    console.log("Received emission data:", input);

    const requiredFields = FEATURE_KEYS;
    for (const field of requiredFields) {
      if (typeof input[field] !== 'number') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    // Load distribution (cached after first call)
    const distribution = await loadDistribution();

    const efiScore = predictEFI(input);
    const percentile = computePercentile(efiScore, distribution);
    const condition = getCondition(efiScore);
    const diagnostic_flags = computeDiagnosticFlags(input);

    console.log(`EFI: ${efiScore}, Percentile: ${percentile}%, Condition: ${condition}`, diagnostic_flags);

    return new Response(
      JSON.stringify({ efi_score: efiScore, percentile, condition, diagnostic_flags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in predict_efi function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
