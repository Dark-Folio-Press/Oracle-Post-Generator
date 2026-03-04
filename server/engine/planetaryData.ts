export interface PlanetPosition {
  name: string;
  symbol: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  element: string;
  color: string;
  domain: string;
}

export interface AspectInfo {
  planet1: string;
  planet2: string;
  type: "conjunction" | "square" | "trine" | "opposition" | "sextile";
  orb: number;
}

export interface SignalResult {
  id: string;
  weight: number;
  rationale: string[];
  allowedPhrases: string[];
}

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: "fire", Taurus: "earth", Gemini: "air", Cancer: "water",
  Leo: "fire", Virgo: "earth", Libra: "air", Scorpio: "water",
  Sagittarius: "fire", Capricorn: "earth", Aquarius: "air", Pisces: "water"
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇"
};

const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFD700", Moon: "#C0C0C0", Mercury: "#B5B5B5", Venus: "#FFA07A",
  Mars: "#FF4500", Jupiter: "#DEB887", Saturn: "#DAA520", Uranus: "#87CEEB",
  Neptune: "#4169E1", Pluto: "#8B4513"
};

const PLANET_DOMAINS: Record<string, string> = {
  Sun: "identity, vitality, life purpose",
  Moon: "emotions, instincts, subconscious",
  Mercury: "communication, thought, travel",
  Venus: "love, beauty, values, money",
  Mars: "action, desire, conflict, drive",
  Jupiter: "expansion, luck, wisdom, growth",
  Saturn: "structure, discipline, karma, limits",
  Uranus: "disruption, innovation, rebellion",
  Neptune: "dreams, illusion, spirituality",
  Pluto: "power, transformation, rebirth"
};

const MOON_PHASES = [
  "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
  "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function calculatePlanetPositions(dateStr: string): PlanetPosition[] {
  const date = new Date(dateStr + "T12:00:00Z");
  const dayOfYear = getDayOfYear(date);
  const year = date.getFullYear();
  const rand = seededRandom(dayOfYear * 1000 + year);

  const planets = [
    { name: "Sun", period: 365.25, baseOffset: 280 },
    { name: "Moon", period: 27.32, baseOffset: 0 },
    { name: "Mercury", period: 87.97, baseOffset: 48 },
    { name: "Venus", period: 224.7, baseOffset: 76 },
    { name: "Mars", period: 686.97, baseOffset: 355 },
    { name: "Jupiter", period: 4332.59, baseOffset: 34 },
    { name: "Saturn", period: 10759.22, baseOffset: 49 },
    { name: "Uranus", period: 30688.5, baseOffset: 314 },
    { name: "Neptune", period: 60182, baseOffset: 304 },
    { name: "Pluto", period: 90560, baseOffset: 238 },
  ];

  const totalDays = (year - 2000) * 365.25 + dayOfYear;

  return planets.map(p => {
    const longitude = (p.baseOffset + (totalDays / p.period) * 360) % 360;
    const positiveLon = ((longitude % 360) + 360) % 360;
    const signIndex = Math.floor(positiveLon / 30);
    const degree = Math.round(positiveLon % 30);
    const sign = SIGNS[signIndex];

    const isRetrograde = p.name !== "Sun" && p.name !== "Moon" &&
      (rand() < (p.name === "Mercury" ? 0.2 : p.name === "Venus" ? 0.07 : 0.15));

    return {
      name: p.name,
      symbol: PLANET_SYMBOLS[p.name],
      sign,
      degree,
      retrograde: isRetrograde,
      element: SIGN_ELEMENTS[sign],
      color: PLANET_COLORS[p.name],
      domain: PLANET_DOMAINS[p.name],
    };
  });
}

