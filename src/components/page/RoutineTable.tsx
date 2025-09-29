'use client';

import { useState, useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoutineData, Course, Day, ALL_DAYS } from "@/lib/types";
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';

interface RoutineTableProps {
  initialData: RoutineData;
  onUpdate: (data: RoutineData) => void;
}

export interface RoutineTableRef {
  getElement: () => HTMLDivElement | null;
}

const timeSlots = Array.from({ length: 17 }, (_, i) => (8 * 60 + 30) + i * 30); // 8:30 AM to 4:30 PM in 30min intervals
const breakTimeStart = 13 * 60; // 1:00 PM
const breakTimeEnd = 13 * 60 + 30; // 1:30 PM

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

export const RoutineTable = forwardRef<RoutineTableRef, RoutineTableProps>(({ initialData, onUpdate }, ref) => {
  const [data, setData] = useState(initialData);
  const [editingCell, setEditingCell] = useState<{ courseId: string; field: keyof Course } | null>(null);
  const [editValue, setEditValue] = useState('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (editingCell) {
      inputRef.current?.focus();
    }
  }, [editingCell]);
  
  useImperativeHandle(ref, () => ({
    getElement: () => tableContainerRef.current,
  }));

  const handleCellClick = (course: Course, field: keyof Course) => {
    setEditingCell({ courseId: course.id, field });
    setEditValue(course[field] as string);
  };
  
  const handleUpdate = () => {
    if (!editingCell) return;
  
    const newData = JSON.parse(JSON.stringify(data));
    let updated = false;
    for (const day of ALL_DAYS) {
      if (newData[day]) {
        const courseIndex = newData[day].findIndex((c: Course) => c.id === editingCell.courseId);
        if (courseIndex !== -1) {
          newData[day][courseIndex][editingCell.field] = editValue;
          updated = true;
          break;
        }
      }
    }
  
    if(updated) {
      setData(newData);
      onUpdate(newData);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const renderableData = useMemo(() => {
    const processed: { [key in Day]?: (Course | { type: 'placeholder', duration: number })[] } = {};
    for (const day of ALL_DAYS) {
      const courses = data[day] || [];
      if (courses.length === 0) continue;

      processed[day] = [];
      let lastEndTime = 8 * 60;

      courses.forEach(course => {
        if (course.startTimeMinutes > lastEndTime) {
          processed[day]?.push({ type: 'placeholder', duration: course.startTimeMinutes - lastEndTime });
        }
        processed[day]?.push(course);
        lastEndTime = course.endTimeMinutes;
      });
    }
    return processed;
  }, [data]);

  return (
    <div ref={tableContainerRef} className="border rounded-lg overflow-x-auto relative">
      <Table className="min-w-max">
        <TableHeader className="bg-primary/20 sticky top-0 z-10 backdrop-blur-sm">
          <TableRow>
            <TableHead className="w-32 font-semibold text-primary-foreground">Day</TableHead>
            {timeSlots.map(slot => (
              <TableHead key={slot} className={cn(
                "w-24 text-center font-semibold text-primary-foreground/80",
                slot >= breakTimeStart && slot < breakTimeEnd && "bg-accent/20"
              )}>
                {formatTime(slot)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ALL_DAYS.map(day => {
            const dayCourses = data[day];
            if (!dayCourses || dayCourses.length === 0) return null;

            let occupiedSlots = 0;

            return (
              <TableRow key={day} className="odd:bg-card hover:bg-primary/10">
                <TableCell className="font-bold sticky left-0 bg-inherit">{day}</TableCell>
                {timeSlots.map((slot, slotIndex) => {
                  if (occupiedSlots > 0) {
                    occupiedSlots--;
                    return null;
                  }
                  
                  const course = dayCourses.find(c => c.startTimeMinutes === slot);
                  if (course) {
                    const durationSlots = Math.round((course.endTimeMinutes - course.startTimeMinutes) / 30);
                    occupiedSlots = durationSlots - 1;
                    return (
                      <TableCell key={slot} colSpan={durationSlots} className="p-0 align-top">
                        <div className="h-full w-full bg-primary/10 rounded-md p-2 border border-primary/20 shadow-sm flex flex-col justify-center">
                          {[ 'course', 'title', 'room' ].map(key => {
                             const field = key as keyof Course;
                             if (['id', 'startTimeMinutes', 'endTimeMinutes', 'time'].includes(field)) return null;
                            
                             const isEditing = editingCell?.courseId === course.id && editingCell?.field === field;

                             return isEditing ? (
                              <Input
                                ref={inputRef}
                                key={field}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleUpdate}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdate();
                                    if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="h-6 text-xs p-1 my-0.5"
                              />
                             ) : (
                              <p
                                key={field}
                                onClick={() => handleCellClick(course, field)}
                                className={cn(
                                  "cursor-pointer hover:bg-primary/20 rounded px-1 transition-colors",
                                  field === 'course' && 'font-bold text-primary-foreground',
                                  field === 'title' && 'text-sm text-foreground/90 truncate',
                                  field === 'room' && 'text-xs text-muted-foreground'
                                )}
                              >
                                {field === 'room' && course[field] ? `Room: ${course[field]}` : course[field]}
                              </p>
                             )
                          })}
                        </div>
                      </TableCell>
                    )
                  }
                  return (
                    <TableCell key={slot} className={cn(slot >= breakTimeStart && slot < breakTimeEnd && "bg-accent/10")}></TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

RoutineTable.displayName = 'RoutineTable';
