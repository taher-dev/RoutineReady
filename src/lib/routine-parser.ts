import { RoutineData, Course, Day, ALL_DAYS } from './types';

const timeToMinutes = (timeStr: string): number => {
    //Handles "11:30:AM" or "11:30 AM"
    const time = timeStr.toUpperCase().replace(/(\d{1,2}:\d{2}):([AP]M)/, '$1 $2');
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
    if (!match) return 0;
  
    let [_, hoursStr, minutesStr, period] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0; // Midnight case
    }
    return hours * 60 + (minutes || 0);
};

const parseTimeRange = (timeSlot: string) => {
    const parts = timeSlot.split(/\s*-\s*/);
    const startTimeStr = parts[0];
    const endTimeStr = parts[1];
    const startTimeMinutes = timeToMinutes(startTimeStr);
    const endTimeMinutes = timeToMinutes(endTimeStr);
    return { startTimeMinutes, endTimeMinutes, time: `${startTimeStr} - ${endTimeStr}` };
}

const normalizeDay = (dayStr: string): Day | null => {
    const lowerDay = dayStr.toLowerCase().trim();
    if (lowerDay.startsWith('sat')) return 'Saturday';
    if (lowerDay.startsWith('sun')) return 'Sunday';
    if (lowerDay.startsWith('mon')) return 'Monday';
    if (lowerDay.startsWith('tue')) return 'Tuesday';
    if (lowerDay.startsWith('wed')) return 'Wednesday';
    if (lowerDay.startsWith('thu')) return 'Thursday';
    return null;
}

const parseV2 = (lines: string[]): RoutineData | null => {
    const routine: RoutineData = {};
    let lastCourseInfo: { code: string; title: string; section: string } | null = null;
    
    // Regex for a line that starts a new course entry
    const newCourseRegex = /([A-Z]{3,}\s*\d{1,3}[A-Z]?)-.*\s+.*\s+[A-Z]{3,}/i;

    for (const line of lines) {
        // Updated regex to be more flexible with whitespace and capture all parts
        const parts = line.split(/\t+/).map(p => p.trim());

        let currentCourseInfo: { code: string; title: string; section: string; day: Day | null; room: string; timeSlot: string; };

        if (newCourseRegex.test(line) && parts.length >= 5) {
            // This is a full new course line
            const [formalCode, title, section, dayStr, room, timeSlot] = parts;
            const code = formalCode.split('-')[0].trim();
            lastCourseInfo = { code, title, section };
            currentCourseInfo = { ...lastCourseInfo, day: normalizeDay(dayStr), room, timeSlot };
        } else if (parts.length >= 3 && lastCourseInfo) {
            // This is a continuation line for a course
            const [dayStr, room, timeSlot] = parts;
            currentCourseInfo = { ...lastCourseInfo, day: normalizeDay(dayStr), room, timeSlot };
        } else {
            continue; // Not a valid course line in this format
        }

        const { code, title, section, day, room, timeSlot } = currentCourseInfo;
        
        if (day && room && timeSlot && timeSlot.includes('-')) {
            if (!routine[day]) routine[day] = [];
            
            const { startTimeMinutes, endTimeMinutes, time } = parseTimeRange(timeSlot);
            
            if (startTimeMinutes > 0 && endTimeMinutes > 0) {
                 const course: Course = {
                    id: `${day}-${code}-${section}-${Math.random()}`,
                    course: `${code} - ${section}`,
                    title: title,
                    room: room,
                    time: time,
                    startTimeMinutes: startTimeMinutes,
                    endTimeMinutes: endTimeMinutes,
                };
                routine[day]?.push(course);
            }
        }
    }
    const hasData = Object.values(routine).some(dayCourses => dayCourses.length > 0);
    return hasData ? routine : null;
}


const parseV1 = (lines: string[]): RoutineData => {
  const routine: RoutineData = {};

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
        currentDay = normalizeDay(dayMatch[0]);
        if (currentDay && !routine[currentDay]) {
            routine[currentDay] = [];
        }
        continue;
    }

    if (currentDay) {
        const courseMatch = line.match(courseLineRegex);
        if(courseMatch) {
            const [_, startTimeStr, endTimeStr, courseCode, title, room] = courseMatch;
            const { startTimeMinutes, endTimeMinutes } = parseTimeRange(`${startTimeStr} - ${endTimeStr}`);

            const course: Course = {
                id: `${currentDay}-${courseCode}-${Math.random()}`,
                time: `${startTimeStr} - ${endTimeStr}`,
                course: courseCode.trim().toUpperCase(),
                title: title ? title.replace(/([A-Z]-\d{3,})/, '').trim() : 'N/A',
                room: room ? room.trim().toUpperCase() : 'N/A',
                startTimeMinutes,
                endTimeMinutes,
            };
            routine[currentDay]?.push(course);
        }
    }
  }
  return routine;
};


export const parseRoutineText = (text: string): RoutineData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length > 0 && lines[0].toLowerCase().includes('formal code')) {
    const parsedData = parseV2(lines);
    if (parsedData) {
        // Sort courses by start time for each day
      for (const day in parsedData) {
        parsedData[day as Day]?.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
      }
      return parsedData;
    }
  }

  const routine = parseV1(lines);

  // Sort courses by start time for each day
  for (const day in routine) {
    routine[day as Day]?.sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
  }

  return routine;
};
