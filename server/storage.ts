import { type User, type InsertUser, type OracleEntry, type InsertOracleEntry, oracleEntries } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOracleEntry(id: number): Promise<OracleEntry | undefined>;
  getOracleByDate(date: string): Promise<OracleEntry | undefined>;
  getAllOracleEntries(): Promise<OracleEntry[]>;
  createOracleEntry(entry: InsertOracleEntry): Promise<OracleEntry>;
  updateOracleEntry(id: number, entry: Partial<InsertOracleEntry>): Promise<OracleEntry | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOracleEntry(id: number): Promise<OracleEntry | undefined> {
    const [entry] = await db.select().from(oracleEntries).where(eq(oracleEntries.id, id));
    return entry;
  }

  async getOracleByDate(date: string): Promise<OracleEntry | undefined> {
    const [entry] = await db.select().from(oracleEntries).where(eq(oracleEntries.date, date));
    return entry;
  }

  async getAllOracleEntries(): Promise<OracleEntry[]> {
    return db.select().from(oracleEntries).orderBy(desc(oracleEntries.date));
  }

  async createOracleEntry(entry: InsertOracleEntry): Promise<OracleEntry> {
    const [created] = await db.insert(oracleEntries).values(entry).returning();
    return created;
  }

  async updateOracleEntry(id: number, entry: Partial<InsertOracleEntry>): Promise<OracleEntry | undefined> {
    const [updated] = await db.update(oracleEntries).set(entry).where(eq(oracleEntries.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
