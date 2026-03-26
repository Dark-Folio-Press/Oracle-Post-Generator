import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Archive } from "lucide-react";
import { HarmonicStrip } from "@/components/harmonic-strip";
import { PlanetTable } from "@/components/planet-table";
import type { OracleEntry } from "@shared/schema";

// ── Helpers ────────────────────────────────────────────────────────────────

function elementSymbol(el: string) {
  const map: Record<string, string> = {
    fire: "🜂", water: "🜄", air: "🜁", earth: "🜃",
  };
  return map[el?.toLowerCase()] || "✦";
}

function wavelengthToGradient(nm: number) {
  if (nm < 450) return "from-violet-900 via-purple-800 to-transparent";
  if (nm < 495) return "from-blue-900 via-blue-800 to-transparent";
  if (nm < 530) return "from-green-900 via-emerald-800 to-transparent";
  if (nm < 590) return "from-yellow-800 via-amber-700 to-transparent";
  if (nm < 625) return "from-orange-800 via-orange-700 to-transparent";
  return "from-red-900 via-red-800 to-transparent";
}

// ── Divider ────────────────────────────────────────────────────────────────

function AlmanacDivider({ glyph = "✦" }: { glyph?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-muted-foreground/40 text-xs">{glyph}</span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 font-mono mb-2">
      {children}
    </p>
  );
}

// ── Correspondence block ───────────────────────────────────────────────────

