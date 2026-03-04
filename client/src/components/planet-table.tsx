interface Planet {
  name: string;
  symbol: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  element: string;
  color: string;
  domain: string;
}

export function PlanetTable({ planets }: { planets: Planet[] }) {
  return (
    <div data-testid="planet-table">
      <h3 className="text-xs text-muted-foreground tracking-widest uppercase mb-3">
        Positions
      </h3>
      <div className="space-y-1">
        {planets.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-card/50 transition-colors"
            data-testid={`row-planet-${p.name.toLowerCase()}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-foreground/80 font-medium truncate">
                {p.name}
              </span>
              {p.retrograde && (
                <span className="text-[10px] text-red-400/70 font-mono">
                  Rx
                </span>
              )}
            </div>
            <div className="text-right text-muted-foreground font-mono shrink-0 ml-2">
              {p.degree}° {p.sign}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
