import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import modelData from "./efi_forest_model_lite.json" with { type: "json" };

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

interface TreeNode {
  t: "n" | "l";
  f?: number;
  th?: number;
  l?: TreeNode;
  r?: TreeNode;
  v?: number;
}

// Feature order matching the trained model
const FEATURE_KEYS: (keyof EmissionInput)[] = [
  'acc_hc', 'acc_co', 'acc_co2', 'acc_o2', 'acc_lambda', 'acc_rpm',
  'idle_hc', 'idle_co', 'idle_co2', 'idle_o2', 'idle_lambda', 'idle_rpm',
];

function traverseTree(node: TreeNode, features: number[]): number {
  if (node.t === "l") {
    return node.v!;
  }
  // Internal node: compare feature at index `f` with threshold `th`
  if (features[node.f!] <= node.th!) {
    return traverseTree(node.l!, features);
  } else {
    return traverseTree(node.r!, features);
  }
}

function predictEFI(input: EmissionInput): number {
  const features = FEATURE_KEYS.map(k => input[k]);
  const trees = modelData as TreeNode[];

  // Average predictions across all trees (Random Forest)
  let sum = 0;
  for (const tree of trees) {
    sum += traverseTree(tree, features);
  }
  const raw = sum / trees.length;

  console.log("Raw model prediction:", raw);

  // Clamp: scores ≤ 0 become 1, scores > 100 capped at 100
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

    const efiScore = predictEFI(input);
    console.log("Predicted EFI score:", efiScore);

    return new Response(
      JSON.stringify({ efi_score: efiScore }),
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
