interface Signal {
  id: string;
  weight: number;
  rationale: string[];
  allowedPhrases: string[];
}

const SIGNAL_LABELS: Record<string, string> = {
  VOLATILITY: "Volatility",
  INFORMATION_FOG: "Information Fog",
  STRUCTURAL_PRESSURE: "Structural Pressure",
  EXPANSION: "Expansion",
  ELEMENTAL_DOMINANCE: "Elemental Dominance",
};

export function SignalDisplay({ signals }: { signals: Signal[] }) {
  return (
    <div data-testid="signal-display">
      <h3 className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
        Active Signals
      </h3>
      <div className="space-y-3">
        {signals.map((s) => (
          <div
            key={s.id}
            className="space-y-1"
            data-testid={`signal-${s.id.toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground/80 font-medium">
                {SIGNAL_LABELS[s.id] || s.id}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                w{s.weight}
              </span>
            </div>
            <div className="h-1 bg-border/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(s.weight, 100)}%`,
                  backgroundColor:
                    s.weight >= 70
                      ? "#c88484"
                      : s.weight >= 50
                        ? "#cdb278"
                        : "#7ba88c",
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {s.rationale.join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
