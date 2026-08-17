import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EFIGauge } from "@/components/EFIGauge";
import { DistributionBar } from "@/components/DistributionBar";
import { COEmissionCard } from "@/components/COEmissionCard";
import { EcoTipCard } from "@/components/EcoTipCard";
import { HeroBackground } from "@/components/HeroBackground";
import { AIInsightCard } from "@/components/AIInsightCard";
import { Leaf, Download, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, XCircle, Car } from "lucide-react";
import jsPDF from "jspdf";

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

const Results = () => {
  const location = useLocation();
  const { score: rawScore, percentile: rawPercentile, condition: backendCondition, input, vehicleBrand, vehicleModel, vehicleYear, fuelSystem, aiInsight, coPercentile, coAverage } = (location.state as { score: number; percentile: number; condition: string; input: EmissionInput; vehicleBrand?: string; vehicleModel?: string; vehicleYear?: number; fuelSystem?: string; aiInsight?: { summary: string; likely_causes: string[]; recommended_actions: string[]; maintenance_tips: string[]; environmental_summary?: string; ai_error?: string }; coPercentile?: number | null; coAverage?: number | null }) || {};

  // Clamp score: negative or zero values display as 1, max at 100
  const score = rawScore <= 0 ? 1 : Math.min(rawScore, 100);

  if (rawScore === undefined && rawScore !== 0) {
    return <Navigate to="/analyze" replace />;
  }

  const getStatusInfo = (condition: string) => {
    if (condition === "Good") {
      return {
        label: "Healthy",
        description: "Your engine is performing excellently with optimal emissions.",
        icon: CheckCircle,
        colorClass: "text-gauge-healthy",
        bgClass: "bg-gauge-healthy/10",
      };
    }
    if (condition === "Moderate") {
      return {
        label: "Moderate",
        description: "Your engine shows some wear. Consider maintenance soon.",
        icon: AlertTriangle,
        colorClass: "text-gauge-moderate",
        bgClass: "bg-gauge-moderate/10",
      };
    }
    return {
      label: "Poor",
      description: "Your engine needs attention. We recommend immediate inspection.",
      icon: XCircle,
      colorClass: "text-gauge-poor",
      bgClass: "bg-gauge-poor/10",
    };
  };

  const status = getStatusInfo(backendCondition ?? "Moderate");
  const percentile = rawPercentile ?? 50;

  const generatePDF = () => {
    const pdf = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // Header
    pdf.setFillColor(34, 139, 119); // Primary green
    pdf.rect(0, 0, 210, 40, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("EFI Analysis Report", 20, 25);

    // Score section
    pdf.setTextColor(33, 33, 33);
    pdf.setFontSize(16);
    pdf.text("Engine Freshness Index (EFI)", 20, 55);
    
    pdf.setFontSize(48);
    if (score >= 70) pdf.setTextColor(34, 139, 87);
    else if (score >= 40) pdf.setTextColor(202, 138, 4);
    else pdf.setTextColor(220, 38, 38);
    pdf.text(`${score}%`, 20, 80);

    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Status: ${status.label}`, 20, 95);
    pdf.text(`Performs better than ${percentile}% of engines analyzed`, 20, 105);

    // Vehicle info in PDF
    let yOffset = 115;
    pdf.setFontSize(10);
    pdf.setTextColor(110, 110, 110);
    const statusDescLines = pdf.splitTextToSize(status.description, 170);
    pdf.text(statusDescLines, 20, yOffset);
    yOffset += statusDescLines.length * 5 + 6;

    if (vehicleBrand || vehicleModel || vehicleYear) {
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Vehicle: ${[vehicleBrand, vehicleModel, vehicleYear].filter(Boolean).join(" · ")}`, 20, yOffset);
      yOffset += 8;
    }
    if (fuelSystem) {
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Fuel System: ${fuelSystem}`, 20, yOffset);
      yOffset += 8;
    }
    yOffset += 7;

    // Input values
    pdf.setTextColor(33, 33, 33);
    pdf.setFontSize(14);
    pdf.text("Emission Test Readings", 20, yOffset);
    yOffset += 15;
    
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    
    const leftCol = [
      `Acc HC: ${input.acc_hc} ppm`,
      `Acc CO: ${input.acc_co}%`,
      `Acc CO₂: ${input.acc_co2}%`,
      `Acc O₂: ${input.acc_o2}%`,
      `Acc Lambda: ${input.acc_lambda}`,
      `Acc RPM: ${input.acc_rpm}`,
    ];
    
    const rightCol = [
      `Idle HC: ${input.idle_hc} ppm`,
      `Idle CO: ${input.idle_co}%`,
      `Idle CO₂: ${input.idle_co2}%`,
      `Idle O₂: ${input.idle_o2}%`,
      `Idle Lambda: ${input.idle_lambda}`,
      `Idle RPM: ${input.idle_rpm}`,
    ];

    leftCol.forEach((text, i) => {
      pdf.text(text, 20, yOffset + i * 8);
    });
    
    rightCol.forEach((text, i) => {
      pdf.text(text, 110, yOffset + i * 8);
    });

    yOffset += leftCol.length * 8 + 10;

    // CO Emission Distribution
    if (coPercentile !== null && coPercentile !== undefined) {
      if (yOffset > 250) { pdf.addPage(); yOffset = 20; }
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text("CO Emission Distribution", 20, yOffset);
      yOffset += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      if (coAverage !== null && coAverage !== undefined) {
        pdf.text(`Average CO: ${coAverage}%`, 20, yOffset);
        yOffset += 6;
      }
      const coLowerThan = Math.max(0, Math.min(100, 100 - coPercentile));
      const coMessage =
        coPercentile <= 50
          ? `Your carbon monoxide emissions are lower than ${coLowerThan}% of vehicles analyzed.`
          : `Your engine emits more carbon monoxide than ${coPercentile}% of vehicles within the reference population.`;
      const coLines = pdf.splitTextToSize(coMessage, 170);
      pdf.text(coLines, 20, yOffset);
      yOffset += coLines.length * 5 + 10;
    }

    // Environmental Impact
    if (aiInsight?.environmental_summary) {
      if (yOffset > 250) { pdf.addPage(); yOffset = 20; }
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text("Environmental Impact", 20, yOffset);
      yOffset += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const envLines = pdf.splitTextToSize(aiInsight.environmental_summary, 170);
      pdf.text(envLines, 20, yOffset);
      yOffset += envLines.length * 5 + 10;
    }

    // AI Insight section
    if (aiInsight && !aiInsight.ai_error) {
      if (yOffset > 250) { pdf.addPage(); yOffset = 20; }
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text("AI Diagnostic Insight", 20, yOffset);
      yOffset += 10;

      // Summary
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const summaryLines = pdf.splitTextToSize(`Summary: ${aiInsight.summary}`, 170);
      pdf.text(summaryLines, 20, yOffset);
      yOffset += summaryLines.length * 5 + 5;

      // Likely Causes
      if (aiInsight.likely_causes?.length) {
        pdf.setFontSize(11);
        pdf.setTextColor(33, 33, 33);
        pdf.text("Likely Causes:", 20, yOffset);
        yOffset += 6;
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        aiInsight.likely_causes.forEach((cause) => {
          if (yOffset > 270) { pdf.addPage(); yOffset = 20; }
          const lines = pdf.splitTextToSize(`• ${cause}`, 165);
          pdf.text(lines, 25, yOffset);
          yOffset += lines.length * 5 + 2;
        });
        yOffset += 3;
      }

      // Recommended Actions
      if (aiInsight.recommended_actions?.length) {
        if (yOffset > 260) { pdf.addPage(); yOffset = 20; }
        pdf.setFontSize(11);
        pdf.setTextColor(33, 33, 33);
        pdf.text("Recommended Actions:", 20, yOffset);
        yOffset += 6;
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        aiInsight.recommended_actions.forEach((action) => {
          if (yOffset > 270) { pdf.addPage(); yOffset = 20; }
          const lines = pdf.splitTextToSize(`• ${action}`, 165);
          pdf.text(lines, 25, yOffset);
          yOffset += lines.length * 5 + 2;
        });
        yOffset += 3;
      }

      // Maintenance Tips
      if (aiInsight.maintenance_tips?.length) {
        if (yOffset > 260) { pdf.addPage(); yOffset = 20; }
        pdf.setFontSize(11);
        pdf.setTextColor(33, 33, 33);
        pdf.text("Maintenance Tips:", 20, yOffset);
        yOffset += 6;
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        aiInsight.maintenance_tips.forEach((tip) => {
          if (yOffset > 270) { pdf.addPage(); yOffset = 20; }
          const lines = pdf.splitTextToSize(`• ${tip}`, 165);
          pdf.text(lines, 25, yOffset);
          yOffset += lines.length * 5 + 2;
        });
      }
    }

    // Footer (on last page)
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated: ${timestamp}`, 20, 280);
    pdf.text("Eco EFI Check - Engine Health Analysis", 20, 287);

    pdf.save(`EFI-Report-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl lg:max-w-6xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-eco">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Eco EFI Check</span>
          </Link>
          <Link to="/analyze">
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              New Test
            </Button>
          </Link>
        </header>

        {/* Results Card */}
        <div className="bg-card rounded-3xl shadow-card border border-border/50 p-6 md:p-10 animate-scale-in">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Your EFI Results
          </h1>
          
          {/* Vehicle Info Banner */}
          {(vehicleBrand || vehicleModel || vehicleYear || fuelSystem) && (
            <div className="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>
                {[vehicleBrand, vehicleModel, vehicleYear, fuelSystem].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {!vehicleBrand && !vehicleModel && !vehicleYear && !fuelSystem && <div className="mb-8" />}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
            {/* Left column: score, status, actions */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <EFIGauge score={score} />
              </div>

              {/* Status Card */}
              <div className={`rounded-2xl p-4 ${status.bgClass} flex items-start gap-3`}>
                <status.icon className={`h-6 w-6 ${status.colorClass} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className={`font-semibold ${status.colorClass}`}>
                    Engine Condition: {status.label}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status.description}
                  </p>
                </div>
              </div>

              {/* Environmental Impact */}
              <EcoTipCard environmentalSummary={aiInsight?.environmental_summary} />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-4">
                <Button
                  variant="eco"
                  size="lg"
                  className="flex-1"
                  onClick={generatePDF}
                >
                  <Download className="h-5 w-5" />
                  Download PDF Report
                </Button>
                <Link to="/analyze" className="flex-1">
                  <Button variant="eco-outline" size="lg" className="w-full">
                    <RefreshCw className="h-5 w-5" />
                    Test Again
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right column: distributions & insights */}
            <div className="space-y-8">
              {/* Percentile */}
              <div className="text-center lg:text-left">
                <p className="text-lg text-foreground">
                  Your vehicle performs better than{" "}
                  <span className="font-bold text-primary">{percentile}%</span>
                  {" "}of engines analyzed
                </p>
              </div>

              <DistributionBar percentile={percentile} />

              {coPercentile !== null && coPercentile !== undefined && (
                <COEmissionCard coPercentile={coPercentile} coAverage={coAverage} />
              )}

              {aiInsight && !aiInsight.ai_error && (
                <AIInsightCard insight={aiInsight} />
              )}
              {aiInsight?.ai_error && (
                <div className="rounded-2xl border border-border/50 bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p>AI diagnostic insight is temporarily unavailable. Your EFI score and diagnostics are still accurate.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Results;
