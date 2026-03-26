/**
 * trigger-daily-oracle.ts
 *
 * Triggers today's oracle generation by calling the existing
 * POST /api/oracle/generate endpoint in your Node app.
 *
 * Run manually:   npx tsx server/trigger-daily-oracle.ts
 * Or schedule via node-cron inside index.ts (see comment below)
 */

const BASE_URL = process.env.INTERNAL_API_URL || "http://localhost:5000";

async function triggerDailyOracle(date?: string) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║   COSMIC VIBES — Daily Oracle Trigger ║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log(`\n▶ Generating oracle for: ${targetDate}`);

  const response = await fetch(`${BASE_URL}/api/oracle/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: targetDate }),
  });

  const data = await response.json();

  if (response.status === 409) {
    console.log(`\n⚠ Oracle already exists for ${targetDate}`);
    console.log(`  ID: ${data.entry?.id}`);
    console.log(`  Tarot: ${data.entry?.todaysTarot}`);
    console.log(`  Rune: ${data.entry?.todaysRune}`);
    console.log(`  Gem: ${data.entry?.todaysGem}`);
    return data.entry;
  }

  if (!response.ok) {
    console.error(`\n✗ Error ${response.status}:`, data.error || data);
    process.exit(1);
  }

  console.log(`\n✨ Oracle generated successfully!`);
  console.log(`   ID:      ${data.id}`);
  console.log(`   Date:    ${data.date}`);
  console.log(`   Tarot:   ${data.todaysTarot}`);
  console.log(`   Rune:    ${data.todaysRune}`);
  console.log(`   Gem:     ${data.todaysGem}`);
  console.log(`   Element: ${data.dominantElement}`);
  console.log(`   Moon:    ${data.moonPhase}`);
  console.log(`   λ:       ${data.wavelengthNm}nm\n`);

  return data;
}

// ── Run directly ─────────────────────────────
const dateArg = process.argv[2]; // optional: npx tsx trigger-daily-oracle.ts 2026-03-27
triggerDailyOracle(dateArg).catch(console.error);


/*
 * ── To schedule automatically, add this to server/index.ts ──────────────────
 *
 * import cron from "node-cron";
 *
 * // Runs every day at 00:05 server time
 * cron.schedule("5 0 * * *", async () => {
 *   const today = new Date().toISOString().split("T")[0];
 *   try {
 *     await fetch("http://localhost:5000/api/oracle/generate", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({ date: today }),
 *     });
 *     console.log(`[cron] Oracle generated for ${today}`);
 *   } catch (err) {
 *     console.error("[cron] Oracle generation failed:", err);
 *   }
 * });
 *
 * Install: npm install node-cron @types/node-cron
 * ────────────────────────────────────────────────────────────────────────────
 */