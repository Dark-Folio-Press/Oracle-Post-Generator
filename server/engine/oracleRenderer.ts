import OpenAI from "openai";
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
  type PlanetPosition,
  type AspectInfo,
  type SignalResult,
} from "./planetaryData";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are a symbolic systems analyst for the Daily Planetary Oracle by Dark Folio.
Astrology is treated as interpretive language, not causal force.
Do not make deterministic, predictive, or fatalistic statements.
Do not claim historical rarity unless explicitly provided verified statistical data.
When analyzing events, avoid mythologizing violence or framing conflict as cosmically ordained.
Use probabilistic and observational framing such as "suggests", "reflects", "coincides with", "tends to".
Maintain an analytical tone with restrained poetic inflection — like a column in a serious publication written by someone the reader trusts.
Never use: "fated", "destined", "inevitable", "once in a century", "portal", "rupture", "the old world ends".
Never use emoji.
Never use "be careful today" or generic advice language.
Never start with greetings like "Welcome back" or "Today's energy is...".
Go straight into observation. Assume the reader is intelligent.`;

interface OracleGenerationResult {
  atmosphericReading: string;
  fullReading: string;
  todaysTarot: string;
  tarotReasoning: string;
  todaysRune: string;
  runeReasoning: string;
  todaysGem: string;
  gemReasoning: string;
  closingLine: string;
}

export async function generateOracleContent(
  dateStr: string,
  planets: PlanetPosition[],
  aspects: AspectInfo[],
  moonPhase: string,
  wavelengthNm: number,
  spectralColor: string,
  signals: SignalResult[],
  dominantElement: string
): Promise<OracleGenerationResult> {
  const retrogrades = planets.filter(p => p.retrograde);
  const primaryAspect = aspects.length > 0
    ? `${aspects[0].planet1} ${aspects[0].type} ${aspects[0].planet2} (${aspects[0].orb.toFixed(1)}° orb)`
    : "No tight aspects";

  const signalsSummary = signals.map(s =>
    `Signal: ${s.id} (weight ${s.weight}) — ${s.rationale.join(", ")}. Allowed phrasing: ${s.allowedPhrases.join(", ")}`
  ).join("\n");

  const planetSummary = planets.map(p =>
    `${p.name} in ${p.sign} (${p.degree}°)${p.retrograde ? " [R]" : ""}`
  ).join(", ");

  const aspectSummary = aspects.slice(0, 6).map(a =>
    `${a.planet1} ${a.type} ${a.planet2} (orb ${a.orb.toFixed(1)}°)`
  ).join(", ");

  const userPrompt = `Generate a Daily Planetary Oracle entry for ${dateStr}.

ASTRONOMICAL DATA (use only these facts):
Planets: ${planetSummary}
Key Aspects: ${aspectSummary}
Moon Phase: ${moonPhase}
Retrogrades: ${retrogrades.map(r => r.name).join(", ") || "None"}
Dominant Element: ${dominantElement}

HARMONIC DATA:
Wavelength: ${wavelengthNm} nm
Spectral Color: ${spectralColor}

INTERPRETIVE SIGNALS (from rule engine):
${signalsSummary || "No strong signals today — the sky is relatively quiet."}

Please produce a JSON response with these exact fields:
{
  "atmosphericReading": "Opening paragraph (3-5 sentences). Grounded, analytical, with light mythic inflection. Start directly with astronomical observation. This is the free teaser.",
  "fullReading": "Full atmospheric reading (3-4 paragraphs). Structural clarity. Psychological containment. Mythic seasoning, not performance. Non-deterministic language. Connect the harmonic wavelength and color to the day's themes.",
  "todaysTarot": "Name of today's tarot card (selected through planetary and color alignment)",
  "tarotReasoning": "1-2 sentences explaining the selection through planetary configuration and spectral register.",
  "todaysRune": "Name of today's rune",
  "runeReasoning": "1-2 sentences connecting the rune to the day's configuration.",
  "todaysGem": "Name of today's gemstone",
  "gemReasoning": "1-2 sentences connecting the gem to the wavelength and planetary themes.",
  "closingLine": "Symbols describe atmosphere. Living remains an art."
}

