import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/HeroBackground";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Leaf, ArrowLeft, Clock, TrendingUp, Loader2, LogOut, Car, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface EFIRecord {
  id: string;
  efi_score: number;
  created_at: string;
  input: Record<string, number>;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  fuel_system: string | null;
  percentile: number | null;
  condition: string | null;
  ai_insight: Record<string, unknown> | null;
  co_percentile: number | null;
  co_average: number | null;
}

const History = () => {
  const { signOut } = useAuth();
  const [records, setRecords] = useState<EFIRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [records.length]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("efi_records")
        .update({ is_deleted: true } as any)
        .eq("id", id);

      if (error) {
        toast.error("Failed to delete record");
      } else {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        toast.success("Record deleted");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An unexpected error occurred");
    }
    setDeletingId(null);
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data, error } = await supabase
          .from("efi_records")
          .select("*")
          .eq("is_deleted", false)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setRecords(data as EFIRecord[]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load history");
      }
      setIsLoading(false);
    };

    fetchRecords();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-gauge-healthy bg-gauge-healthy/10";
    if (score >= 40) return "text-gauge-moderate bg-gauge-moderate/10";
    return "text-gauge-poor bg-gauge-poor/10";
  };

  const totalPages = Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = records.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

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

        {/* History Card */}
        <div className="bg-card rounded-3xl shadow-card border border-border/50 p-6 md:p-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl gradient-eco">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Analysis History
              </h1>
              <p className="text-muted-foreground text-sm">
                Your past EFI test results
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No analysis records yet</p>
              <Link to="/analyze">
                <Button variant="eco">Start Your First Test</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${getScoreColor(record.efi_score)}`}>
                      {record.efi_score}%
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        EFI Score: {record.efi_score}%
                      </p>
                      {(record.vehicle_brand || record.vehicle_model || record.vehicle_year) && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {[record.vehicle_brand, record.vehicle_model, record.vehicle_year].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {record.fuel_system && (
                        <p className="text-xs text-muted-foreground">
                          Fuel: {record.fuel_system}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingId === record.id}
                      onClick={() => handleDelete(record.id)}
                    >
                      {deletingId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Link 
                      to="/results" 
                      state={{ 
                        score: record.efi_score, 
                        percentile: record.percentile,
                        condition: record.condition,
                        input: record.input,
                        vehicleBrand: record.vehicle_brand,
                        vehicleModel: record.vehicle_model,
                        vehicleYear: record.vehicle_year,
                        fuelSystem: record.fuel_system,
                        aiInsight: record.ai_insight,
                        coPercentile: record.co_percentile,
                        coAverage: record.co_average,
                      }}
                    >
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
