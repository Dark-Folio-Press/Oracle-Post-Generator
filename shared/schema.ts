import { sql } from "drizzle-orm";
import { pgTable, serial, text, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const oracleEntries = pgTable("oracle_entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  moonPhase: text("moon_phase").notNull(),
  primaryAspect: text("primary_aspect").notNull(),
  retrogradeStatus: text("retrograde_status"),
  wavelengthNm: real("wavelength_nm"),
  spectralColor: text("spectral_color"),
  tarotColorRegister: text("tarot_color_register"),
  planetaryColorRegister: text("planetary_color_register"),
  atmosphericReading: text("atmospheric_reading").notNull(),
  fullReading: text("full_reading"),
  todaysTarot: text("todays_tarot"),
  tarotReasoning: text("tarot_reasoning"),
  todaysRune: text("todays_rune"),
  runeReasoning: text("rune_reasoning"),
  todaysGem: text("todays_gem"),
  gemReasoning: text("gem_reasoning"),
  closingLine: text("closing_line"),
  planetPositionsJson: text("planet_positions_json"),
  keyAspectsJson: text("key_aspects_json"),
  signalsJson: text("signals_json"),
  archiveTags: text("archive_tags"),
  dominantElement: text("dominant_element"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertOracleEntrySchema = createInsertSchema(oracleEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertOracleEntry = z.infer<typeof insertOracleEntrySchema>;
export type OracleEntry = typeof oracleEntries.$inferSelect;

export * from "./models/chat";