function Correspondence({ label, value, reasoning }: {
  label: string; value: string; reasoning?: string | null;
}) {
  return (
    <div className="border border-border/30 rounded-sm p-4 bg-card/40 space-y-1">
      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/50 font-mono">{label}</p>
      <p className="font-serif text-foreground text-base">{value}</p>
      {reasoning && (
        <p className="text-xs text-muted-foreground/60 italic leading-relaxed">{reasoning}</p>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function OracleRecord() {
  const params = useParams<{ date: string }>();
  const date = params.date || format(new Date(), "yyyy-MM-dd");

  const prevDate = format(subDays(parseISO(date + "T12:00:00"), 1), "yyyy-MM-dd");
  const nextDate = format(addDays(parseISO(date + "T12:00:00"), 1), "yyyy-MM-dd");

  const { data: entry, isLoading, isError } = useQuery<OracleEntry>({
    queryKey: ["/api/oracle", date],
    queryFn: async () => {
      const res = await fetch(`/api/oracle/${date}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: skyData } = useQuery({
    queryKey: ["/api/sky", date],
  });

  const planets = entry?.planetPositionsJson
    ? JSON.parse(entry.planetPositionsJson)
    : skyData?.planets || [];

  const aspects = entry?.keyAspectsJson
    ? JSON.parse(entry.keyAspectsJson)
    : [];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground/50 font-mono text-xs tracking-widest animate-pulse">
          consulting the archive...
        </p>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (isError || !entry) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-foreground/70">No record for {date}.</p>
        <Link href="/archive" className="text-xs text-muted-foreground underline underline-offset-4">
          Browse the archive
        </Link>
      </div>
    );
  }

  const gradientClass = wavelengthToGradient(entry.wavelengthNm || 550);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top nav ── */}
      <header className="border-b border-border/40 bg-card/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/archive"
            className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors font-mono tracking-wider uppercase">
            <Archive className="w-3 h-3" />
            Archive
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/oracle/${prevDate}`}
              className="p-1.5 rounded hover:bg-card transition-colors text-muted-foreground/60 hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-xs text-muted-foreground tracking-wider">{date}</span>
            <Link href={`/oracle/${nextDate}`}
              className="p-1.5 rounded hover:bg-card transition-colors text-muted-foreground/60 hover:text-foreground">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Link href="/"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors font-mono tracking-wider uppercase">
            Observatory
          </Link>
        </div>
      </header>

      {/* ── Spectral header band ── */}
      <div className={`h-1 w-full bg-gradient-to-r ${gradientClass}`} />

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* ── Masthead ── */}
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40 mb-3">
            Dark Folio Press · Observatory Record
          </p>
          <h1 className="font-serif text-3xl text-foreground tracking-wide mb-2">
            {format(parseISO(date + "T12:00:00"), "MMMM d, yyyy")}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground/70">
            <span className="font-mono">{entry.moonPhase}</span>
            {entry.retrogradeStatus && entry.retrogradeStatus !== "No retrogrades" && (
              <span className="font-mono text-xs">↺ {entry.retrogradeStatus}</span>
            )}
            {entry.dominantElement && (
              <span className="font-mono text-xs">
                {elementSymbol(entry.dominantElement)} {entry.dominantElement}-dominant
              </span>
            )}
          </div>
        </div>

        {/* ── Harmonic register ── */}
        {entry.wavelengthNm && (
          <div className="mb-8">
            <SectionLabel>Harmonic Register</SectionLabel>
            <HarmonicStrip
              wavelengthNm={entry.wavelengthNm}
              spectralColor={entry.spectralColor || ""}
            />
            <p className="text-xs text-muted-foreground/50 font-mono mt-2">
              {entry.wavelengthNm} nm · {entry.spectralColor}
              {entry.tarotColorRegister && ` · ${entry.tarotColorRegister}`}
            </p>
          </div>
        )}

        <AlmanacDivider glyph="☽" />

        {/* ── Atmospheric reading ── */}
        {entry.atmosphericReading && (
          <div className="mb-8">
            <SectionLabel>Atmospheric Reading</SectionLabel>
            <div className="space-y-3">
              {entry.atmosphericReading.split("\n").filter(Boolean).map((line, i) => (
                <p key={i} className="font-serif text-foreground/80 leading-relaxed text-base">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── Primary aspect ── */}
        {entry.primaryAspect && (
          <div className="mb-8 border-l-2 border-primary/30 pl-4">
            <SectionLabel>Primary Configuration</SectionLabel>
            <p className="font-mono text-sm text-foreground/70">{entry.primaryAspect}</p>
          </div>
        )}

        <AlmanacDivider glyph="✦" />

        {/* ── Full reading ── */}
        {entry.fullReading && (
          <div className="mb-8">
            <SectionLabel>Full Reading</SectionLabel>
            <div className="space-y-4">
              {entry.fullReading.split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i} className="font-serif text-foreground/75 leading-relaxed text-[15px]">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        <AlmanacDivider glyph="🜁" />

        {/* ── Correspondences ── */}
        <div className="mb-8">
          <SectionLabel>Daily Correspondences</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entry.todaysTarot && (
              <Correspondence
                label="Tarot"
                value={entry.todaysTarot}
                reasoning={entry.tarotReasoning}
              />
            )}
            {entry.todaysRune && (
              <Correspondence
                label="Rune"
                value={entry.todaysRune}
                reasoning={entry.runeReasoning}
              />
            )}
            {entry.todaysGem && (
              <Correspondence
                label="Gem of the Day"
                value={entry.todaysGem}
                reasoning={entry.gemReasoning}
              />
            )}
            {entry.spectralColor && entry.wavelengthNm && (
              <Correspondence
                label="Colour Register"
                value={`${entry.spectralColor} · ${entry.wavelengthNm} nm`}
                reasoning={entry.planetaryColorRegister || undefined}
              />
            )}
          </div>
        </div>

        <AlmanacDivider glyph="☉" />

        {/* ── Planet table ── */}
        {planets.length > 0 && (
          <div className="mb-8">
            <SectionLabel>Active Bodies</SectionLabel>
            <PlanetTable planets={planets} />
          </div>
        )}

        {/* ── Key aspects ── */}
        {aspects.length > 0 && (
          <div className="mb-8">
            <SectionLabel>Key Aspects</SectionLabel>
            <div className="space-y-1.5">
              {aspects.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 font-mono text-xs text-muted-foreground/70">
                  <span className="text-foreground/50 w-20 shrink-0">{a.planet1}</span>
                  <span className="text-primary/60 w-16 shrink-0">{a.type}</span>
                  <span className="text-foreground/50 w-20 shrink-0">{a.planet2}</span>
                  <span className="text-muted-foreground/40">{a.orb?.toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AlmanacDivider glyph="∴" />

        {/* ── Closing line ── */}
        <div className="text-center py-6 space-y-3">
          <p className="font-serif italic text-muted-foreground/60 text-sm leading-relaxed max-w-md mx-auto">
            {entry.closingLine || "Symbols describe atmosphere. Living remains an art."}
          </p>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground/30">
            — Dark Folio · Keeper of the Archive
          </p>
        </div>

        {/* ── Archive tags ── */}
        {entry.archiveTags && (
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {entry.archiveTags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
              <Link
                key={tag}
                href={`/archive?tag=${encodeURIComponent(tag)}`}
                className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 border border-border/30 rounded-sm text-muted-foreground/50 hover:text-muted-foreground hover:border-border/60 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}