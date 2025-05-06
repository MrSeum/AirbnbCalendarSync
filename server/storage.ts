import { 
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty,
  type Booking,
  type InsertBooking,
  type HousekeeperAvailability,
  type InsertHousekeeperAvailability,
  type TimeOffRequest,
  type InsertTimeOffRequest,
  propertySchema,
  userSchema,
  availabilitySchema,
  timeOffSchema
} from "@shared/schema";
import { z } from "zod";

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
  
  // Housekeeper availability methods
  getHousekeeperAvailability(id: number): Promise<HousekeeperAvailability | undefined>;
  getAvailabilitiesByHousekeeper(housekeeperId: number): Promise<HousekeeperAvailability[]>;
  createAvailability(availability: InsertHousekeeperAvailability): Promise<HousekeeperAvailability>;
  updateAvailability(id: number, data: Partial<InsertHousekeeperAvailability>): Promise<HousekeeperAvailability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;
  validateAvailabilityData(data: unknown, isUpdate?: boolean): Promise<InsertHousekeeperAvailability>;
  
  // Time off request methods
  getTimeOffRequest(id: number): Promise<TimeOffRequest | undefined>;
  getTimeOffByHousekeeper(housekeeperId: number): Promise<TimeOffRequest[]>;
  getTimeOffInDateRange(startDate: Date, endDate: Date): Promise<TimeOffRequest[]>;
  createTimeOff(timeOff: InsertTimeOffRequest): Promise<TimeOffRequest>;
  updateTimeOff(id: number, data: Partial<InsertTimeOffRequest>): Promise<TimeOffRequest | undefined>;
  deleteTimeOff(id: number): Promise<boolean>;
  validateTimeOffData(data: unknown, isUpdate?: boolean): Promise<InsertTimeOffRequest>;
  
  // Cleaner assignment methods
  getAvailableHousekeepersForDate(date: Date): Promise<User[]>;
  assignHousekeeperToBooking(bookingId: number, housekeeperId: number): Promise<Booking | undefined>;
  autoAssignHousekeepers(date: Date): Promise<number>; // Returns number of assignments made
}

export class MemStorage implements IStorage {
  private users: User[] = [];
  private properties: Property[] = [];
  private bookings: Booking[] = [];
  private availability: HousekeeperAvailability[] = [];
  private timeOff: TimeOffRequest[] = [];
  private nextUserId = 1;
  private nextPropertyId = 1;
  private nextBookingId = 1;
  private nextAvailabilityId = 1;
  private nextTimeOffId = 1;
  
  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextUserId++,
      ...userData,
      cleaningCount: 0
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    const user = this.users[index];
    const updatedUser = { ...user, ...userData };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return initialLength !== this.users.length;
  }

  async validateUserData(data: unknown, isUpdate: boolean = false): Promise<InsertUser> {
    const schema = isUpdate ? userSchema.partial() : userSchema;
    return schema.parse(data) as InsertUser;
  }

  // PROPERTY METHODS
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.find(property => property.id === id);
  }

  async getAllProperties(): Promise<Property[]> {
    return [...this.properties];
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const property: Property = {
      id: this.nextPropertyId++,
      ...propertyData,
      lastSync: null
    };
    this.properties.push(property);
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const index = this.properties.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    const property = this.properties[index];
    const updatedProperty = { ...property, ...propertyData };
    this.properties[index] = updatedProperty;
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // Delete all bookings for this property first
    this.bookings = this.bookings.filter(booking => booking.propertyId !== id);
    
    // Then delete the property
    const initialLength = this.properties.length;
    this.properties = this.properties.filter(property => property.id !== id);
    return initialLength !== this.properties.length;
  }

  async validatePropertyData(data: unknown, isUpdate: boolean = false): Promise<InsertProperty> {
    const schema = isUpdate ? propertySchema.partial() : propertySchema;
    return schema.parse(data) as InsertProperty;
  }

  // BOOKING METHODS
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.find(booking => booking.id === id);
  }

  async getBookingByIcalUID(icalUID: string): Promise<Booking | undefined> {
    return this.bookings.find(booking => booking.icalUID === icalUID);
  }

  async getAllBookings(): Promise<Booking[]> {
    return [...this.bookings];
  }

  async getBookingsByPropertyId(propertyId: number): Promise<Booking[]> {
    return this.bookings.filter(booking => booking.propertyId === propertyId);
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    // Find bookings that overlap with the given date range
    return this.bookings.filter(booking => {
      return booking.checkOut >= startDate && booking.checkIn <= endDate;
    });
  }

  async getBookingsByCheckoutDate(startDate: Date, endDate: Date): Promise<Booking[]> {
    // Find bookings where the checkout date falls within the given range
    return this.bookings.filter(booking => {
      return booking.checkOut >= startDate && booking.checkOut <= endDate;
    });
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      id: this.nextBookingId++,
      ...bookingData
    };
    this.bookings.push(booking);
    
    // If a housekeeper is assigned, increment their cleaning count
    if (bookingData.housekeeperId) {
      const housekeeper = await this.getUser(bookingData.housekeeperId);
      if (housekeeper) {
        const currentCount = housekeeper.cleaningCount || 0;
        await this.updateUser(housekeeper.id, { 
          cleaningCount: currentCount + 1 
        });
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
        await this.updateUser(housekeeper.id, { 
          cleaningCount: currentCount + 1 
        });
      }
      
      // Decrement old housekeeper's count if there was one
      if (existingBooking.housekeeperId) {
        const previousHousekeeper = await this.getUser(existingBooking.housekeeperId);
        if (previousHousekeeper && previousHousekeeper.cleaningCount && previousHousekeeper.cleaningCount > 0) {
          await this.updateUser(previousHousekeeper.id, {
            cleaningCount: previousHousekeeper.cleaningCount - 1
          });
        }
      }
    }

    // Update the booking
    const index = this.bookings.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    const booking = this.bookings[index];
    const updatedBooking = { ...booking, ...bookingData };
    this.bookings[index] = updatedBooking;
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    // Get the booking first so we can update housekeeper counts
    const booking = await this.getBooking(id);
    if (booking && booking.housekeeperId) {
      // Decrement housekeeper's cleaning count
      const housekeeper = await this.getUser(booking.housekeeperId);
      if (housekeeper && housekeeper.cleaningCount && housekeeper.cleaningCount > 0) {
        await this.updateUser(housekeeper.id, {
          cleaningCount: housekeeper.cleaningCount - 1
        });
      }
    }
    
    // Delete the booking
    const initialLength = this.bookings.length;
    this.bookings = this.bookings.filter(b => b.id !== id);
    return initialLength !== this.bookings.length;
  }
}

