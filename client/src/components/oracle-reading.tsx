import { Card, CardContent } from "@/components/ui/card";
import type { OracleEntry } from "@shared/schema";

export function OracleReading({ entry }: { entry: OracleEntry }) {
  return (
    <Card className="border-border/30 bg-card/50" data-testid="oracle-reading">
      <CardContent className="pt-6 space-y-6">
        {entry.atmosphericReading && (
          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground tracking-widest uppercase">
              Atmospheric Reading
            </h3>
            <div className="text-sm text-foreground/85 leading-relaxed font-serif">
              {entry.atmosphericReading.split("\n").map((p, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        )}

        {entry.fullReading && (
          <div className="space-y-3 border-t border-border/20 pt-6">
            <h3 className="text-xs text-muted-foreground tracking-widest uppercase">
              Full Reading
            </h3>
            <div className="text-sm text-foreground/80 leading-relaxed font-serif">
              {entry.fullReading.split("\n").map((p, i) => (
                <p key={i} className={i > 0 ? "mt-3" : ""}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
