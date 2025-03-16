import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

interface ClassDetails {
  title: string;
  description?: string;
  startTime: string | Date;
  endTime: string | Date;
  location?: string;
  attendees?: string[];
}

export const addClassToCalendar = async (classDetails: ClassDetails): Promise<any> => {
  try {
    const response = await fetch('/api/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(classDetails),
    });
    
    if (!response.ok) {
      throw new Error('Failed to add class to calendar');
    }

    return await response.json();
  } catch (error) {
    console.error('Calendar API Error:', error);
    throw error;
  }
}; 