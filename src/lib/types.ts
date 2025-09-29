export interface Course {
  id: string;
  course: string;
  title: string;
  room: string;
  time: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
}

export type Day = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

export const ALL_DAYS: Day[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export type RoutineData = {
  [key in Day]?: Course[];
};
