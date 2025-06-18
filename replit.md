# Airbnb Property Management System

## Overview
A comprehensive property management application for Airbnb hosts to streamline cleaning schedules and property coordination. The system integrates with iCal feeds to automatically track checkout dates and provides manual entry capabilities for additional cleanings.

## Key Features
- iCal feed integration for automated checkout date collection
- Centralized calendar view with property-specific color coding
- Manual checkout entry with property selection
- Time zone support (GMT+7 Asia/Bangkok)
- PostgreSQL database for persistent storage
- Real-time property synchronization

## Property Legend
- Soho properties: Red (#FF5A5F)
- Thao properties: Green (#3CB371) 
- D1mension properties: Blue (#4169E1)

## Recent Changes
- **2025-06-18**: Added manual checkout creation functionality
  - Implemented "+" button in calendar header and individual date cells
  - Created modal dialog with property dropdown selection
  - Added mutation handling for manual booking creation
  - Integrated with existing booking system and cache invalidation

## User Preferences
- Timezone: GMT+7 (Asia/Bangkok)
- Property naming convention: Custom names (Soho, Thao, D1mension)
- Calendar interaction: Click dates to view cleanings, hover cells to add manual entries

## Technical Architecture
- Frontend: React with TypeScript, TanStack Query, Wouter routing
- Backend: Express.js with TypeScript
- Database: PostgreSQL with Drizzle ORM
- UI: shadcn/ui components with Tailwind CSS
- Build: Vite with hot module replacement