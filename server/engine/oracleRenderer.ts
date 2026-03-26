/**
 * oracleRenderer.ts
 * Fetches live planetary data and maps it to the exact InsertOracleEntry shape
 * defined in shared/schema.ts — ready for storage.createOracleEntry()
 */

import {
  calculatePlanetPositions,
  calculateAspects,
  calculateMoonPhase,
  calculateWavelength,
  wavelengthToColorName,
  getTarotColorRegister,
  getPlanetaryColorRegister,
  getDominantElement,
  generateSignals,
} from "./planetaryData";

import type { InsertOracleEntry } from "@shared/schema";

// ─────────────────────────────────────────────
// Tarot card selection based on dominant aspect + element
// ─────────────────────────────────────────────

const TAROT_BY_ASPECT: Record<string, { card: string; reasoning: string }> = {
  conjunction: {
    card: "The World",
    reasoning:
      "Conjunction signals unity and completion — the merging of two forces into one.",
  },
  opposition: {
    card: "The Moon",
    reasoning:
      "Opposition reveals tension between polarities, mirroring The Moon's duality.",
  },
  trine: {
    card: "The Star",
    reasoning:
      "Trine aspects flow harmoniously, reflecting The Star's ease and inspiration.",
  },
  square: {
    card: "The Tower",
    reasoning:
      "Squares create friction and challenge, echoing The Tower's disruption.",
  },
  sextile: {
    card: "The Lovers",
    reasoning:
      "Sextiles open opportunities through connection, resonating with The Lovers.",
  },
};

const TAROT_BY_ELEMENT: Record<string, { card: string; reasoning: string }> = {
  fire: {
    card: "The Emperor",
    reasoning:
      "Fire's drive and authority align with The Emperor's structured will.",
  },
  water: {
    card: "The High Priestess",
    reasoning:
      "Water's intuition and depth mirror The High Priestess's inner knowing.",
  },
  air: {
    card: "The Magician",
    reasoning:
      "Air's intellect and communication resonate with The Magician's mental mastery.",
  },
  earth: {
    card: "The Empress",
    reasoning:
      "Earth's fertility and grounding echo The Empress's nurturing abundance.",
  },
};

// ─────────────────────────────────────────────
// Rune selection based on dominant element + moon phase
// ─────────────────────────────────────────────

const RUNE_BY_ELEMENT: Record<string, { rune: string; reasoning: string }> = {
  fire: {
    rune: "Sowilo",
    reasoning: "Sowilo, the sun rune, channels fire's radiant, driving force.",
  },
  water: {
    rune: "Laguz",
    reasoning: "Laguz embodies water's flow, intuition, and emotional depth.",
  },
  air: {
    rune: "Ansuz",
    reasoning: "Ansuz governs communication and divine breath — air's domain.",
  },
  earth: {
    rune: "Fehu",
    reasoning:
      "Fehu represents abundance and material grounding — earth's gift.",
  },
};

// ─────────────────────────────────────────────
// Gem selection based on wavelength range
// ─────────────────────────────────────────────

function getGemByWavelength(nm: number): { gem: string; reasoning: string } {
  if (nm < 450)
    return {
      gem: "Amethyst",
      reasoning:
        "Amethyst resonates with violet frequencies — spiritual clarity and protection.",
    };
  if (nm < 495)
    return {
      gem: "Sapphire",
      reasoning:
        "Sapphire channels indigo and blue light — truth, loyalty, and deep perception.",
    };
  if (nm < 530)
    return {
      gem: "Emerald",
      reasoning:
        "Emerald holds the green spectrum — growth, heart-opening, and renewal.",
    };
  if (nm < 590)
    return {
      gem: "Citrine",
      reasoning:
        "Citrine carries yellow light — optimism, clarity, and solar warmth.",
    };
  if (nm < 625)
    return {
      gem: "Carnelian",
      reasoning:
        "Carnelian vibrates in the orange band — creativity, courage, and vitality.",
    };
  return {
    gem: "Aquamarine",
    reasoning:
      "Aquamarine spans the transitional spectrum — flow, calm, and emotional release.",
  };
}

// ─────────────────────────────────────────────
// Atmospheric reading builder
// ─────────────────────────────────────────────

function buildAtmosphericReading(
  moonPhase: string,
  dominantElement: string,
  retrogrades: any[],
  aspects: any[],
): string {
  const lines: string[] = [];

  lines.push(moonPhase);

  if (retrogrades.length > 0) {
    const names = retrogrades.map((r: any) => r.name).join(", ");
    lines.push(
      `${names} ${retrogrades.length === 1 ? "moves" : "move"} in retrograde — review, reconsider, return.`,
    );
  } else {
    lines.push("No planets in retrograde. Forward motion is unobstructed.");
  }

  const elementDescriptions: Record<string, string> = {
    fire: "The dominant register is fire — initiation, will, and forward drive color the atmosphere.",
    water:
      "The dominant register is water — emotion, intuition, and the interior life hold sway.",
    air: "The dominant register is air — thought, exchange, and connection define the current.",
    earth:
      "The dominant register is earth — grounding, patience, and material attention are favored.",
  };
  lines.push(
    elementDescriptions[dominantElement] ||
      `The dominant element is ${dominantElement}.`,
  );

  if (aspects.length > 0) {
    const top = aspects[0];
    lines.push(
      `Primary configuration: ${top.planet1} ${top.type} ${top.planet2} — ${describeAspect(top.type)}.`,
    );
  }

  return lines.join("\n");
}

function describeAspect(type: string): string {
  const descriptions: Record<string, string> = {
    conjunction: "forces merge, intensifying the energies involved",
    opposition: "tension between polarities demands integration",
    trine: "harmonious flow enables natural expression",
    square: "friction creates pressure toward growth",
    sextile: "opportunity arises through cooperative effort",
  };
  return (
    descriptions[type.toLowerCase()] || "a notable celestial configuration"
  );
}

