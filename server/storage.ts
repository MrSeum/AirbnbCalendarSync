import { 
  users, 
  properties, 
  bookings, 
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty,
  type Booking,
  type InsertBooking,
  propertySchema,
  userSchema
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  validateUserData(data: unknown, isUpdate?: boolean): Promise<InsertUser>;

  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  validatePropertyData(data: unknown, isUpdate?: boolean): Promise<InsertProperty>;

  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByIcalUID(icalUID: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByPropertyId(propertyId: number): Promise<Booking[]>;
  getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]>;
  getBookingsByCheckoutDate(startDate: Date, endDate: Date): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, bookingData: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      cleaningCount: 0
    }).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async validateUserData(data: unknown, isUpdate: boolean = false): Promise<InsertUser> {
    const schema = isUpdate ? userSchema.partial() : userSchema;
    return schema.parse(data) as InsertUser;
  }

  // PROPERTY METHODS
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values({
      ...propertyData,
      lastSync: null
    }).returning();
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set(propertyData)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // Delete all bookings for this property first
    await db.delete(bookings).where(eq(bookings.propertyId, id));
    
    // Then delete the property
    const result = await db.delete(properties).where(eq(properties.id, id));
    return !!result;
  }

  async validatePropertyData(data: unknown, isUpdate: boolean = false): Promise<InsertProperty> {
    const schema = isUpdate ? propertySchema.partial() : propertySchema;
    return schema.parse(data) as InsertProperty;
  }

  // BOOKING METHODS
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByIcalUID(icalUID: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.icalUID, icalUID));
    return booking;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBookingsByPropertyId(propertyId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.propertyId, propertyId));
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    // Find bookings that overlap with the given date range
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.checkOut, startDate),
          lte(bookings.checkIn, endDate)
        )
      );
  }

  async getBookingsByCheckoutDate(startDate: Date, endDate: Date): Promise<Booking[]> {
    // Find bookings where the checkout date falls within the given range
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          gte(bookings.checkOut, startDate),
          lte(bookings.checkOut, endDate)
        )
      );
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    
    // If a housekeeper is assigned, increment their cleaning count
    if (bookingData.housekeeperId) {
      const housekeeper = await this.getUser(bookingData.housekeeperId);
      if (housekeeper) {
        const currentCount = housekeeper.cleaningCount || 0;
        await db
          .update(users)
          .set({ cleaningCount: currentCount + 1 })
          .where(eq(users.id, bookingData.housekeeperId));
      }
    }
    
    return booking;
  }

  async updateBooking(id: number, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    // First, get the existing booking
    const existingBooking = await this.getBooking(id);
    if (!existingBooking) {
      return undefined;
    }

    // If we're assigning a new housekeeper, update cleaning counts
    if (bookingData.housekeeperId && bookingData.housekeeperId !== existingBooking.housekeeperId) {
      // Increment new housekeeper's count
      const housekeeper = await this.getUser(bookingData.housekeeperId);
      if (housekeeper) {
        const currentCount = housekeeper.cleaningCount || 0;
        await db
          .update(users)
          .set({ cleaningCount: currentCount + 1 })
          .where(eq(users.id, bookingData.housekeeperId));
      }
      
      // Decrement old housekeeper's count if there was one
      if (existingBooking.housekeeperId) {
        const previousHousekeeper = await this.getUser(existingBooking.housekeeperId);
        if (previousHousekeeper && previousHousekeeper.cleaningCount && previousHousekeeper.cleaningCount > 0) {
          await db
            .update(users)
            .set({ cleaningCount: previousHousekeeper.cleaningCount - 1 })
            .where(eq(users.id, existingBooking.housekeeperId));
        }
      }
    }

    // Update the booking
    const [updatedBooking] = await db
      .update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
    
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    // Get the booking first so we can update housekeeper counts
    const booking = await this.getBooking(id);
    if (booking && booking.housekeeperId) {
      // Decrement housekeeper's cleaning count
      const housekeeper = await this.getUser(booking.housekeeperId);
      if (housekeeper && housekeeper.cleaningCount && housekeeper.cleaningCount > 0) {
        await db
          .update(users)
          .set({ cleaningCount: housekeeper.cleaningCount - 1 })
          .where(eq(users.id, booking.housekeeperId));
      }
    }
    
    // Delete the booking
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return !!result;
  }
}

// Use DatabaseStorage for persistence with PostgreSQL
export const storage = new DatabaseStorage();