// Implementation of storage using the database
import { db } from './db';
import { users, properties, bookings } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return result.length > 0;
  }

  async validateUserData(data: unknown, isUpdate: boolean = false): Promise<InsertUser> {
    const schema = isUpdate ? userSchema.partial() : userSchema;
    return schema.parse(data) as InsertUser;
  }

  // PROPERTY METHODS
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(propertyData).returning();
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set(propertyData)
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // First, delete all bookings for this property
    await db.delete(bookings).where(eq(bookings.propertyId, id));
    
    // Then delete the property
    const result = await db.delete(properties).where(eq(properties.id, id)).returning({ id: properties.id });
    return result.length > 0;
  }

  async validatePropertyData(data: unknown, isUpdate: boolean = false): Promise<InsertProperty> {
    const schema = isUpdate ? propertySchema.partial() : propertySchema;
    return schema.parse(data) as InsertProperty;
  }

  // BOOKING METHODS
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingByIcalUID(icalUID: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.icalUID, icalUID));
    return booking || undefined;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBookingsByPropertyId(propertyId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.propertyId, propertyId));
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    // Find bookings that overlap with the given date range
    return await db.select().from(bookings).where(
      and(
        gte(bookings.checkOut, startDate),
        lte(bookings.checkIn, endDate)
      )
    );
  }

  async getBookingsByCheckoutDate(startDate: Date, endDate: Date): Promise<Booking[]> {
    // Find bookings where the checkout date falls within the given range
    return await db.select().from(bookings).where(
      and(
        gte(bookings.checkOut, startDate),
        lte(bookings.checkOut, endDate)
      )
    );
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    // Create the booking
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    
    // If a housekeeper is assigned, increment their cleaning count
    if (bookingData.housekeeperId) {
      const housekeeper = await this.getUser(bookingData.housekeeperId);
      if (housekeeper) {
        const currentCount = housekeeper.cleaningCount || 0;
        await this.updateUser(housekeeper.id, { 
          cleaningCount: currentCount + 1 
        });
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
        await this.updateUser(housekeeper.id, { 
          cleaningCount: currentCount + 1 
        });
      }
      
      // Decrement old housekeeper's count if there was one
      if (existingBooking.housekeeperId) {
        const previousHousekeeper = await this.getUser(existingBooking.housekeeperId);
        if (previousHousekeeper && previousHousekeeper.cleaningCount && previousHousekeeper.cleaningCount > 0) {
          await this.updateUser(previousHousekeeper.id, {
            cleaningCount: previousHousekeeper.cleaningCount - 1
          });
        }
      }
    }

    // Update the booking
    const [updatedBooking] = await db
      .update(bookings)
      .set(bookingData)
      .where(eq(bookings.id, id))
      .returning();
      
    return updatedBooking || undefined;
  }

  async deleteBooking(id: number): Promise<boolean> {
    // Get the booking first so we can update housekeeper counts
    const booking = await this.getBooking(id);
    if (booking && booking.housekeeperId) {
      // Decrement housekeeper's cleaning count
      const housekeeper = await this.getUser(booking.housekeeperId);
      if (housekeeper && housekeeper.cleaningCount && housekeeper.cleaningCount > 0) {
        await this.updateUser(housekeeper.id, {
          cleaningCount: housekeeper.cleaningCount - 1
        });
      }
    }
    
    // Delete the booking
    const result = await db.delete(bookings).where(eq(bookings.id, id)).returning({ id: bookings.id });
    return result.length > 0;
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();