TONE: Column-publication hybrid. Serious recurring column written by a grounded, intelligent, steady presence. Not a blog, not a diary, not a mystic sermon. Direct, human phrasing with subtle psychological observation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);

  return {
    atmosphericReading: parsed.atmosphericReading || "",
    fullReading: parsed.fullReading || "",
    todaysTarot: parsed.todaysTarot || "",
    tarotReasoning: parsed.tarotReasoning || "",
    todaysRune: parsed.todaysRune || "",
    runeReasoning: parsed.runeReasoning || "",
    todaysGem: parsed.todaysGem || "",
    gemReasoning: parsed.gemReasoning || "",
    closingLine: parsed.closingLine || "Symbols describe atmosphere. Living remains an art.",
  };
}

export function scrubDeterministicLanguage(text: string): string {
  const banned = [
    /\bfated\b/gi,
    /\bdestined\b/gi,
    /\binevitable\b/gi,
    /\bwill happen\b/gi,
    /\bcannot be undone\b/gi,
    /\bonce in a century\b/gi,
    /\bportal\b/gi,
    /\brupture\b/gi,
    /\bthe old world\b/gi,
    /\bdividing line in history\b/gi,
    /\bfour horsemen\b/gi,
    /\bcosmic destiny\b/gi,
    /\bcosmically ordained\b/gi,
  ];

  let result = text;
  banned.forEach(pattern => {
    result = result.replace(pattern, "");
  });

  result = result.replace(/\s{2,}/g, " ").trim();
  return result;
}

export async function generateFullOracle(dateStr: string) {
  const planets = calculatePlanetPositions(dateStr);
  const aspects = calculateAspects(planets);
  const moonPhase = calculateMoonPhase(dateStr);
  const wavelengthNm = calculateWavelength(planets, aspects);
  const spectralColor = wavelengthToColorName(wavelengthNm);
  const tarotColorRegister = getTarotColorRegister(wavelengthNm);
  const planetaryColorRegister = getPlanetaryColorRegister(planets, aspects);
  const dominantElement = getDominantElement(planets);
  const signals = generateSignals(planets, aspects);

  const primaryAspect = aspects.length > 0
    ? `${aspects[0].planet1} ${aspects[0].type} ${aspects[0].planet2} (${aspects[0].orb.toFixed(1)}°)`
    : "No tight aspects";

  const retrogrades = planets.filter(p => p.retrograde);
  const retrogradeStatus = retrogrades.length > 0
    ? retrogrades.map(r => `${r.name} Rx in ${r.sign}`).join(", ")
    : "No retrogrades";

  const content = await generateOracleContent(
    dateStr, planets, aspects, moonPhase, wavelengthNm,
    spectralColor, signals, dominantElement
  );

  const archiveTags = [
    dominantElement + "-dominant",
    moonPhase.toLowerCase().replace(/\s/g, "-"),
    ...retrogrades.map(r => r.name.toLowerCase() + "-retrograde"),
    ...aspects.slice(0, 3).map(a => `${a.planet1.toLowerCase()}-${a.type}-${a.planet2.toLowerCase()}`),
  ].join(",");

  return {
    date: dateStr,
    moonPhase,
    primaryAspect,
    retrogradeStatus,
    wavelengthNm,
    spectralColor,
    tarotColorRegister,
    planetaryColorRegister,
    atmosphericReading: scrubDeterministicLanguage(content.atmosphericReading),
    fullReading: scrubDeterministicLanguage(content.fullReading),
    todaysTarot: content.todaysTarot,
    tarotReasoning: content.tarotReasoning,
    todaysRune: content.todaysRune,
    runeReasoning: content.runeReasoning,
    todaysGem: content.todaysGem,
    gemReasoning: content.gemReasoning,
    closingLine: content.closingLine,
    planetPositionsJson: JSON.stringify(planets),
    keyAspectsJson: JSON.stringify(aspects.slice(0, 8)),
    signalsJson: JSON.stringify(signals),
    archiveTags,
    dominantElement,
  };
}
