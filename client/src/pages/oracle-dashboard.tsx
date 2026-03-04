import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, subDays } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Sparkles, Download, Copy, Calendar } from "lucide-react";
import { SkyChart } from "@/components/sky-chart";
import { HarmonicStrip } from "@/components/harmonic-strip";
import { PlanetTable } from "@/components/planet-table";
import { OracleReading } from "@/components/oracle-reading";
import { CorrespondenceCard } from "@/components/correspondence-card";
import { SignalDisplay } from "@/components/signal-display";
import type { OracleEntry } from "@shared/schema";

export default function OracleDashboard() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const { toast } = useToast();

  const { data: skyData, isLoading: skyLoading } = useQuery({
    queryKey: ["/api/sky", selectedDate],
  });

  const { data: oracleEntry, isLoading: oracleLoading } = useQuery<OracleEntry | null>({
    queryKey: ["/api/oracle", selectedDate],
    retry: false,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/oracle/${selectedDate}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/oracle/generate", { date: selectedDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oracle", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/oracle"] });
      toast({ title: "Oracle Generated", description: `Entry for ${selectedDate} created.` });
    },
    onError: (error: Error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleCopyExport = async () => {
    if (!oracleEntry) return;
    try {
      const res = await fetch(`/api/oracle/${selectedDate}/export?format=json`);
      const data = await res.json();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({ title: "Copied", description: "Oracle JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy Failed", variant: "destructive" });
    }
  };

  const handleHtmlExport = () => {
    window.open(`/api/oracle/${selectedDate}/export?format=html`, "_blank");
  };

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate + "T12:00:00");
    const next = direction > 0 ? addDays(current, 1) : subDays(current, 1);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  };

  const planets = skyData?.planets || [];
  const aspects = skyData?.aspects || [];
  const signals = skyData?.signals || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1
              className="text-lg font-serif tracking-wide text-foreground"
              data-testid="text-app-title"
            >
              Daily Planetary Oracle
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              Dark Folio — Keeper of the Archive
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigateDate(-1)}
              data-testid="button-prev-day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-md border border-border/50">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm text-foreground border-none outline-none font-mono"
                data-testid="input-date-picker"
              />
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigateDate(1)}
              data-testid="button-next-day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {skyLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : skyData ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
                      {skyData.moonPhase}
                    </p>
                    <p className="text-sm text-foreground/80 font-mono">
                      {skyData.primaryAspect}
                    </p>
                    {skyData.retrogradeStatus !== "No retrogrades" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {skyData.retrogradeStatus}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground tracking-wider uppercase">
                      {skyData.tarotColorRegister}
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-mono">
                      {skyData.dominantElement}-dominant
                    </p>
                  </div>
                </div>

                <HarmonicStrip
                  wavelengthNm={skyData.wavelengthNm}
                  spectralColor={skyData.spectralColor}
                />
              </div>
            ) : null}

            {oracleEntry ? (
              <OracleReading entry={oracleEntry} />
            ) : (
              <Card className="border-dashed border-border/50">
                <CardContent className="py-12 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No oracle entry for {selectedDate}.
                  </p>
                  <Button
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    data-testid="button-generate-oracle"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateMutation.isPending ? "Generating..." : "Generate Oracle"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {oracleEntry && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs text-muted-foreground tracking-widest uppercase">
                    Daily Correspondences
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {oracleEntry.todaysTarot && (
                      <CorrespondenceCard
                        title="Today's Tarot"
                        value={oracleEntry.todaysTarot}
                        reasoning={oracleEntry.tarotReasoning || ""}
                      />
                    )}
                    {oracleEntry.todaysRune && (
                      <CorrespondenceCard
                        title="Today's Rune"
                        value={oracleEntry.todaysRune}
                        reasoning={oracleEntry.runeReasoning || ""}
                      />
                    )}
                    {oracleEntry.todaysGem && (
                      <CorrespondenceCard
                        title="Today's Gem"
                        value={oracleEntry.todaysGem}
                        reasoning={oracleEntry.gemReasoning || ""}
                      />
                    )}
                    {skyData?.spectralColor && (
                      <CorrespondenceCard
                        title="Today's Colour"
                        value={`${skyData.spectralColor} (${skyData.wavelengthNm} nm)`}
                        reasoning="Derived from harmonic translation of planetary orbital ratios."
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-border/30 pt-6">
                  <p className="text-sm text-muted-foreground/70 italic text-center">
                    {oracleEntry.closingLine || "Symbols describe atmosphere. Living remains an art."}
                  </p>
                  <p className="text-xs text-muted-foreground/50 text-center mt-2">
                    — Dark Folio<br />
                    Keeper of the Archive
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyExport}
                    data-testid="button-copy-json"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHtmlExport}
                    data-testid="button-export-html"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Wix Embed
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {skyLoading ? (
              <>
                <Skeleton className="h-80 w-full rounded-md" />
                <Skeleton className="h-60 w-full rounded-md" />
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
                    Observatory
                  </h3>
                  <SkyChart planets={planets} />
                </div>

                <PlanetTable planets={planets} />

                {signals.length > 0 && (
                  <SignalDisplay signals={signals} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
