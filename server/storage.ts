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

  // HOUSEKEEPER AVAILABILITY METHODS
  async getHousekeeperAvailability(id: number): Promise<HousekeeperAvailability | undefined> {
    return this.availability.find(a => a.id === id);
  }

  async getAvailabilitiesByHousekeeper(housekeeperId: number): Promise<HousekeeperAvailability[]> {
    return this.availability.filter(a => a.housekeeperId === housekeeperId);
  }

  async createAvailability(data: InsertHousekeeperAvailability): Promise<HousekeeperAvailability> {
    const availability: HousekeeperAvailability = {
      id: this.nextAvailabilityId++,
      ...data
    };
    this.availability.push(availability);
    return availability;
  }

  async updateAvailability(id: number, data: Partial<InsertHousekeeperAvailability>): Promise<HousekeeperAvailability | undefined> {
    const index = this.availability.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    const availability = this.availability[index];
    const updatedAvailability = { ...availability, ...data };
    this.availability[index] = updatedAvailability;
    return updatedAvailability;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const initialLength = this.availability.length;
    this.availability = this.availability.filter(a => a.id !== id);
    return initialLength !== this.availability.length;
  }

  async validateAvailabilityData(data: unknown, isUpdate: boolean = false): Promise<InsertHousekeeperAvailability> {
    const schema = isUpdate ? availabilitySchema.partial() : availabilitySchema;
    return schema.parse(data) as InsertHousekeeperAvailability;
  }

  // TIME OFF REQUEST METHODS
  async getTimeOffRequest(id: number): Promise<TimeOffRequest | undefined> {
    return this.timeOff.find(t => t.id === id);
  }

  async getTimeOffByHousekeeper(housekeeperId: number): Promise<TimeOffRequest[]> {
    return this.timeOff.filter(t => t.housekeeperId === housekeeperId);
  }

  async getTimeOffInDateRange(startDate: Date, endDate: Date): Promise<TimeOffRequest[]> {
    return this.timeOff.filter(t => {
      return t.endDate >= startDate && t.startDate <= endDate;
    });
  }

  async createTimeOff(data: InsertTimeOffRequest): Promise<TimeOffRequest> {
    const timeOff: TimeOffRequest = {
      id: this.nextTimeOffId++,
      ...data
    };
    this.timeOff.push(timeOff);
    return timeOff;
  }

  async updateTimeOff(id: number, data: Partial<InsertTimeOffRequest>): Promise<TimeOffRequest | undefined> {
    const index = this.timeOff.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    const timeOff = this.timeOff[index];
    const updatedTimeOff = { ...timeOff, ...data };
    this.timeOff[index] = updatedTimeOff;
    return updatedTimeOff;
  }

  async deleteTimeOff(id: number): Promise<boolean> {
    const initialLength = this.timeOff.length;
    this.timeOff = this.timeOff.filter(t => t.id !== id);
    return initialLength !== this.timeOff.length;
  }

  async validateTimeOffData(data: unknown, isUpdate: boolean = false): Promise<InsertTimeOffRequest> {
    const schema = isUpdate ? timeOffSchema.partial() : timeOffSchema;
    return schema.parse(data) as InsertTimeOffRequest;
  }

  // CLEANER ASSIGNMENT METHODS
  async getAvailableHousekeepersForDate(date: Date): Promise<User[]> {
    // Get the day of the week (0=Sunday, 1=Monday, etc.)
    const dayOfWeek = date.getDay();
    
    // Get all housekeepers
    const allHousekeepers = await this.getAllUsers();
    const housekeepers = allHousekeepers.filter(user => user.role === 'housekeeper');
    
    // Filter out housekeepers who are on time off for this date
    const timeOffRequests = await this.getTimeOffInDateRange(date, date);
    const unavailableHousekeeperIds = timeOffRequests
      .filter(t => t.approved) // Only consider approved time off requests
      .map(t => t.housekeeperId);
    
    // Get all housekeepers who have availability scheduled for this day
    const availableHousekeepers = [];
    for (const housekeeper of housekeepers) {
      // Skip if they're on time off
      if (unavailableHousekeeperIds.includes(housekeeper.id)) {
        continue;
      }
      
      // Check if they have availability for this day of the week
      const availabilities = await this.getAvailabilitiesByHousekeeper(housekeeper.id);
      const hasAvailabilityForDay = availabilities.some(a => a.dayOfWeek === dayOfWeek);
      
      if (hasAvailabilityForDay) {
        availableHousekeepers.push(housekeeper);
      }
    }
    
    return availableHousekeepers;
  }

  async assignHousekeeperToBooking(bookingId: number, housekeeperId: number): Promise<Booking | undefined> {
    return this.updateBooking(bookingId, {
      housekeeperId,
      cleaningStatus: 'assigned'
    });
  }

  async autoAssignHousekeepers(date: Date): Promise<number> {
    // Get all bookings with checkouts on the given date with 'pending' status
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await this.getBookingsByCheckoutDate(startOfDay, endOfDay);
    const pendingBookings = bookings.filter(b => b.cleaningStatus === 'pending');
    
    if (pendingBookings.length === 0) {
      return 0; // No pending bookings to assign
    }
    
    // Get available housekeepers for this date
    const availableHousekeepers = await this.getAvailableHousekeepersForDate(date);
    
    if (availableHousekeepers.length === 0) {
      return 0; // No available housekeepers
    }
    
    // Get current cleaning assignments for each housekeeper for this date
    const assignedCounts = new Map<number, number>();
    
    // Initialize all available housekeepers with 0 assigned cleanings
    for (const housekeeper of availableHousekeepers) {
      assignedCounts.set(housekeeper.id, 0);
    }
    
    // Count existing assignments for this date
    const assignedBookings = bookings.filter(b => b.cleaningStatus === 'assigned' || b.cleaningStatus === 'completed');
    for (const booking of assignedBookings) {
      if (booking.housekeeperId && assignedCounts.has(booking.housekeeperId)) {
        const currentCount = assignedCounts.get(booking.housekeeperId) ?? 0;
        assignedCounts.set(booking.housekeeperId, currentCount + 1);
      }
    }
    
    // For each property with a default housekeeper, try to assign that housekeeper first
    let assignmentsMade = 0;
    const remainingBookings: Booking[] = [];
    
    for (const booking of pendingBookings) {
      // Get the property to check if it has a default housekeeper
      const property = await this.getProperty(booking.propertyId);
      
      // If property has a default housekeeper and they're available, assign them
      if (property && property.defaultHousekeeperId) {
        const defaultHousekeeper = availableHousekeepers.find(h => h.id === property.defaultHousekeeperId);
        
        if (defaultHousekeeper) {
          // Check their availability for this day and make sure they haven't reached max cleanings
          const availabilities = await this.getAvailabilitiesByHousekeeper(defaultHousekeeper.id);
          const availability = availabilities.find(a => a.dayOfWeek === date.getDay());
          
          if (availability) {
            const currentlyAssigned = assignedCounts.get(defaultHousekeeper.id) ?? 0;
            
            if (currentlyAssigned < availability.maxCleanings) {
              // Assign the default housekeeper
              await this.assignHousekeeperToBooking(booking.id, defaultHousekeeper.id);
              assignedCounts.set(defaultHousekeeper.id, currentlyAssigned + 1);
              assignmentsMade++;
              continue; // Skip to next booking
            }
          }
        }
      }
      
      // If we couldn't assign the default housekeeper, add to remaining bookings
      remainingBookings.push(booking);
    }
    
    // For remaining bookings, assign based on who has the fewest assignments
    for (const booking of remainingBookings) {
      // Sort housekeepers by number of assignments (least to most)
      const sortedHousekeepers = [...availableHousekeepers]
        .sort((a, b) => {
          const aCount = assignedCounts.get(a.id) ?? 0;
          const bCount = assignedCounts.get(b.id) ?? 0;
          return aCount - bCount;
        });
      
      // Try to assign to the housekeeper with the fewest assignments
      for (const housekeeper of sortedHousekeepers) {
        // Check their availability for this day and make sure they haven't reached max cleanings
        const availabilities = await this.getAvailabilitiesByHousekeeper(housekeeper.id);
        const availability = availabilities.find(a => a.dayOfWeek === date.getDay());
        
        if (availability) {
          const currentlyAssigned = assignedCounts.get(housekeeper.id) ?? 0;
          
          if (currentlyAssigned < availability.maxCleanings) {
            // Assign this housekeeper
            await this.assignHousekeeperToBooking(booking.id, housekeeper.id);
            assignedCounts.set(housekeeper.id, currentlyAssigned + 1);
            assignmentsMade++;
            break; // Go to next booking
          }
        }
      }
    }
    
    return assignmentsMade;
  }
}

