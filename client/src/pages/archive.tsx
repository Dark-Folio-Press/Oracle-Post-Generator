import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { format, parseISO } from "date-fns";
import { Search, X, Filter } from "lucide-react";
import type { OracleEntry } from "@shared/schema";

// ── Helpers ────────────────────────────────────────────────────────────────

function elementSymbol(el: string) {
  const map: Record<string, string> = { fire: "🜂", water: "🜄", air: "🜁", earth: "🜃" };
  return map[el?.toLowerCase()] || "✦";
}

function elementColor(el: string) {
  const map: Record<string, string> = {
    fire: "text-orange-400/70",
    water: "text-blue-400/70",
    air: "text-sky-300/70",
    earth: "text-emerald-500/70",
  };
  return map[el?.toLowerCase()] || "text-muted-foreground";
}

function wavelengthDot(nm: number | null) {
  if (!nm) return "#888";
  if (nm < 450) return "#7c3aed";
  if (nm < 495) return "#2563eb";
  if (nm < 530) return "#16a34a";
  if (nm < 590) return "#ca8a04";
  if (nm < 625) return "#ea580c";
  return "#dc2626";
}

// ── Filter pill ────────────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-card border border-primary/30 rounded-sm text-[10px] font-mono tracking-wider uppercase text-primary/70">
      {label}
      <button onClick={onRemove} className="hover:text-primary transition-colors">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ── Entry row ──────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: OracleEntry }) {
  const dot = wavelengthDot(entry.wavelengthNm);

  return (
    <Link href={`/oracle/${entry.date}`}>
      <div className="group flex items-start gap-4 px-4 py-4 border-b border-border/20 hover:bg-card/40 transition-colors cursor-pointer">

        {/* Wavelength dot */}
        <div className="mt-1.5 shrink-0">
          <div
            className="w-2 h-2 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: dot }}
          />
        </div>

        {/* Date */}
        <div className="w-28 shrink-0">
          <p className="font-mono text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
            {format(parseISO(entry.date + "T12:00:00"), "MMM d, yyyy")}
          </p>
        </div>

        {/* Moon + aspect */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/80 font-serif truncate group-hover:text-foreground transition-colors">
            {entry.moonPhase}
          </p>
          {entry.primaryAspect && (
            <p className="text-xs text-muted-foreground/50 font-mono truncate mt-0.5">
              {entry.primaryAspect}
            </p>
          )}
        </div>

        {/* Element */}
        {entry.dominantElement && (
          <div className="shrink-0 hidden sm:block">
            <span className={`font-mono text-xs ${elementColor(entry.dominantElement)}`}>
              {elementSymbol(entry.dominantElement)} {entry.dominantElement}
            </span>
          </div>
        )}

        {/* Correspondences */}
        <div className="shrink-0 hidden md:flex flex-col items-end gap-0.5">
          {entry.todaysTarot && (
            <span className="text-[10px] font-mono text-muted-foreground/50 truncate max-w-[120px]">
              {entry.todaysTarot}
            </span>
          )}
          {entry.todaysRune && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              {entry.todaysRune}
            </span>
          )}
        </div>

        {/* nm */}
        {entry.wavelengthNm && (
          <div className="shrink-0 hidden lg:block">
            <span className="font-mono text-[10px] text-muted-foreground/30">
              {entry.wavelengthNm}nm
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main archive page ──────────────────────────────────────────────────────

export default function ArchivePage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialTag = params.get("tag") || "";

  const [search, setSearch] = useState("");
  const [filterElement, setFilterElement] = useState("");
  const [filterTarot, setFilterTarot] = useState("");
  const [filterRune, setFilterRune] = useState("");
  const [filterGem, setFilterGem] = useState("");
  const [filterMoon, setFilterMoon] = useState("");
  const [filterTag, setFilterTag] = useState(initialTag);
  const [showFilters, setShowFilters] = useState(!!initialTag);

  const { data: entries = [], isLoading } = useQuery<OracleEntry[]>({
    queryKey: ["/api/oracle"],
    queryFn: async () => {
      const res = await fetch("/api/oracle");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // ── Unique filter values ─────────────────────────────────────────────────
  const filterOptions = useMemo(() => {
    const elements = [...new Set(entries.map(e => e.dominantElement).filter(Boolean))];
    const tarots = [...new Set(entries.map(e => e.todaysTarot).filter(Boolean))].sort();
    const runes = [...new Set(entries.map(e => e.todaysRune).filter(Boolean))].sort();
    const gems = [...new Set(entries.map(e => e.todaysGem).filter(Boolean))].sort();
    const moons = [...new Set(entries.map(e => e.moonPhase).filter(Boolean))].sort();
    const tags = [...new Set(
      entries.flatMap(e => e.archiveTags ? e.archiveTags.split(",").map(t => t.trim()) : [])
        .filter(Boolean)
    )].sort();
    return { elements, tarots, runes, gems, moons, tags };
  }, [entries]);

  // ── Filtered entries ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterElement && e.dominantElement?.toLowerCase() !== filterElement.toLowerCase()) return false;
      if (filterTarot && e.todaysTarot !== filterTarot) return false;
      if (filterRune && e.todaysRune !== filterRune) return false;
      if (filterGem && e.todaysGem !== filterGem) return false;
      if (filterMoon && e.moonPhase !== filterMoon) return false;
      if (filterTag && !e.archiveTags?.includes(filterTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.date.includes(q) ||
          e.moonPhase?.toLowerCase().includes(q) ||
          e.todaysTarot?.toLowerCase().includes(q) ||
          e.todaysRune?.toLowerCase().includes(q) ||
          e.todaysGem?.toLowerCase().includes(q) ||
          e.dominantElement?.toLowerCase().includes(q) ||
          e.atmosphericReading?.toLowerCase().includes(q) ||
          e.archiveTags?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, filterElement, filterTarot, filterRune, filterGem, filterMoon, filterTag, search]);

  const activeFilters = [
    filterElement && { label: `Element: ${filterElement}`, clear: () => setFilterElement("") },
    filterTarot  && { label: `Tarot: ${filterTarot}`,     clear: () => setFilterTarot("") },
    filterRune   && { label: `Rune: ${filterRune}`,       clear: () => setFilterRune("") },
    filterGem    && { label: `Gem: ${filterGem}`,         clear: () => setFilterGem("") },
    filterMoon   && { label: `Moon: ${filterMoon}`,       clear: () => setFilterMoon("") },
    filterTag    && { label: `Tag: ${filterTag}`,         clear: () => setFilterTag("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  function clearAll() {
    setFilterElement(""); setFilterTarot(""); setFilterRune("");
    setFilterGem(""); setFilterMoon(""); setFilterTag(""); setSearch("");
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <header className="border-b border-border/40 bg-card/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-lg text-foreground tracking-wide">The Archive</h1>
            <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/40">
              Dark Folio · Observatory Records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/"
              className="text-xs font-mono tracking-wider uppercase text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              Observatory
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Search + filter toggle ── */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="search"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border/40 rounded-sm text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-sm text-xs font-mono tracking-wider uppercase transition-colors ${
              showFilters || activeFilters.length > 0
                ? "border-primary/40 text-primary/70 bg-card"
                : "border-border/40 text-muted-foreground/50 hover:border-border/60"
            }`}
          >
            <Filter className="w-3 h-3" />
            Filter
            {activeFilters.length > 0 && (
              <span className="bg-primary/20 text-primary/80 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="mb-6 p-4 bg-card/30 border border-border/30 rounded-sm space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

              {/* Element */}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40 mb-1.5">Element</p>
                <select
                  value={filterElement}
                  onChange={e => setFilterElement(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-sm px-2 py-1.5 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/40"
                >
                  <option value="">All</option>
                  {filterOptions.elements.map(el => (
                    <option key={el} value={el!}>{elementSymbol(el!)} {el}</option>
                  ))}
                </select>
              </div>

              {/* Moon phase */}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40 mb-1.5">Moon Phase</p>
                <select
                  value={filterMoon}
                  onChange={e => setFilterMoon(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-sm px-2 py-1.5 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/40"
                >
                  <option value="">All</option>
                  {filterOptions.moons.map(m => (
                    <option key={m} value={m!}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Tarot */}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40 mb-1.5">Tarot</p>
                <select
                  value={filterTarot}
                  onChange={e => setFilterTarot(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-sm px-2 py-1.5 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/40"
                >
                  <option value="">All</option>
                  {filterOptions.tarots.map(t => (
                    <option key={t} value={t!}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Rune */}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40 mb-1.5">Rune</p>
                <select
                  value={filterRune}
                  onChange={e => setFilterRune(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-sm px-2 py-1.5 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/40"
                >
                  <option value="">All</option>
                  {filterOptions.runes.map(r => (
                    <option key={r} value={r!}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Gem */}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40 mb-1.5">Gem</p>
                <select
                  value={filterGem}
                  onChange={e => setFilterGem(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-sm px-2 py-1.5 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/40"
                >
                  <option value="">All</option>
                  {filterOptions.gems.map(g => (
                    <option key={g} value={g!}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Tag */}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/40 mb-1.5">Tag</p>
                <select
                  value={filterTag}
                  onChange={e => setFilterTag(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-sm px-2 py-1.5 text-xs font-mono text-foreground/70 focus:outline-none focus:border-primary/40"
                >
                  <option value="">All</option>
                  {filterOptions.tags.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        )}

        {/* ── Active filter pills ── */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilters.map(f => (
              <FilterPill key={f.label} label={f.label} onRemove={f.clear} />
            ))}
            <button
              onClick={clearAll}
              className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Results count ── */}
        <div className="flex items-center justify-between mb-2 px-4">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30">
            {isLoading ? "Loading..." : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/20">
            {entries.length} total
          </p>
        </div>

        {/* ── Column headers ── */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
          <div className="w-2 shrink-0" />
          <p className="w-28 shrink-0 text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30">Date</p>
          <p className="flex-1 text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30">Moon · Aspect</p>
          <p className="w-20 shrink-0 hidden sm:block text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30">Element</p>
          <p className="w-28 shrink-0 hidden md:block text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30 text-right">Tarot · Rune</p>
          <p className="w-12 shrink-0 hidden lg:block text-[10px] font-mono tracking-widest uppercase text-muted-foreground/30 text-right">λ</p>
        </div>

        {/* ── Entries ── */}
        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-xs font-mono text-muted-foreground/30 tracking-widest animate-pulse">
              consulting the archive...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="font-serif text-muted-foreground/50">No records match your filters.</p>
            <button onClick={clearAll} className="text-xs font-mono text-muted-foreground/40 underline underline-offset-4">
              Clear filters
            </button>
          </div>
        ) : (
          <div>
            {filtered.map(entry => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-12 text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground/20">
            Dark Folio · Keeper of the Archive
          </p>
        </div>

      </main>
    </div>
  );
}