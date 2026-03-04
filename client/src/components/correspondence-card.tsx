import { Card, CardContent } from "@/components/ui/card";

export function CorrespondenceCard({
  title,
  value,
  reasoning,
}: {
  title: string;
  value: string;
  reasoning: string;
}) {
  return (
    <Card
      className="border-border/20 bg-card/40"
      data-testid={`card-correspondence-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardContent className="py-3 px-4 space-y-1">
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
          {title}
        </p>
        <p className="text-sm text-foreground/90 font-medium">{value}</p>
        <p className="text-xs text-muted-foreground/70 italic leading-relaxed">
          {reasoning}
        </p>
      </CardContent>
    </Card>
  );
}
