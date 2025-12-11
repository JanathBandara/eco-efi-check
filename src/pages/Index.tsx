import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/HeroBackground";
import { Leaf, Gauge, FileCheck, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-eco">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">EFI Analyzer</span>
          </div>
          <Link to="/history">
            <Button variant="ghost" size="sm">
              History
            </Button>
          </Link>
        </header>

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center text-center pt-12 md:pt-24 pb-16">
          <div className="animate-fade-in space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              <Gauge className="h-4 w-4" />
              Engine Health Analysis
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Check Your{" "}
              <span className="text-gradient-eco">Engine Health</span>
              {" "}Using Emission Data
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Enter your vehicle's emission test readings and instantly get your 
              Engine Freshness Index (EFI) predicted using advanced machine learning.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/analyze">
                <Button variant="eco" size="xl" className="group">
                  Start EFI Check
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="eco-outline" size="lg">
                  View Past Results
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div 
            className="grid md:grid-cols-3 gap-6 mt-24 w-full max-w-4xl animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {[
              {
                icon: Gauge,
                title: "Instant Analysis",
                description: "Get your EFI score in seconds using our AI-powered prediction model"
              },
              {
                icon: FileCheck,
                title: "PDF Reports",
                description: "Download detailed reports with your emission readings and EFI score"
              },
              {
                icon: Leaf,
                title: "Eco Insights",
                description: "Understand your engine's environmental impact and health status"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-card shadow-card border border-border/50 hover:shadow-eco transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl gradient-eco flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* Footer placeholder for future features */}
        <footer className="text-center py-8 border-t border-border mt-auto">
          <p className="text-sm text-muted-foreground">
            Coming soon: Compare with national average • Advanced emissions breakdown
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