// Implementation of storage using the database
import { db } from './db';
import { users, properties, bookings, housekeeperAvailability, timeOffRequests } from '@shared/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

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

  // HOUSEKEEPER AVAILABILITY METHODS
  async getHousekeeperAvailability(id: number): Promise<HousekeeperAvailability | undefined> {
    const [availability] = await db.select().from(housekeeperAvailability).where(eq(housekeeperAvailability.id, id));
    return availability || undefined;
  }

  async getAvailabilitiesByHousekeeper(housekeeperId: number): Promise<HousekeeperAvailability[]> {
    return await db.select().from(housekeeperAvailability).where(eq(housekeeperAvailability.housekeeperId, housekeeperId));
  }

  async createAvailability(data: InsertHousekeeperAvailability): Promise<HousekeeperAvailability> {
    const [availability] = await db.insert(housekeeperAvailability).values(data).returning();
    return availability;
  }

  async updateAvailability(id: number, data: Partial<InsertHousekeeperAvailability>): Promise<HousekeeperAvailability | undefined> {
    const [availability] = await db
      .update(housekeeperAvailability)
      .set(data)
      .where(eq(housekeeperAvailability.id, id))
      .returning();
    return availability || undefined;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const result = await db.delete(housekeeperAvailability).where(eq(housekeeperAvailability.id, id)).returning({ id: housekeeperAvailability.id });
    return result.length > 0;
  }

  async validateAvailabilityData(data: unknown, isUpdate: boolean = false): Promise<InsertHousekeeperAvailability> {
    const schema = isUpdate ? availabilitySchema.partial() : availabilitySchema;
    return schema.parse(data) as InsertHousekeeperAvailability;
  }

  // TIME OFF REQUEST METHODS
  async getTimeOffRequest(id: number): Promise<TimeOffRequest | undefined> {
    const [timeOff] = await db.select().from(timeOffRequests).where(eq(timeOffRequests.id, id));
    return timeOff || undefined;
  }

  async getTimeOffByHousekeeper(housekeeperId: number): Promise<TimeOffRequest[]> {
    return await db.select().from(timeOffRequests).where(eq(timeOffRequests.housekeeperId, housekeeperId));
  }

  async getTimeOffInDateRange(startDate: Date, endDate: Date): Promise<TimeOffRequest[]> {
    return await db.select().from(timeOffRequests).where(
      and(
        gte(timeOffRequests.endDate, startDate),
        lte(timeOffRequests.startDate, endDate)
      )
    );
  }

  async createTimeOff(data: InsertTimeOffRequest): Promise<TimeOffRequest> {
    const [timeOff] = await db.insert(timeOffRequests).values(data).returning();
    return timeOff;
  }

  async updateTimeOff(id: number, data: Partial<InsertTimeOffRequest>): Promise<TimeOffRequest | undefined> {
    const [timeOff] = await db
      .update(timeOffRequests)
      .set(data)
      .where(eq(timeOffRequests.id, id))
      .returning();
    return timeOff || undefined;
  }

  async deleteTimeOff(id: number): Promise<boolean> {
    const result = await db.delete(timeOffRequests).where(eq(timeOffRequests.id, id)).returning({ id: timeOffRequests.id });
    return result.length > 0;
  }

  async validateTimeOffData(data: unknown, isUpdate: boolean = false): Promise<InsertTimeOffRequest> {
    const schema = isUpdate ? timeOffSchema.partial() : timeOffSchema;
    return schema.parse(data) as InsertTimeOffRequest;
  }

  // CLEANER ASSIGNMENT METHODS
  async getAvailableHousekeepersForDate(date: Date): Promise<User[]> {
    // Get the day of the week (0=Sunday, 1=Monday, etc.)
    const dayOfWeek = date.getDay();
    
    // Get all housekeepers
    const allUsers = await this.getAllUsers();
    const housekeepers = allUsers.filter(user => user.role === 'housekeeper');
    
    // Filter out housekeepers who are on time off for this date
    const timeOffRequests = await this.getTimeOffInDateRange(date, date);
    const unavailableHousekeeperIds = timeOffRequests
      .filter(t => t.approved) // Only consider approved time off requests
      .map(t => t.housekeeperId);
    
    // Get housekeepers who have availability for this day
    if (housekeepers.length === 0) {
      return [];
    }
    
    // Find all availabilities for this day of week
    const availabilities = await db.select()
      .from(housekeeperAvailability)
      .where(eq(housekeeperAvailability.dayOfWeek, dayOfWeek));
    
    // Get unique housekeeper IDs who have availability this day
    const availableHousekeeperIds = [...new Set(availabilities.map(a => a.housekeeperId))];
    
    // Return housekeepers who have availability and are not on time off
    return housekeepers.filter(h => 
      availableHousekeeperIds.includes(h.id) && 
      !unavailableHousekeeperIds.includes(h.id)
    );
  }

  async assignHousekeeperToBooking(bookingId: number, housekeeperId: number): Promise<Booking | undefined> {
    return this.updateBooking(bookingId, {
      housekeeperId,
      cleaningStatus: 'assigned'
    });
  }

  async autoAssignHousekeepers(date: Date): Promise<number> {
    // Get all bookings with checkouts on the given date with 'pending' status
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const bookings = await this.getBookingsByCheckoutDate(startOfDay, endOfDay);
    const pendingBookings = bookings.filter(b => b.cleaningStatus === 'pending');
    
    if (pendingBookings.length === 0) {
      return 0; // No pending bookings to assign
    }
    
    // Get available housekeepers for this date
    const availableHousekeepers = await this.getAvailableHousekeepersForDate(date);
    
    if (availableHousekeepers.length === 0) {
      return 0; // No available housekeepers
    }
    
    // Get current cleaning assignments for each housekeeper for this date
    const assignedCounts = new Map<number, number>();
    
    // Initialize all available housekeepers with 0 assigned cleanings
    for (const housekeeper of availableHousekeepers) {
      assignedCounts.set(housekeeper.id, 0);
    }
    
    // Count existing assignments for this date
    const assignedBookings = bookings.filter(b => b.cleaningStatus === 'assigned' || b.cleaningStatus === 'completed');
    for (const booking of assignedBookings) {
      if (booking.housekeeperId && assignedCounts.has(booking.housekeeperId)) {
        const currentCount = assignedCounts.get(booking.housekeeperId) ?? 0;
        assignedCounts.set(booking.housekeeperId, currentCount + 1);
      }
    }
    
    // For each property with a default housekeeper, try to assign that housekeeper first
    let assignmentsMade = 0;
    const remainingBookings: Booking[] = [];
    
    for (const booking of pendingBookings) {
      // Get the property to check if it has a default housekeeper
      const property = await this.getProperty(booking.propertyId);
      
      // If property has a default housekeeper and they're available, assign them
      if (property && property.defaultHousekeeperId) {
        const defaultHousekeeper = availableHousekeepers.find(h => h.id === property.defaultHousekeeperId);
        
        if (defaultHousekeeper) {
          // Check their availability for this day and make sure they haven't reached max cleanings
          const availabilities = await this.getAvailabilitiesByHousekeeper(defaultHousekeeper.id);
          const availability = availabilities.find(a => a.dayOfWeek === date.getDay());
          
          if (availability) {
            const currentlyAssigned = assignedCounts.get(defaultHousekeeper.id) ?? 0;
            const maxCleanings = availability.maxCleanings ?? 3; // Default to 3 if not specified
            
            if (currentlyAssigned < maxCleanings) {
              // Assign the default housekeeper
              await this.assignHousekeeperToBooking(booking.id, defaultHousekeeper.id);
              assignedCounts.set(defaultHousekeeper.id, currentlyAssigned + 1);
              assignmentsMade++;
              continue; // Skip to next booking
            }
          }
        }
      }
      
      // If we couldn't assign the default housekeeper, add to remaining bookings
      remainingBookings.push(booking);
    }
    
    // For remaining bookings, assign based on who has the fewest assignments
    for (const booking of remainingBookings) {
      // Sort housekeepers by number of assignments (least to most)
      const sortedHousekeepers = [...availableHousekeepers]
        .sort((a, b) => {
          const aCount = assignedCounts.get(a.id) ?? 0;
          const bCount = assignedCounts.get(b.id) ?? 0;
          return aCount - bCount;
        });
      
      // Try to assign to the housekeeper with the fewest assignments
      for (const housekeeper of sortedHousekeepers) {
        // Check their availability for this day and make sure they haven't reached max cleanings
        const availabilities = await this.getAvailabilitiesByHousekeeper(housekeeper.id);
        const availability = availabilities.find(a => a.dayOfWeek === date.getDay());
        
        if (availability) {
          const currentlyAssigned = assignedCounts.get(housekeeper.id) ?? 0;
          const maxCleanings = availability.maxCleanings ?? 3; // Default to 3 if not specified
          
          if (currentlyAssigned < maxCleanings) {
            // Assign this housekeeper
            await this.assignHousekeeperToBooking(booking.id, housekeeper.id);
            assignedCounts.set(housekeeper.id, currentlyAssigned + 1);
            assignmentsMade++;
            break; // Go to next booking
          }
        }
      }
    }
    
    return assignmentsMade;
  }
}

// Switch to database storage
export const storage = new DatabaseStorage();