export function calculateAspects(planets: PlanetPosition[]): AspectInfo[] {
  const aspects: AspectInfo[] = [];
  const orb = 6;

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      const d1 = SIGNS.indexOf(p1.sign) * 30 + p1.degree;
      const d2 = SIGNS.indexOf(p2.sign) * 30 + p2.degree;

      let diff = Math.abs(d1 - d2);
      if (diff > 180) diff = 360 - diff;

      if (diff <= orb) {
        aspects.push({ planet1: p1.name, planet2: p2.name, type: "conjunction", orb: diff });
      } else if (Math.abs(diff - 60) <= orb) {
        aspects.push({ planet1: p1.name, planet2: p2.name, type: "sextile", orb: Math.abs(diff - 60) });
      } else if (Math.abs(diff - 90) <= orb) {
        aspects.push({ planet1: p1.name, planet2: p2.name, type: "square", orb: Math.abs(diff - 90) });
      } else if (Math.abs(diff - 120) <= orb) {
        aspects.push({ planet1: p1.name, planet2: p2.name, type: "trine", orb: Math.abs(diff - 120) });
      } else if (Math.abs(diff - 180) <= orb) {
        aspects.push({ planet1: p1.name, planet2: p2.name, type: "opposition", orb: Math.abs(diff - 180) });
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}

export function calculateMoonPhase(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00Z");
  const knownNewMoon = new Date("2024-01-11T11:57:00Z");
  const lunarCycle = 29.53059;
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((daysSince % lunarCycle) + lunarCycle) % lunarCycle;
  const phaseIndex = Math.floor((phase / lunarCycle) * 8) % 8;
  return MOON_PHASES[phaseIndex];
}

export function calculateWavelength(planets: PlanetPosition[], aspects: AspectInfo[]): number {
  let baseFreq = 0;
  const weights: Record<string, number> = {
    Sun: 1.0, Moon: 0.9, Mercury: 0.5, Venus: 0.6, Mars: 0.7,
    Jupiter: 0.4, Saturn: 0.3, Uranus: 0.2, Neptune: 0.15, Pluto: 0.1
  };

  planets.forEach(p => {
    const signIdx = SIGNS.indexOf(p.sign);
    baseFreq += (signIdx * 30 + p.degree) * (weights[p.name] || 0.1);
  });

  aspects.forEach(a => {
    if (a.type === "conjunction") baseFreq += 15;
    if (a.type === "square") baseFreq += 25;
    if (a.type === "opposition") baseFreq += 30;
    if (a.type === "trine") baseFreq -= 10;
  });

  const normalizedFreq = ((baseFreq % 1000) / 1000);
  return Math.round(380 + normalizedFreq * (750 - 380));
}

export function wavelengthToColor(nm: number): string {
  if (nm < 380) return "#7F00FF";
  if (nm < 440) return "#4B0082";
  if (nm < 490) return "#0000FF";
  if (nm < 510) return "#00BFFF";
  if (nm < 530) return "#00FF7F";
  if (nm < 570) return "#7FFF00";
  if (nm < 590) return "#FFFF00";
  if (nm < 620) return "#FFA500";
  if (nm < 750) return "#FF4500";
  return "#8B0000";
}

export function wavelengthToColorName(nm: number): string {
  if (nm < 440) return "Violet";
  if (nm < 490) return "Blue";
  if (nm < 510) return "Cyan";
  if (nm < 530) return "Green";
  if (nm < 570) return "Yellow-Green";
  if (nm < 590) return "Yellow";
  if (nm < 620) return "Orange";
  if (nm < 750) return "Red";
  return "Deep Red";
}

export function getDominantElement(planets: PlanetPosition[]): string {
  const counts: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  planets.forEach(p => { counts[p.element]++; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function generateSignals(planets: PlanetPosition[], aspects: AspectInfo[]): SignalResult[] {
  const signals: SignalResult[] = [];

  const marsHardAspects = aspects.filter(a =>
    (a.planet1 === "Mars" || a.planet2 === "Mars") &&
    (a.type === "square" || a.type === "opposition" || a.type === "conjunction")
  );

  if (marsHardAspects.length > 0) {
    const tightest = marsHardAspects[0];
    const otherPlanet = tightest.planet1 === "Mars" ? tightest.planet2 : tightest.planet1;
    let weight = 60;
    if (tightest.orb <= 1) weight += 15;
    if (otherPlanet === "Uranus" || otherPlanet === "Pluto") weight += 10;

    signals.push({
      id: "VOLATILITY",
      weight,
      rationale: [`Mars ${tightest.type} ${otherPlanet} (orb ${tightest.orb.toFixed(1)}°)`],
      allowedPhrases: ["heightened volatility", "rapid shifts", "acceleration of tension", "catalytic energy"]
    });
  }

  const retrogrades = planets.filter(p => p.retrograde);
  if (retrogrades.length > 0) {
    signals.push({
      id: "INFORMATION_FOG",
      weight: 30 + retrogrades.length * 10,
      rationale: retrogrades.map(r => `${r.name} retrograde in ${r.sign}`),
      allowedPhrases: ["communication revisited", "review period", "delayed clarity", "reflection phase"]
    });
  }

  const saturnAspects = aspects.filter(a =>
    (a.planet1 === "Saturn" || a.planet2 === "Saturn") &&
    (a.type === "square" || a.type === "opposition")
  );

  if (saturnAspects.length > 0) {
    signals.push({
      id: "STRUCTURAL_PRESSURE",
      weight: 50 + saturnAspects.length * 10,
      rationale: saturnAspects.map(a => `Saturn ${a.type} ${a.planet1 === "Saturn" ? a.planet2 : a.planet1}`),
      allowedPhrases: ["institutional testing", "boundary enforcement", "structural assessment", "disciplinary tension"]
    });
  }

  const jupiterAspects = aspects.filter(a =>
    (a.planet1 === "Jupiter" || a.planet2 === "Jupiter") &&
    (a.type === "trine" || a.type === "conjunction" || a.type === "sextile")
  );

  if (jupiterAspects.length > 0) {
    signals.push({
      id: "EXPANSION",
      weight: 40 + jupiterAspects.length * 10,
      rationale: jupiterAspects.map(a => `Jupiter ${a.type} ${a.planet1 === "Jupiter" ? a.planet2 : a.planet1}`),
      allowedPhrases: ["broadened perspective", "growth opportunity", "expanded awareness", "generosity of vision"]
    });
  }

  const dominantElement = getDominantElement(planets);
  const elementCount = planets.filter(p => p.element === dominantElement).length;
  if (elementCount >= 4) {
    const elementThemes: Record<string, string[]> = {
      fire: ["action-oriented", "initiative", "passionate intensity"],
      earth: ["practical grounding", "material focus", "structured approach"],
      air: ["intellectual activity", "communication-heavy", "social circulation"],
      water: ["emotional depth", "intuitive sensitivity", "psychic undertow"]
    };
    signals.push({
      id: "ELEMENTAL_DOMINANCE",
      weight: 35 + (elementCount - 4) * 10,
      rationale: [`${elementCount} planets in ${dominantElement} signs`],
      allowedPhrases: elementThemes[dominantElement] || ["elemental emphasis"]
    });
  }

  return signals.sort((a, b) => b.weight - a.weight);
}

export function getTarotColorRegister(nm: number): string {
  if (nm < 440) return "Violet (Spirit / Intuition)";
  if (nm < 490) return "Blue (Water / Emotion)";
  if (nm < 530) return "Green (Earth / Growth)";
  if (nm < 570) return "Yellow-Green (Transition)";
  if (nm < 590) return "Yellow (Air / Illumination)";
  if (nm < 620) return "Orange (Fire / Creativity)";
  return "Red (Fire / Will)";
}

export function getPlanetaryColorRegister(planets: PlanetPosition[], aspects: AspectInfo[]): string {
  if (aspects.length === 0) return "Calm planetary field";
  const primary = aspects[0];
  return `${primary.planet1} under ${primary.planet2 || ""} tension`.trim();
}
