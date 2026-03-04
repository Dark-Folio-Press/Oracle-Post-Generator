function wavelengthToHex(nm: number): string {
  if (nm < 440) return "#6a0dad";
  if (nm < 490) return "#0000cd";
  if (nm < 510) return "#00ced1";
  if (nm < 530) return "#2e8b57";
  if (nm < 570) return "#9acd32";
  if (nm < 590) return "#ffd700";
  if (nm < 620) return "#ff8c00";
  if (nm < 750) return "#dc143c";
  return "#8b0000";
}

export function HarmonicStrip({
  wavelengthNm,
  spectralColor,
}: {
  wavelengthNm: number;
  spectralColor: string;
}) {
  const hexColor = wavelengthToHex(wavelengthNm);

  return (
    <div className="space-y-1" data-testid="harmonic-strip">
      <div
        className="h-[3px] w-full rounded-full"
        style={{
          background: `linear-gradient(to right, ${hexColor}, hsl(var(--muted-foreground) / 0.3), hsl(var(--border)))`,
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60 font-mono tracking-wider">
          {wavelengthNm} nm
        </span>
        <span className="text-[10px] text-muted-foreground/60 tracking-wider uppercase">
          {spectralColor}
        </span>
      </div>
    </div>
  );
}
