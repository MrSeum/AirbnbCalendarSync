import axios from 'axios';
import ical from 'node-ical';

interface ICalEvent {
  uid: string;
  summary: string;
  start: Date;
  end: Date;
}

/**
 * Fetches and parses an iCal feed from an Airbnb listing
 * @param url URL to the iCal feed
 * @returns Array of parsed events with uid, summary, start and end dates
 */
export async function parseIcalFeed(url: string): Promise<ICalEvent[]> {
  try {
    // Fetch the iCal data
    const response = await axios.get(url);
    const icalData = response.data;
    
    // Parse the iCal data
    const events = ical.parseICS(icalData);
    
    // Filter and transform events
    const parsedEvents: ICalEvent[] = [];
    
    for (const [uid, event] of Object.entries(events)) {
      // Only process VEVENT type events (skip VTIMEZONE etc.)
      if (event.type !== 'VEVENT') continue;
      
      // Ensure event has start and end dates
      if (!event.start || !event.end) continue;
      
      parsedEvents.push({
        uid: event.uid || uid,
        summary: event.summary || 'Airbnb Reservation',
        start: event.start,
        end: event.end
      });
    }
    
    return parsedEvents;
  } catch (error: unknown) {
    console.error('Error parsing iCal feed:', error);
    throw new Error(`Failed to parse iCal feed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Determines if an event corresponds to a checkout date
 * @param event The iCal event to check
 * @returns True if the event represents a checkout date
 */
export function isCheckoutDate(event: ICalEvent): boolean {
  // In Airbnb iCal feeds, the end date of an event is the checkout date
  return true;
}

/**
 * Extracts guest information from event summary/description
 * @param event The iCal event to parse
 * @returns The guest name if available
 */
export function extractGuestInfo(event: ICalEvent): string {
  // Airbnb usually includes guest name in the summary
  // Format is often like "Reservation (Guest Name)"
  const match = event.summary.match(/Reservation \(([^)]+)\)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // If no guest name found in the summary
  return "Guest";
}
