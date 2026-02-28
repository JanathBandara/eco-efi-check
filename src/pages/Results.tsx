import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EFIGauge } from "@/components/EFIGauge";
import { DistributionBar } from "@/components/DistributionBar";
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
  const { score: rawScore, percentile: rawPercentile, condition: backendCondition, input, vehicleBrand, vehicleModel, vehicleYear, fuelSystem, aiInsight } = (location.state as { score: number; percentile: number; condition: string; input: EmissionInput; vehicleBrand?: string; vehicleModel?: string; vehicleYear?: number; fuelSystem?: string; aiInsight?: { summary: string; likely_causes: string[]; recommended_actions: string[]; maintenance_tips: string[] } }) || {};

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
    if (vehicleBrand || vehicleModel || vehicleYear) {
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Vehicle: ${[vehicleBrand, vehicleModel, vehicleYear].filter(Boolean).join(" · ")}`, 20, yOffset);
      yOffset += 15;
    }

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

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated: ${timestamp}`, 20, 280);
    pdf.text("EFI Analyzer - Engine Health Analysis", 20, 287);

    pdf.save(`EFI-Report-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-eco">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">EFI Analyzer</span>
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
          <div className="flex justify-center mb-8">
            <EFIGauge score={score} />
          </div>

          {/* Status Card */}
          <div className={`rounded-2xl p-4 ${status.bgClass} flex items-start gap-3 mb-8`}>
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

          {/* Percentile */}
          <div className="text-center mb-8">
            <p className="text-lg text-foreground">
              Your vehicle performs better than{" "}
              <span className="font-bold text-primary">{percentile}%</span>
              {" "}of engines analyzed
            </p>
          </div>

          {/* Distribution */}
          <div className="mb-8">
            <DistributionBar percentile={percentile} />
          </div>

          {/* AI Insight */}
          {aiInsight && (
            <div className="mb-8">
              <AIInsightCard insight={aiInsight} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
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
