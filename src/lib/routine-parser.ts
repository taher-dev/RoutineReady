import { RoutineData, Course, Day, ALL_DAYS } from './types';

const timeToMinutes = (timeStr: string): number => {
  const time = timeStr.toUpperCase();
  const [hourMinute, period] = time.split(' ');
  let [hours, minutes] = hourMinute.split(':').map(Number);
  
  if ((period === 'PM' || time.includes('PM')) && hours !== 12) {
    hours += 12;
  }
  if ((period === 'AM' || time.includes('AM')) && hours === 12) {
    hours = 0; // Midnight case
  }
  return hours * 60 + (minutes || 0);
};

export const parseRoutineText = (text: string): RoutineData => {
  const routine: RoutineData = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  let currentDay: Day | null = null;
  const dayRegex = new RegExp(`^(${ALL_DAYS.join('|').replace(/\s/g, '\\s*')})`, 'i');
  
  const courseLineRegex = new RegExp(
    '(\\d{1,2}:\\d{2}\\s*(?:AM|PM)?)' + // Start time (Group 1)
    '\\s*-\\s*' +
    '(\\d{1,2}:\\d{2}\\s*(?:AM|PM)?)' + // End time (Group 2)
    '\\s+' +
    '([A-Z]{3,}\\s*\\d{3,}[^\\s]*)' +     // Course code (Group 3) e.g., CSE 205, MATH107
    '\\s+' +
    '([^A-Z-[\\d]+)?' +                      // Course title (Group 4)
    '([A-Z]-\\d{3,})?'                     // Room (Group 5)
  , 'i');

  for (const line of lines) {
    const dayMatch = line.match(dayRegex);
    if (dayMatch) {
        const matchedDay = dayMatch[0].toLowerCase();
        // Normalize day names
        if (matchedDay.startsWith('sat')) currentDay = 'Saturday';
        else if (matchedDay.startsWith('sun')) currentDay = 'Sunday';
        else if (matchedDay.startsWith('mon')) currentDay = 'Monday';
        else if (matchedDay.startsWith('tue')) currentDay = 'Tuesday';
        else if (matchedDay.startsWith('wed')) currentDay = 'Wednesday';
        else if (matchedDay.startsWith('thu')) currentDay = 'Thursday';
        
        if (currentDay && !routine[currentDay]) {
            routine[currentDay] = [];
        }
        continue;
    }

    if (currentDay) {
        const courseMatch = line.match(courseLineRegex);
        if(courseMatch) {
            const [_, startTimeStr, endTimeStr, courseCode, title, room] = courseMatch;

            const course: Course = {
                id: `${currentDay}-${courseCode}-${Math.random()}`,
                time: `${startTimeStr} - ${endTimeStr}`,
                course: courseCode.trim().toUpperCase(),
                title: title ? title.replace(/([A-Z]-\d{3,})/, '').trim() : 'N/A',
                room: room ? room.trim().toUpperCase() : 'N/A',
                startTimeMinutes: timeToMinutes(startTimeStr),
                endTimeMinutes: timeToMinutes(endTimeStr),
            };
            routine[currentDay]?.push(course);
        }
    }
  }

  // Sort courses by start time for each day
  for (const day in routine) {
    routine[day as Day]?.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
  }

  return routine;
};
