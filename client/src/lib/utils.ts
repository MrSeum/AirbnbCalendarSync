import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, formatDistance, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = "MMM d, yyyy"): string {
  if (!date) return "";
  
  if (typeof date === "string") {
    try {
      return format(parseISO(date), formatString);
    } catch (e) {
      console.error("Error formatting date string:", e);
      return "";
    }
  }
  
  try {
    return format(date, formatString);
  } catch (e) {
    console.error("Error formatting date object:", e);
    return "";
  }
}

export function getTimeAgo(date: string | Date): string {
  if (!date) return "";
  
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    return formatDistance(parsedDate, new Date(), { addSuffix: true });
  } catch (e) {
    console.error("Error calculating time ago:", e);
    return "";
  }
}

export function generateCalendarDays(year: number, month: number): Array<{day: number, currentMonth: boolean}> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Get the day of the week for the first day (0 = Sunday)
  const firstDayIndex = firstDay.getDay();
  
  // Get the day of the week for the last day (0 = Sunday)
  const lastDayIndex = lastDay.getDay();
  
  // Get the last date of the previous month
  const prevLastDay = new Date(year, month, 0).getDate();
  
  // Days for the next month
  const nextDays = 7 - lastDayIndex - 1;
  
  // Calculate total days to display (42 for a 6x7 grid calendar)
  const totalDays = [];
  
  // Previous month's days
  for (let x = firstDayIndex; x > 0; x--) {
    totalDays.push({
      day: prevLastDay - x + 1,
      currentMonth: false
    });
  }
  
  // Current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    totalDays.push({
      day: i,
      currentMonth: true
    });
  }
  
  // Next month's days
  for (let j = 1; j <= nextDays; j++) {
    totalDays.push({
      day: j,
      currentMonth: false
    });
  }
  
  return totalDays;
}

export function getMonthName(month: number): string {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[month];
}

export function getShortMonthName(month: number): string {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return monthNames[month];
}

export function generateInitials(name: string): string {
  if (!name) return "";
  
  const nameParts = name.split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
}

// Convert a 12-hour time format to 24-hour
export function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  
  return `${hours}:${minutes}`;
}

// Convert a 24-hour time format to 12-hour
export function convertTo12Hour(time24h: string): string {
  const [hours, minutes] = time24h.split(':');
  const hour = parseInt(hours, 10);
  
  if (hour === 0) {
    return `12:${minutes} AM`;
  } else if (hour < 12) {
    return `${hour}:${minutes} AM`;
  } else if (hour === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hour - 12}:${minutes} PM`;
  }
}

// Function to get checkout days for a property
export function getCheckoutDays(bookings: any[], propertyId: number): Date[] {
  return bookings
    .filter(booking => booking.propertyId === propertyId)
    .map(booking => new Date(booking.checkOut));
}
