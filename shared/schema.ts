import { pgTable, text, serial, integer, boolean, json, timestamp, varchar } from "drizzle-orm/pg-core";
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

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, cleaningCount: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, lastSync: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true });

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

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

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
