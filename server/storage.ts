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

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private propertiesData: Map<number, Property>;
  private bookingsData: Map<number, Booking>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentBookingId: number;

  constructor() {
    this.usersData = new Map();
    this.propertiesData = new Map();
    this.bookingsData = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentBookingId = 1;

    // Add some initial data
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create a default owner user
    this.createUser({
      username: "owner",
      password: "password123",
      fullName: "Property Owner",
      email: "owner@example.com",
      role: "owner"
    });

    // Create some default housekeepers
    this.createUser({
      username: "maria",
      password: "password123",
      fullName: "Maria Lopez",
      email: "maria@example.com",
      role: "housekeeper",
      rating: 4.9,
      avatar: ""
    });

    this.createUser({
      username: "john",
      password: "password123",
      fullName: "John Davis",
      email: "john@example.com",
      role: "housekeeper",
      rating: 4.8,
      avatar: ""
    });

    this.createUser({
      username: "sarah",
      password: "password123",
      fullName: "Sarah Kim",
      email: "sarah@example.com",
      role: "housekeeper",
      rating: 5.0,
      avatar: ""
    });
  }

  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { 
      ...userData, 
      id,
      cleaningCount: userData.cleaningCount || 0
    };
    this.usersData.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.usersData.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      ...userData,
    };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  async validateUserData(data: unknown, isUpdate: boolean = false): Promise<InsertUser> {
    // If it's an update, we make all fields optional
    const schema = isUpdate 
      ? userSchema.partial() 
      : userSchema;
    
    return schema.parse(data) as InsertUser;
  }

  // PROPERTY METHODS
  async getProperty(id: number): Promise<Property | undefined> {
    return this.propertiesData.get(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.propertiesData.values());
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const newProperty: Property = { 
      ...propertyData, 
      id,
      lastSync: null
    };
    this.propertiesData.set(id, newProperty);
    return newProperty;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const existingProperty = this.propertiesData.get(id);
    if (!existingProperty) {
      return undefined;
    }

    const updatedProperty: Property = {
      ...existingProperty,
      ...propertyData,
    };
    this.propertiesData.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // Delete all bookings for this property
    const bookings = await this.getBookingsByPropertyId(id);
    for (const booking of bookings) {
      await this.deleteBooking(booking.id);
    }
    
    return this.propertiesData.delete(id);
  }

  async validatePropertyData(data: unknown, isUpdate: boolean = false): Promise<InsertProperty> {
    // If it's an update, we make all fields optional
    const schema = isUpdate 
      ? propertySchema.partial() 
      : propertySchema;
    
    return schema.parse(data) as InsertProperty;
  }

  // BOOKING METHODS
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookingsData.get(id);
  }

  async getBookingByIcalUID(icalUID: string): Promise<Booking | undefined> {
    return Array.from(this.bookingsData.values()).find(
      (booking) => booking.icalUID === icalUID
    );
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookingsData.values());
  }

  async getBookingsByPropertyId(propertyId: number): Promise<Booking[]> {
    return Array.from(this.bookingsData.values()).filter(
      (booking) => booking.propertyId === propertyId
    );
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return Array.from(this.bookingsData.values()).filter((booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      // Include bookings that overlap with the date range
      return (
        (checkIn >= startDate && checkIn <= endDate) || 
        (checkOut >= startDate && checkOut <= endDate) ||
        (checkIn <= startDate && checkOut >= endDate)
      );
    });
  }

  async getBookingsByCheckoutDate(startDate: Date, endDate: Date): Promise<Booking[]> {
    return Array.from(this.bookingsData.values()).filter((booking) => {
      const checkOut = new Date(booking.checkOut);
      return checkOut >= startDate && checkOut <= endDate;
    });
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const id = this.currentBookingId++;
    const newBooking: Booking = { 
      ...bookingData, 
      id 
    };
    this.bookingsData.set(id, newBooking);
    
    // If a housekeeper is assigned, increment their cleaning count
    if (bookingData.housekeeperId) {
      const housekeeper = await this.getUser(bookingData.housekeeperId);
      if (housekeeper) {
        const cleaningCount = (housekeeper.cleaningCount || 0) + 1;
        await this.updateUser(bookingData.housekeeperId, { cleaningCount });
      }
    }
    
    return newBooking;
  }

  async updateBooking(id: number, bookingData: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existingBooking = this.bookingsData.get(id);
    if (!existingBooking) {
      return undefined;
    }

    // If we're assigning a new housekeeper, increment their cleaning count
    if (bookingData.housekeeperId && bookingData.housekeeperId !== existingBooking.housekeeperId) {
      const housekeeper = await this.getUser(bookingData.housekeeperId);
      if (housekeeper) {
        const cleaningCount = (housekeeper.cleaningCount || 0) + 1;
        await this.updateUser(bookingData.housekeeperId, { cleaningCount });
      }
      
      // If there was a previous housekeeper, decrement their count
      if (existingBooking.housekeeperId) {
        const previousHousekeeper = await this.getUser(existingBooking.housekeeperId);
        if (previousHousekeeper && previousHousekeeper.cleaningCount && previousHousekeeper.cleaningCount > 0) {
          await this.updateUser(existingBooking.housekeeperId, { 
            cleaningCount: previousHousekeeper.cleaningCount - 1 
          });
        }
      }
    }

    const updatedBooking: Booking = {
      ...existingBooking,
      ...bookingData,
    };
    this.bookingsData.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    const booking = this.bookingsData.get(id);
    if (booking && booking.housekeeperId) {
      // Decrement housekeeper's cleaning count
      const housekeeper = await this.getUser(booking.housekeeperId);
      if (housekeeper && housekeeper.cleaningCount && housekeeper.cleaningCount > 0) {
        await this.updateUser(booking.housekeeperId, { 
          cleaningCount: housekeeper.cleaningCount - 1 
        });
      }
    }
    
    return this.bookingsData.delete(id);
  }
}

export const storage = new MemStorage();
