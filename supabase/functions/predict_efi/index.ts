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
let coDistributionScores: number[] | null = null;

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

async function loadCoDistribution(): Promise<number[]> {
  if (coDistributionScores !== null) {
    return coDistributionScores;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.storage
    .from("efi-distribution")
    .download("co_distribution.json");

  if (error || !data) {
    console.error("Failed to load CO distribution file:", error);
    throw new Error("Could not load CO distribution dataset");
  }

  const text = await data.text();
  const parsed = JSON.parse(text);

  const values = Array.isArray(parsed) ? parsed : Object.values(parsed);
  if (!values || values.length === 0) {
    throw new Error("Invalid CO distribution file format");
  }

  coDistributionScores = values.map(Number).filter(n => isFinite(n)).sort((a, b) => a - b);
  console.log(`CO distribution loaded: ${coDistributionScores.length} scores cached`);
  return coDistributionScores;
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

async function generateAIInsight(
  efiScore: number,
  percentile: number,
  condition: string,
  fuelSystem: string,
  diagnosticFlags: ReturnType<typeof computeDiagnosticFlags>,
  coPercentile?: number
): Promise<Record<string, unknown> | null> {
  const apiKey = Deno.env.get("GPT_API_KEY");
  if (!apiKey) {
    console.error("GPT_API_KEY not configured");
    return { ai_error: "AI insight temporarily unavailable" };
  }

  const systemPrompt = `You are an automotive emission and environmental diagnostic assistant.

You must:
- Use only the provided diagnostic flags.
- Explain the engine condition in simple terms.
- Provide safe maintenance suggestions.
- Distinguish between Carbureted and EFI engines.
- Avoid advanced mechanical instructions.
- Output valid JSON with exactly these keys: summary, likely_causes, recommended_actions, maintenance_tips, environmental_summary
- summary: a 2-3 sentence plain-language explanation
- likely_causes: array of 2-4 short strings
- recommended_actions: array of 2-4 short strings
- maintenance_tips: array of 2-3 short strings
- environmental_summary: a single concise paragraph describing the relative environmental operating condition of the vehicle, understandable for non-technical users. Empty string if co_percentile is not provided.
- Do not invent issues not supported by the flags.

environmental_summary instructions:
- co_percentile represents the relative carbon monoxide emission performance of the vehicle within the reference dataset.
- A co_percentile of 90 means the vehicle emits more carbon monoxide than approximately 90% of vehicles in the analyzed population.
- Lower co_percentile values therefore indicate comparatively cleaner combustion behaviour and more favourable environmental operating conditions.
- Higher co_percentile values indicate comparatively elevated carbon monoxide emissions and less favourable environmental operating conditions.
- Environmental observations must always remain consistent with co_percentile.
- Never describe a vehicle with low co_percentile values as having elevated carbon monoxide emissions.
- Never contradict the percentile interpretation.
- Environmental insights should focus only on combustion efficiency and relative carbon monoxide emission behaviour.
- Do not estimate greenhouse-gas emissions, carbon footprint, fuel economy, or environmental quantities that are not directly supported by the provided indicators.
- Integrate environmental observations naturally within the summary when appropriate.`;

  const userPayload = JSON.stringify({
    efi_score: efiScore,
    percentile,
    condition,
    engine_type: fuelSystem,
    diagnostic_flags: diagnosticFlags,
    co_percentile: coPercentile,
  });

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this vehicle data:\n${userPayload}` },
          ],
          temperature: 0.3,
          max_tokens: 512,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      return { ai_error: "AI insight temporarily unavailable" };
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content;
    console.log("OpenAI Raw Response:", text);
    if (!text) return { ai_error: "AI insight temporarily unavailable" };

    // Strip markdown fences if present
    let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    // Find JSON boundaries
    const jsonStart = cleaned.search(/[\{\[]/);
    const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      // Fix common issues
      cleaned = cleaned
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\x00-\x1F\x7F]/g, "");
      try {
        return JSON.parse(cleaned);
      } catch (finalErr) {
        console.error("JSON parse failed:", finalErr, "Cleaned text:", cleaned);
        return { ai_error: "AI insight temporarily unavailable" };
      }
    }
  } catch (err) {
    console.error("AI insight generation failed:", err);
    return { ai_error: "AI insight temporarily unavailable" };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- JWT Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await authClient.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // --- End Authentication ---

    const body = await req.json();
    const { fuel_system, ...input } = body as EmissionInput & { fuel_system?: string };
    console.log("Received emission data for user:", claimsData.claims.sub, "fuel_system:", fuel_system);

    // Validate all emission fields: must be finite numbers within realistic bounds
    const requiredFields = FEATURE_KEYS;
    for (const field of requiredFields) {
      const val = input[field];
      if (typeof val !== 'number' || !isFinite(val)) {
        throw new Error('Invalid input data');
      }
      if (val < 0 || val > 10000) {
        throw new Error('Input values out of acceptable range');
      }
    }

    // Validate fuel_system if provided
    if (fuel_system !== undefined && fuel_system !== null) {
      if (typeof fuel_system !== 'string' || !['Carbureted', 'EFI'].includes(fuel_system)) {
        throw new Error('Invalid fuel system type');
      }
    }

    // Load distribution (cached after first call)
    const distribution = await loadDistribution();
    const coDistribution = await loadCoDistribution();

    const efiScore = predictEFI(input);
    const percentile = computePercentile(efiScore, distribution);
    const condition = getCondition(efiScore);
    const avgCo = (input.acc_co + input.idle_co) / 2;
    const co_percentile = computePercentile(avgCo, coDistribution);
    const co_average = Math.round(avgCo * 1000) / 1000;
    const diagnostic_flags = computeDiagnosticFlags(input);
    console.log(`Avg CO: ${co_average}, CO percentile: ${co_percentile}%`);

    console.log(`EFI: ${efiScore}, Percentile: ${percentile}%, Condition: ${condition}`, diagnostic_flags);

    // Generate AI insight (non-blocking graceful failure)
    const ai_insight = await generateAIInsight(efiScore, percentile, condition, fuel_system || "Unknown", diagnostic_flags, co_percentile);

    return new Response(
      JSON.stringify({ efi_score: efiScore, percentile, condition, diagnostic_flags, ai_insight, co_percentile, co_average }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in predict_efi function:', error);
    // Only return safe, known validation messages — not internal details
    const safeMessages = ['Invalid input data', 'Input values out of acceptable range', 'Invalid fuel system type'];
    const errorMessage = error instanceof Error && safeMessages.includes(error.message)
      ? error.message
      : 'An error occurred processing your request';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
