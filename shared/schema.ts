import { pgTable, text, serial, integer, boolean, json, timestamp, varchar, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (property owners and housekeepers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("housekeeper"), // 'owner' or 'housekeeper'
  avatar: text("avatar"),
  rating: integer("rating"), // For housekeepers (1-5)
  cleaningCount: integer("cleaning_count").default(0), // For housekeepers
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(), // CSS color for calendar
  icalUrl: text("ical_url").notNull(),
  checkoutTime: text("checkout_time").notNull(),
  lastSync: timestamp("last_sync"),
  defaultHousekeeperId: integer("default_housekeeper_id"),
  notes: text("notes"),
  active: boolean("active").default(true),
  address: text("address"),
  accessCode: text("access_code"),
});

// Bookings table (parsed from iCal feeds)
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  guestName: text("guest_name"),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  cleaningStatus: text("cleaning_status").default("pending"), // 'pending', 'assigned', 'completed'
  housekeeperId: integer("housekeeper_id"),
  notes: text("notes"),
  icalUID: text("ical_uid").notNull(), // Unique ID from iCal event
});

// Housekeeper availability schedule
export const housekeeperAvailability = pgTable("housekeeper_availability", {
  id: serial("id").primaryKey(),
  housekeeperId: integer("housekeeper_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  maxCleanings: integer("max_cleanings").default(3), // Maximum number of cleanings per day
});

// Time off requests for housekeepers
export const timeOffRequests = pgTable("time_off_requests", {
  id: serial("id").primaryKey(),
  housekeeperId: integer("housekeeper_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  approved: boolean("approved").default(false),
  reason: text("reason"),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, cleaningCount: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, lastSync: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true });
export const insertAvailabilitySchema = createInsertSchema(housekeeperAvailability).omit({ id: true });
export const insertTimeOffSchema = createInsertSchema(timeOffRequests).omit({ id: true });

// Property schema with validation
export const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  color: z.string().min(1, "Color is required"),
  icalUrl: z.string().url("Please enter a valid iCal URL"),
  checkoutTime: z.string().min(1, "Checkout time is required"),
  notes: z.string().optional(),
  defaultHousekeeperId: z.number().optional().nullable(),
  address: z.string().optional(),
  accessCode: z.string().optional(),
  active: z.boolean().default(true),
});

// User schema with validation
export const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["owner", "housekeeper"]),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

// Housekeeper availability schema with validation
export const availabilitySchema = z.object({
  housekeeperId: z.number(), 
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  maxCleanings: z.number().min(1).default(3),
});

// Time off request schema with validation
export const timeOffSchema = z.object({
  housekeeperId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  approved: z.boolean().default(false),
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type HousekeeperAvailability = typeof housekeeperAvailability.$inferSelect;
export type InsertHousekeeperAvailability = z.infer<typeof insertAvailabilitySchema>;

export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffSchema>;

// Calendar view types (for frontend)
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  propertyId: number;
  color: string;
  cleaningStatus: string;
  housekeeperId?: number;
}

export interface CleaningTask {
  id: number;
  propertyId: number;
  propertyName: string;
  propertyColor: string;
  checkoutTime: string;
  checkoutDate: Date;
  address?: string;
  accessCode?: string;
  notes?: string;
  status: string;
  housekeeperId?: number;
}
