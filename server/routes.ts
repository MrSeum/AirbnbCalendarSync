import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseIcalFeed } from "./ical-parser";
import { Property, Booking, CleaningTask, User, properties } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for zod validation errors
  const handleZodError = (err: unknown, res: any) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    throw err;
  };

  // PROPERTIES ENDPOINTS
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (err) {
      console.error("Error fetching properties:", err);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  
  // Endpoint to sync all property calendars
  app.post("/api/properties/sync-all", async (req, res) => {
    try {
      const propertiesList = await storage.getAllProperties();
      const results = [];
      
      // Sync each property sequentially
      for (const property of propertiesList) {
        try {
          await syncPropertyCalendar(property.id);
          
          // Update lastSync timestamp with direct database access
          // The properties variable here is the table schema, not the API response
          await db
            .update(properties)
            .set({ lastSync: new Date() })
            .where(eq(properties.id, property.id));
            
          results.push({ id: property.id, name: property.name, success: true });
        } catch (error) {
          console.error(`Error syncing property ${property.id}:`, error);
          results.push({ 
            id: property.id, 
            name: property.name, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
      
      res.json({ 
        success: true, 
        message: `Synced ${results.filter(r => r.success).length} of ${propertiesList.length} properties`, 
        results 
      });
    } catch (err) {
      console.error("Error syncing all properties:", err);
      res.status(500).json({ 
        message: `Failed to sync properties: ${err instanceof Error ? err.message : String(err)}` 
      });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      console.error("Error fetching property:", err);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      // Validate request body
      const validatedData = await storage.validatePropertyData(req.body);
      const property = await storage.createProperty(validatedData);
      
      // Immediately try to sync calendar data from iCal
      try {
        await syncPropertyCalendar(property.id);
      } catch (syncErr) {
        console.error(`Initial calendar sync failed for property ${property.id}:`, syncErr);
        // Still return success for property creation, just log the sync error
      }
      
      res.status(201).json(property);
    } catch (err) {
      console.error("Error creating property:", err);
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: `Failed to create property: ${err instanceof Error ? err.message : String(err)}` });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const validatedData = await storage.validatePropertyData(req.body, true);
      const property = await storage.updateProperty(propertyId, validatedData);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // If iCal URL changed, sync the calendar
      if (req.body.icalUrl) {
        try {
          await syncPropertyCalendar(propertyId);
        } catch (syncErr) {
          console.error(`Calendar sync failed during update for property ${propertyId}:`, syncErr);
          // Still return success for property update, just log the sync error
        }
      }
      
      res.json(property);
    } catch (err) {
      console.error("Error updating property:", err);
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: `Failed to update property: ${err instanceof Error ? err.message : String(err)}` });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const success = await storage.deleteProperty(propertyId);
      
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting property:", err);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  app.post("/api/properties/:id/sync", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const propertyToSync = await storage.getProperty(propertyId);
      
      if (!propertyToSync) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      await syncPropertyCalendar(propertyId);
      
      // Update the lastSync timestamp with direct database access
      // Use direct database update to set lastSync since it's not in the validation schema
      await db
        .update(properties)
        .set({ lastSync: new Date() })
        .where(eq(properties.id, propertyId));
      
      const bookings = await storage.getBookingsByPropertyId(propertyId);
      res.json({ success: true, bookingsCount: bookings.length });
    } catch (err) {
      console.error("Error syncing property calendar:", err);
      res.status(500).json({ message: `Failed to sync calendar: ${err instanceof Error ? err.message : String(err)}` });
    }
  });

  // USERS ENDPOINTS
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mock endpoint for current user - in a production app, this would use auth
  app.get("/api/users/current", async (req, res) => {
    try {
      // Get the first owner for demonstration purposes
      const users = await storage.getAllUsers();
      const owner = users.find(user => user.role === "owner");
      
      if (!owner) {
        // Return a default owner if none exists
        const defaultOwner = await storage.createUser({
          username: "owner",
          password: "password123",
          fullName: "Property Owner",
          email: "owner@example.com",
          role: "owner"
        });
        return res.json(defaultOwner);
      }
      
      res.json(owner);
    } catch (err) {
      console.error("Error fetching current user:", err);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = await storage.validateUserData(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (err) {
      console.error("Error creating user:", err);
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: `Failed to create user: ${err instanceof Error ? err.message : String(err)}` });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const validatedData = await storage.validateUserData(req.body, true);
      const user = await storage.updateUser(userId, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error updating user:", err);
      if (err instanceof ZodError) {
        return handleZodError(err, res);
      }
      res.status(500).json({ message: `Failed to update user: ${err instanceof Error ? err.message : String(err)}` });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // BOOKINGS ENDPOINTS
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get bookings for a specific year-month
  app.get("/api/bookings/:year-:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      // Validate year and month
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ message: "Invalid year or month" });
      }
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of the month
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      res.json(bookings);
    } catch (err) {
      console.error("Error fetching bookings by month:", err);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // CLEANINGS ENDPOINTS
  app.get("/api/cleanings", async (req, res) => {
    try {
      // Default to today's date if none specified
      const today = new Date();
      const cleanings = await getCleaningTasksForDate(today);
      res.json(cleanings);
    } catch (err) {
      console.error("Error fetching today's cleanings:", err);
      res.status(500).json({ message: "Failed to fetch cleanings" });
    }
  });

  app.get("/api/cleanings/:date", async (req, res) => {
    try {
      const dateStr = req.params.date;
      const date = new Date(dateStr);
      
      // Validate date
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const cleanings = await getCleaningTasksForDate(date);
      res.json(cleanings);
    } catch (err) {
      console.error("Error fetching cleanings:", err);
      res.status(500).json({ message: "Failed to fetch cleanings" });
    }
  });

  // Housekeeper view - assigned cleanings for specific date
  app.get("/api/cleanings/assigned/date/:date", async (req, res) => {
    try {
      const dateStr = req.params.date;
      const date = new Date(dateStr);
      
      // Validate date
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      // For demo, get any housekeeper (would normally be the authenticated user)
      const users = await storage.getAllUsers();
      const housekeeper = users.find(user => user.role === "housekeeper");
      
      if (!housekeeper) {
        return res.json([]);
      }
      
      const cleanings = await getCleaningTasksForDate(date);
      // Filter cleanings assigned to this housekeeper
      const assignedCleanings = cleanings.filter(
        task => task.housekeeperId === housekeeper.id
      );
      
      res.json(assignedCleanings);
    } catch (err) {
      console.error("Error fetching assigned cleanings:", err);
      res.status(500).json({ message: "Failed to fetch assigned cleanings" });
    }
  });

  // Housekeeper view - today's assigned cleanings
  app.get("/api/cleanings/assigned/today", async (req, res) => {
    try {
      // Get any housekeeper (would normally be the authenticated user)
      const users = await storage.getAllUsers();
      const housekeeper = users.find(user => user.role === "housekeeper");
      
      if (!housekeeper) {
        return res.json([]);
      }
      
      const today = new Date();
      const cleanings = await getCleaningTasksForDate(today);
      
      // Filter cleanings assigned to this housekeeper
      const assignedCleanings = cleanings.filter(
        task => task.housekeeperId === housekeeper.id
      );
      
      res.json(assignedCleanings);
    } catch (err) {
      console.error("Error fetching today's assigned cleanings:", err);
      res.status(500).json({ message: "Failed to fetch assigned cleanings" });
    }
  });

  // Housekeeper view - upcoming cleanings
  app.get("/api/cleanings/assigned/upcoming", async (req, res) => {
    try {
      // For demo, get any housekeeper (would normally be the authenticated user)
      const users = await storage.getAllUsers();
      const housekeeper = users.find(user => user.role === "housekeeper");
      
      if (!housekeeper) {
        return res.json([]);
      }
      
      const today = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(today.getDate() + 14);
      
      // Get all bookings with checkout dates in the next 2 weeks
      const bookings = await storage.getBookingsByDateRange(today, twoWeeksFromNow);
      
      // Filter bookings assigned to this housekeeper
      const assignedBookings = bookings.filter(
        booking => booking.housekeeperId === housekeeper.id
      );
      
      // Transform bookings into cleaning tasks
      const cleaningTasks: CleaningTask[] = [];
      
      for (const booking of assignedBookings) {
        const property = await storage.getProperty(booking.propertyId);
        if (property) {
          cleaningTasks.push({
            id: booking.id,
            propertyId: property.id,
            propertyName: property.name,
            propertyColor: property.color,
            checkoutTime: property.checkoutTime,
            checkoutDate: new Date(booking.checkOut),
            address: property.address || undefined,
            accessCode: property.accessCode || undefined,
            notes: property.notes || undefined,
            status: booking.cleaningStatus || "pending",
            housekeeperId: booking.housekeeperId || undefined
          });
        }
      }
      
      // Skip today's tasks as they're fetched separately
      const upcomingTasks = cleaningTasks.filter(
        task => task.checkoutDate.toDateString() !== today.toDateString()
      );
      
      res.json(upcomingTasks);
    } catch (err) {
      console.error("Error fetching upcoming cleanings:", err);
      res.status(500).json({ message: "Failed to fetch upcoming cleanings" });
    }
  });

  // SETTINGS ENDPOINTS
  app.patch("/api/settings", async (req, res) => {
    // This is a mock endpoint for the settings which would normally be stored in a database
    res.json({ success: true });
  });

  // Helper functions
  async function syncPropertyCalendar(propertyId: number): Promise<void> {
    const property = await storage.getProperty(propertyId);
    if (!property) {
      throw new Error("Property not found");
    }
    
    // Fetch and parse the iCal feed
    const events = await parseIcalFeed(property.icalUrl);
    
    // For each event, create or update a booking
    for (const event of events) {
      // Check if booking with this UID already exists
      const existingBooking = await storage.getBookingByIcalUID(event.uid);
      
      if (existingBooking) {
        // Update existing booking
        await storage.updateBooking(existingBooking.id, {
          propertyId: property.id,
          guestName: event.summary || "Guest",
          checkIn: event.start,
          checkOut: event.end,
          icalUID: event.uid,
          // Don't overwrite cleaning status or housekeeper assignment
        });
      } else {
        // Create new booking
        await storage.createBooking({
          propertyId: property.id,
          guestName: event.summary || "Guest",
          checkIn: event.start,
          checkOut: event.end,
          cleaningStatus: "pending",
          housekeeperId: property.defaultHousekeeperId || null,
          notes: "",
          icalUID: event.uid
        });
      }
    }
    
    // Update property lastSync timestamp directly
    await db
      .update(properties)
      .set({ lastSync: new Date() })
      .where(eq(properties.id, propertyId));
  }

  async function getCleaningTasksForDate(date: Date): Promise<CleaningTask[]> {
    // Get bookings with checkout date matching the requested date
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const bookings = await storage.getBookingsByCheckoutDate(startOfDay, endOfDay);
    
    // Transform bookings into cleaning tasks
    const cleaningTasks: CleaningTask[] = [];
    
    for (const booking of bookings) {
      const property = await storage.getProperty(booking.propertyId);
      if (property) {
        cleaningTasks.push({
          id: booking.id,
          propertyId: property.id,
          propertyName: property.name,
          propertyColor: property.color,
          checkoutTime: property.checkoutTime,
          checkoutDate: new Date(booking.checkOut),
          address: property.address || undefined,
          accessCode: property.accessCode || undefined,
          notes: property.notes || undefined,
          status: booking.cleaningStatus || "pending",
          housekeeperId: booking.housekeeperId || undefined
        });
      }
    }
    
    return cleaningTasks;
  }

  const httpServer = createServer(app);
  return httpServer;
}
