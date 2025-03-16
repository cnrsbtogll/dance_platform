// src/api/calendar.js
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export const addClassToCalendar = async (classDetails) => {
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