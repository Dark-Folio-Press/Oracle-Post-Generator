import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { generateFullOracle } from "./engine/oracleRenderer";
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
} from "./engine/planetaryData";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/oracle", async (req, res) => {
    try {
      const entries = await storage.getAllOracleEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching oracle entries:", error);
      res.status(500).json({ error: "Failed to fetch oracle entries" });
    }
  });

  app.get("/api/oracle/:date", async (req, res) => {
    try {
      const entry = await storage.getOracleByDate(req.params.date);
      if (!entry) {
        return res.status(404).json({ error: "Oracle entry not found for this date" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching oracle entry:", error);
      res.status(500).json({ error: "Failed to fetch oracle entry" });
    }
  });

  app.get("/api/sky/:date", async (req, res) => {
    try {
      const dateStr = req.params.date;
      const planets = calculatePlanetPositions(dateStr);
      const aspects = calculateAspects(planets);
      const moonPhase = calculateMoonPhase(dateStr);
      const wavelengthNm = calculateWavelength(planets, aspects);
      const spectralColor = wavelengthToColorName(wavelengthNm);
      const tarotColorRegister = getTarotColorRegister(wavelengthNm);
      const planetaryColorRegister = getPlanetaryColorRegister(planets, aspects);
      const dominantElement = getDominantElement(planets);
      const signals = generateSignals(planets, aspects);

      const retrogrades = planets.filter(p => p.retrograde);
      const primaryAspect = aspects.length > 0
        ? `${aspects[0].planet1} ${aspects[0].type} ${aspects[0].planet2} (${aspects[0].orb.toFixed(1)}°)`
        : "No tight aspects";

      res.json({
        date: dateStr,
        moonPhase,
        primaryAspect,
        retrogradeStatus: retrogrades.length > 0
          ? retrogrades.map(r => `${r.name} Rx in ${r.sign}`).join(", ")
          : "No retrogrades",
        wavelengthNm,
        spectralColor,
        tarotColorRegister,
        planetaryColorRegister,
        dominantElement,
        planets,
        aspects: aspects.slice(0, 8),
        signals,
      });
    } catch (error) {
      console.error("Error calculating sky data:", error);
      res.status(500).json({ error: "Failed to calculate sky data" });
    }
  });

  app.post("/api/oracle/generate", async (req, res) => {
    try {
      const generateSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD") });
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request" });
      }
      const { date } = parsed.data;

      const existing = await storage.getOracleByDate(date);
      if (existing) {
        return res.status(409).json({ error: "Oracle entry already exists for this date", entry: existing });
      }

      const oracleData = await generateFullOracle(date);
      const entry = await storage.createOracleEntry(oracleData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error generating oracle:", error);
      res.status(500).json({ error: "Failed to generate oracle entry" });
    }
  });

  app.get("/api/oracle/:date/export", async (req, res) => {
    try {
      const entry = await storage.getOracleByDate(req.params.date);
      if (!entry) {
        return res.status(404).json({ error: "Oracle entry not found" });
      }

      const format = req.query.format || "json";

      if (format === "html") {
        const planets = entry.planetPositionsJson ? JSON.parse(entry.planetPositionsJson) : [];
        const html = generateWixEmbed(entry, planets);
        res.setHeader("Content-Type", "text/html");
        res.send(html);
      } else {
        res.json({
          ...entry,
          planetPositions: entry.planetPositionsJson ? JSON.parse(entry.planetPositionsJson) : [],
          keyAspects: entry.keyAspectsJson ? JSON.parse(entry.keyAspectsJson) : [],
          signals: entry.signalsJson ? JSON.parse(entry.signalsJson) : [],
        });
      }
    } catch (error) {
      console.error("Error exporting oracle:", error);
      res.status(500).json({ error: "Failed to export oracle entry" });
    }
  });

  /**
   * Wix-friendly daily forecast endpoint.
   * Returns today's oracle entry (tarot / rune / gem + readings) for
   * Toronto, Ontario (America/Toronto timezone). If no entry exists yet
   * for today it is generated on-demand and persisted before returning.
   */
  app.get("/api/wix/horoscope/daily-forecast", async (_req, res) => {
    try {
      // Compute today's date in America/Toronto as YYYY-MM-DD
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date());
      const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
      const today = `${p.year}-${p.month}-${p.day}`;

      let entry = await storage.getOracleByDate(today);

      // If today's oracle doesn't exist yet, generate and persist it
      if (!entry) {
        const oracleData = await generateFullOracle(today);
        entry = await storage.createOracleEntry(oracleData);
      }

      return res.json({
        date: entry.date,
        todaysTarot: entry.todaysTarot,
        tarotReasoning: entry.tarotReasoning,
        todaysRune: entry.todaysRune,
        runeReasoning: entry.runeReasoning,
        todaysGem: entry.todaysGem,
        gemReasoning: entry.gemReasoning,
        atmosphericReading: entry.atmosphericReading,
        fullReading: entry.fullReading,
        closingLine: entry.closingLine,
      });
    } catch (error) {
      console.error("Error in /api/wix/horoscope/daily-forecast:", error);
      return res.status(500).json({ error: "Failed to load daily forecast" });
    }
  });

  return httpServer;
}

function generateWixEmbed(entry: any, planets: any[]): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; color: #e8e0d0; background: transparent; padding: 24px; line-height: 1.7; }
  .header { margin-bottom: 24px; }
  .date { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #8a8578; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #6e6861; line-height: 1.8; }
  .gradient-strip { height: 3px; margin: 16px 0; border-radius: 2px; }
  .wavelength-label { font-size: 10px; color: #6e6861; letter-spacing: 1px; margin-bottom: 20px; }
  .reading { font-size: 15px; line-height: 1.8; margin-bottom: 24px; }
  .reading p { margin-bottom: 16px; }
  .correspondences { margin: 24px 0; }
  .correspondence { margin-bottom: 12px; }
  .correspondence-title { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: #8a8578; }
  .correspondence-value { font-size: 14px; color: #d4cbb8; }
  .correspondence-reason { font-size: 12px; color: #7a7368; font-style: italic; }
  .closing { font-style: italic; color: #8a8578; margin-top: 32px; font-size: 14px; }
  .signature { margin-top: 16px; font-size: 12px; color: #6e6861; }
</style>
</head>
<body>
  <div class="header">
    <div class="date">${entry.date}</div>
    <div class="meta">
      ${entry.moonPhase}<br>
      ${entry.primaryAspect}<br>
      ${entry.retrogradeStatus || ""}
    </div>
  </div>
  <div class="gradient-strip" style="background: linear-gradient(to right, ${entry.spectralColor || "#e7d9a6"}, #8a8578, #4a4540);"></div>
  <div class="wavelength-label">${entry.wavelengthNm} nm</div>
  <div class="reading">${(entry.atmosphericReading || "").split("\n").map((p: string) => `<p>${p}</p>`).join("")}</div>
  ${entry.fullReading ? `<div class="reading">${entry.fullReading.split("\n").map((p: string) => `<p>${p}</p>`).join("")}</div>` : ""}
  <div class="correspondences">
    ${entry.todaysTarot ? `<div class="correspondence"><div class="correspondence-title">Today's Tarot</div><div class="correspondence-value">${entry.todaysTarot}</div><div class="correspondence-reason">${entry.tarotReasoning || ""}</div></div>` : ""}
    ${entry.todaysRune ? `<div class="correspondence"><div class="correspondence-title">Today's Rune</div><div class="correspondence-value">${entry.todaysRune}</div><div class="correspondence-reason">${entry.runeReasoning || ""}</div></div>` : ""}
    ${entry.todaysGem ? `<div class="correspondence"><div class="correspondence-title">Today's Gem</div><div class="correspondence-value">${entry.todaysGem}</div><div class="correspondence-reason">${entry.gemReasoning || ""}</div></div>` : ""}
  </div>
  <div class="closing">${entry.closingLine || "Symbols describe atmosphere. Living remains an art."}</div>
  <div class="signature">— Dark Folio<br>Keeper of the Archive</div>
</body>
</html>`;
}
