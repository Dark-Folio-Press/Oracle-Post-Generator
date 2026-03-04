import { useRef, useEffect } from "react";

interface Planet {
  name: string;
  symbol: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  color: string;
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "\u2648", Taurus: "\u2649", Gemini: "\u264A", Cancer: "\u264B",
  Leo: "\u264C", Virgo: "\u264D", Libra: "\u264E", Scorpio: "\u264F",
  Sagittarius: "\u2650", Capricorn: "\u2651", Aquarius: "\u2652", Pisces: "\u2653"
};

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "\u2609", Moon: "\u263D", Mercury: "\u263F", Venus: "\u2640",
  Mars: "\u2642", Jupiter: "\u2643", Saturn: "\u2644",
  Uranus: "\u2645", Neptune: "\u2646", Pluto: "\u2647"
};

const palette = {
  wheel: "#5e5e66",
  signRing: "#2b2b32",
  signRingAlt: "#222229",
  label: "#8a8578",
  planetDot: "#e7d9a6",
  glyph: "#f1ead1",
  retro: "#c88484",
  conjunction: "#6f9c9c",
  square: "#a87373",
  trine: "#7ba88c",
  opposition: "#cdb278",
  sextile: "#8a9cb8",
};

function zodiacToAngle(sign: string, deg: number): number {
  const idx = SIGNS.indexOf(sign);
  const zodiacDeg = idx * 30 + (deg || 0);
  return ((zodiacDeg - 90) * Math.PI) / 180;
}

function absZodiacDeg(sign: string, deg: number): number {
  return SIGNS.indexOf(sign) * 30 + (deg || 0);
}

export function SkyChart({ planets }: { planets: Planet[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || planets.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    const size = container ? Math.min(container.clientWidth, 420) : 420;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;
    const planetRadius = radius - 62;

    ctx.strokeStyle = palette.wheel;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = palette.wheel;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 22, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const start = ((i * 30) - 90) * Math.PI / 180;
      const end = (((i + 1) * 30) - 90) * Math.PI / 180;

      ctx.strokeStyle = i % 2 === 0 ? palette.signRing : palette.signRingAlt;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 11, start, end);
      ctx.stroke();
    }

    ctx.strokeStyle = palette.wheel;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 12; i++) {
      const a = ((i * 30) - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      ctx.lineTo(cx + Math.cos(a) * (radius - 22), cy + Math.sin(a) * (radius - 22));
      ctx.stroke();
    }

    ctx.fillStyle = palette.label;
    ctx.font = "13px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < 12; i++) {
      const a = ((i * 30 + 15) - 90) * Math.PI / 180;
      const x = cx + Math.cos(a) * (radius - 38);
      const y = cy + Math.sin(a) * (radius - 38);
      ctx.fillText(SIGN_GLYPHS[SIGNS[i]] || SIGNS[i].slice(0, 3), x, y);
    }

    const aspects: { p1: Planet; p2: Planet; type: string }[] = [];
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const d1 = absZodiacDeg(planets[i].sign, planets[i].degree);
        const d2 = absZodiacDeg(planets[j].sign, planets[j].degree);
        let diff = Math.abs(d1 - d2);
        if (diff > 180) diff = 360 - diff;

        if (diff <= 8) aspects.push({ p1: planets[i], p2: planets[j], type: "conjunction" });
        else if (Math.abs(diff - 60) <= 6) aspects.push({ p1: planets[i], p2: planets[j], type: "sextile" });
        else if (Math.abs(diff - 90) <= 6) aspects.push({ p1: planets[i], p2: planets[j], type: "square" });
        else if (Math.abs(diff - 120) <= 6) aspects.push({ p1: planets[i], p2: planets[j], type: "trine" });
        else if (Math.abs(diff - 180) <= 6) aspects.push({ p1: planets[i], p2: planets[j], type: "opposition" });
      }
    }

    ctx.globalAlpha = 0.5;
    aspects.forEach(a => {
      const a1 = zodiacToAngle(a.p1.sign, a.p1.degree);
      const a2 = zodiacToAngle(a.p2.sign, a.p2.degree);
      const x1 = cx + Math.cos(a1) * planetRadius;
      const y1 = cy + Math.sin(a1) * planetRadius;
      const x2 = cx + Math.cos(a2) * planetRadius;
      const y2 = cy + Math.sin(a2) * planetRadius;

      const colors: Record<string, string> = {
        conjunction: palette.conjunction,
        square: palette.square,
        trine: palette.trine,
        opposition: palette.opposition,
        sextile: palette.sextile,
      };

      ctx.strokeStyle = colors[a.type] || palette.wheel;
      ctx.lineWidth = a.type === "conjunction" ? 1.5 : 1;
      ctx.setLineDash(a.type === "sextile" ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    const placed: { x: number; y: number; planet: Planet }[] = [];
    const minDist = 20;

    planets.forEach(p => {
      const angle = zodiacToAngle(p.sign, p.degree);
      let x = cx + Math.cos(angle) * planetRadius;
      let y = cy + Math.sin(angle) * planetRadius;

      for (let tries = 0; tries < 12; tries++) {
        let collided = false;
        for (const q of placed) {
          const dx = x - q.x, dy = y - q.y;
          if (Math.sqrt(dx * dx + dy * dy) < minDist) {
            collided = true;
            const na = Math.atan2(y - cy, x - cx);
            x += Math.cos(na) * 6;
            y += Math.sin(na) * 6;
            break;
          }
        }
        if (!collided) break;
      }

      placed.push({ x, y, planet: p });
    });

    placed.forEach(({ x, y, planet }) => {
      ctx.fillStyle = palette.planetDot;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.glyph;
      ctx.font = "16px serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(PLANET_GLYPHS[planet.name] || planet.name[0], x + 8, y);

      if (planet.retrograde) {
        ctx.fillStyle = palette.retro;
        ctx.font = "9px sans-serif";
        ctx.fillText("R", x - 3, y - 10);
      }
    });

  }, [planets]);

  return (
    <div className="w-full" data-testid="sky-chart">
      <canvas
        ref={canvasRef}
        className="w-full rounded-md"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
