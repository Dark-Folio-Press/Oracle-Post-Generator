# Daily Planetary Oracle — Dark Folio Press

## Overview
A web app for astrology content creators to generate daily astrological posts with AI-powered symbolic interpretation. Uses a 5-layer architecture: astronomical computation → deterministic signal engine → LLM renderer with guardrails against fatalistic/predictive language.

## Architecture
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui, served via Vite
- **Backend**: Express.js API
- **Database**: PostgreSQL via Neon serverless (@neondatabase/serverless + drizzle-orm)
- **AI**: OpenAI (gpt-5.2) via Replit AI Integrations for oracle text generation

## Key Files
- `shared/schema.ts` — Drizzle schema (users, oracleEntries, conversations, messages)
- `server/engine/planetaryData.ts` — Planet position calculator, aspect finder, moon phase, wavelength/color translation, signal engine
- `server/engine/oracleRenderer.ts` — LLM oracle generation with system prompt guardrails and determinism scrubber
- `server/routes.ts` — API routes: `/api/sky/:date`, `/api/oracle/:date`, `/api/oracle/generate`, `/api/oracle/:date/export`
- `server/storage.ts` — DatabaseStorage class implementing IStorage interface
- `client/src/pages/oracle-dashboard.tsx` — Main dashboard page
- `client/src/components/sky-chart.tsx` — Canvas-rendered zodiac wheel with planet positions and aspect lines (transparent background)
- `client/src/components/harmonic-strip.tsx` — Wavelength color gradient strip
- `client/src/components/planet-table.tsx` — Planet positions listing
- `client/src/components/oracle-reading.tsx` — Atmospheric and full reading display
- `client/src/components/correspondence-card.tsx` — Tarot/rune/gem correspondence cards
- `client/src/components/signal-display.tsx` — Active signal bars (VOLATILITY, INFO_FOG, etc.)

## Design
- Dark observatory aesthetic with warm gold/amber accents on near-black backgrounds
- Color variables use HSL format (H S% L%) in index.css
- Font: Georgia serif for readings, monospace for data
- Sky chart renders on transparent canvas with gold glyphs and muted aspect lines

## Tone Rules
- "AB hybrid" — serious publication column + trusted letter intimacy
- NEVER: "fated", "destined", "inevitable", "portal", "rupture", emoji, generic advice, greetings
- Closing line: "Symbols describe atmosphere. Living remains an art."
- Signed: "Dark Folio / Keeper of the Archive"

## Running
- Workflow "Start application" runs `npm run dev`
- `npm run db:push` to sync schema

## Dependencies
- @neondatabase/serverless, drizzle-orm, date-fns, openai, @tanstack/react-query, wouter, lucide-react