// ─────────────────────────────────────────────
// Full reading builder
// ─────────────────────────────────────────────

function buildFullReading(
  planets: any[],
  aspects: any[],
  dominantElement: string,
  wavelengthNm: number,
  spectralColor: string,
): string {
  const sections: string[] = [];

  // Planetary positions narrative
  const planetLines = planets
    .slice(0, 7)
    .map(
      (p: any) =>
        `${p.name} in ${p.sign}${p.retrograde ? " (Rx)" : ""} at ${p.degree}°`,
    )
    .join(", ");
  sections.push(`Active bodies: ${planetLines}.`);

  // Aspect narrative
  if (aspects.length > 0) {
    const aspectLines = aspects
      .slice(0, 3)
      .map(
        (a: any) =>
          `${a.planet1} ${a.type} ${a.planet2} (${a.orb.toFixed(1)}°)`,
      )
      .join("; ");
    sections.push(`Key configurations: ${aspectLines}.`);
  }

  // Elemental + spectral synthesis
  sections.push(
    `The elemental register is ${dominantElement}. ` +
      `The harmonic field translates to ${wavelengthNm}nm — ${spectralColor} — in the visible spectrum.`,
  );

  return sections.join("\n\n");
}

// ─────────────────────────────────────────────
// Closing line (keeper paragraph)
// ─────────────────────────────────────────────

function buildClosingLine(
  date: string,
  dominantElement: string,
  wavelengthNm: number,
): string {
  return (
    `🜁 Archive Entry — ${date}. ` +
    `A ${dominantElement}-weighted field. ` +
    `The harmonic register settles near ${wavelengthNm}nm. ` +
    `Symbols describe atmosphere. Living remains an art.`
  );
}

// ─────────────────────────────────────────────
// Main export — generateFullOracle()
// ─────────────────────────────────────────────

export async function generateFullOracle(
  date: string,
): Promise<InsertOracleEntry> {
  // ── 1. Raw calculations ──────────────────────────────────────────────────
  const planets = calculatePlanetPositions(date);
  const aspects = calculateAspects(planets);
  const moonPhase = calculateMoonPhase(date);
  const wavelengthNm = calculateWavelength(planets, aspects);
  const spectralColor = wavelengthToColorName(wavelengthNm);
  const tarotColorReg = getTarotColorRegister(wavelengthNm);
  const planetaryColorReg = getPlanetaryColorRegister(planets, aspects);
  const dominantElement = getDominantElement(planets);
  const signals = generateSignals(planets, aspects);

  // ── 2. Derived values ────────────────────────────────────────────────────
  const retrogrades = planets.filter((p: any) => p.retrograde);

  const retrogradeStatus =
    retrogrades.length > 0
      ? retrogrades.map((r: any) => `${r.name} Rx in ${r.sign}`).join(", ")
      : "No retrogrades";

  const primaryAspect =
    aspects.length > 0
      ? `${aspects[0].planet1} ${aspects[0].type} ${aspects[0].planet2} (${aspects[0].orb.toFixed(1)}°)`
      : "No tight aspects";

  // ── 3. Correspondences ───────────────────────────────────────────────────
  const aspectType = aspects.length > 0 ? aspects[0].type.toLowerCase() : "";
  const tarotData = TAROT_BY_ASPECT[aspectType] ||
    TAROT_BY_ELEMENT[dominantElement] || {
      card: "The Hermit",
      reasoning: "A day of inward inquiry.",
    };
  const runeData = RUNE_BY_ELEMENT[dominantElement] || {
    rune: "Isa",
    reasoning: "A moment of stillness and pause.",
  };
  const gemData = getGemByWavelength(wavelengthNm);

  // ── 4. Prose fields ──────────────────────────────────────────────────────
  const atmosphericReading = buildAtmosphericReading(
    moonPhase,
    dominantElement,
    retrogrades,
    aspects,
  );
  const fullReading = buildFullReading(
    planets,
    aspects,
    dominantElement,
    wavelengthNm,
    spectralColor,
  );
  const closingLine = buildClosingLine(date, dominantElement, wavelengthNm);

  // ── 5. Archive tags ──────────────────────────────────────────────────────
  const tags: string[] = [];
  if (dominantElement)
    tags.push(
      `${dominantElement.charAt(0).toUpperCase() + dominantElement.slice(1)}-Dominant Days`,
    );
  if (retrogrades.length > 0) tags.push("Retrograde Active");
  if (retrogrades.length === 0) tags.push("Direct Motion");
  if (aspectType === "conjunction") tags.push("Conjunction Day");
  if (aspectType === "opposition") tags.push("Opposition Day");

  // ── 6. Assemble InsertOracleEntry ────────────────────────────────────────
  const entry: InsertOracleEntry = {
    date,
    moonPhase,
    primaryAspect,
    retrogradeStatus,
    wavelengthNm,
    spectralColor,
    tarotColorRegister: tarotColorReg,
    planetaryColorRegister: planetaryColorReg,
    atmosphericReading,
    fullReading,
    todaysTarot: tarotData.card,
    tarotReasoning: tarotData.reasoning,
    todaysRune: runeData.rune,
    runeReasoning: runeData.reasoning,
    todaysGem: gemData.gem,
    gemReasoning: gemData.reasoning,
    closingLine,
    planetPositionsJson: JSON.stringify(planets),
    keyAspectsJson: JSON.stringify(aspects.slice(0, 8)),
    signalsJson: JSON.stringify(signals),
    archiveTags: tags.join(", "),
    dominantElement,
  };

  return entry;
}

