
'use client';

import { RoutineData, ALL_DAYS, Day } from "@/lib/types";
import { Button } from "../ui/button";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { UserOptions } from 'jspdf-autotable';

// These should be imported from RoutineTable or a shared lib, but for simplicity, we define them here.
const timeSlots = [
    { start: 8 * 60 + 30, end: 10 * 60 }, // 8:30 - 10:00
    { start: 10 * 60, end: 11 * 60 + 30 }, // 10:00 - 11:30
    { start: 11 * 60 + 30, end: 13 * 60 },   // 11:30 - 1:00
    { start: 13 * 60, end: 13 * 60 + 30, isBreak: true }, // 1:00 - 1:30 (Break)
    { start: 13 * 60 + 30, end: 15 * 60 }, // 1:30 - 3:00
    { start: 15 * 60, end: 16 * 60 + 30 }, // 3:00 - 4:30
];

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const getShortDay = (day: Day): string => {
  return day.substring(0, 3).toUpperCase();
}


interface ExportButtonsProps {
  routineData: RoutineData;
  viewMode: 'table' | 'list';
}


export function ExportButtons({ routineData, viewMode }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<null | 'pdf' | 'excel'>(null);
  const { toast } = useToast();

  const exportListViewToPDF = () => {
      const doc = new jsPDF({
        orientation: 'portrait',
        format: 'a4',
      });

      const head = [['Day', 'Time', 'Course', 'Room']];
      
      const daysWithCourses = ALL_DAYS.filter(day => routineData[day] && routineData[day]!.length > 0);
      const lightGrayColor = [245, 245, 245];

      const body = daysWithCourses.flatMap((day, dayIndex) => {
        const dayCourses = routineData[day] || [];
        const sortedCourses = [...dayCourses].sort((a,b) => a.startTimeMinutes - b.startTimeMinutes);

        const isOddDay = dayIndex % 2 === 1;

        return sortedCourses.map(course => {
            const rowStyle = isOddDay ? { fillColor: lightGrayColor } : {};
            return [
                { content: getShortDay(day), styles: { ...rowStyle, fontStyle: 'bold' } },
                { content: course.time, styles: rowStyle },
                { content: `${course.course}\n${course.title}`, styles: rowStyle },
                { content: course.room, styles: rowStyle }
            ];
        });
      });

      (doc as any).autoTable({
        head,
        body,
        theme: 'grid',
        styles: {
            fontSize: 12,
            valign: 'middle',
            halign: 'center',
        },
        headStyles: {
            fillColor: [148, 211, 172],
            textColor: [32, 56, 42],
            fontStyle: 'bold',
            fontSize: 14,
        },
        columnStyles: {
            // Day column style is now handled in the body generation
        },
        margin: { top: 15, right: 10, left: 10, bottom: 15 },
        didParseCell: (data: any) => {
            // This is for multi-line course titles
            if (data.column.dataKey === 2 && data.cell.raw.content) {
                data.cell.styles.cellPadding = 5;
            }
        }
      });

      doc.save('routine-list.pdf');
  };
  
  const exportTimelineViewToPDF = () => {
      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
      const head = [['Day', ...timeSlots.map(slot => slot.isBreak ? 'Break' : `${formatTime(slot.start)} - ${formatTime(slot.end)}`)]];
      const body = ALL_DAYS.filter(day => routineData[day] && routineData[day]!.length > 0)
          .map(day => {
              const row: any[] = [{ content: day, styles: { fontStyle: 'bold' } }];
              const dayCourses = routineData[day] || [];
              let occupiedUntil = 0;

              timeSlots.forEach((slot, slotIndex) => {
                  if (occupiedUntil > slot.start) {
                      return; // This slot is occupied by a previous course with colspan
                  }

                  const course = dayCourses.find(c => c.startTimeMinutes >= slot.start && c.startTimeMinutes < slot.end);
                  
                  if (course) {
                      const courseDuration = course.endTimeMinutes - course.startTimeMinutes;
                      let colSpan = 0;
                      let accumulatedDuration = 0;
                      
                      // Calculate how many subsequent time slots this course spans
                      for (let i = slotIndex; i < timeSlots.length; i++) {
                          const currentSlot = timeSlots[i];
                          if(accumulatedDuration < courseDuration){
                              accumulatedDuration += (currentSlot.end - currentSlot.start);
                              colSpan++;
                          } else {
                              break;
                          }
                      }
                      
                      occupiedUntil = course.endTimeMinutes;

                      row.push({
                          content: `${course.course}\n${course.title}\nRoom: ${course.room}`,
                          colSpan: colSpan > 0 ? colSpan : 1,
                          styles: { valign: 'middle', halign: 'center' }
                      });

                  } else {
                      row.push(slot.isBreak ? { content: 'Break', styles: { valign: 'middle', halign: 'center' } } : '');
                      occupiedUntil = slot.end;
                  }
              });
              return row;
          });

      (doc as any).autoTable({
          head,
          body,
          theme: 'grid',
          styles: { fontSize: 8, valign: 'middle', halign: 'center' },
          headStyles: { fillColor: [148, 211, 172], textColor: [32, 56, 42], fontStyle: 'bold' },
      });
      doc.save('routine-timeline.pdf');
  };


  const exportToPDF = () => {
    setIsExporting('pdf');
    try {
      if (viewMode === 'list') {
        exportListViewToPDF();
      } else {
        exportTimelineViewToPDF();
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        variant: 'destructive',
        title: "Export Failed",
        description: "Could not export to PDF. Please try again."
      });
    }
    setIsExporting(null);
  };
  
  const exportListViewToExcel = () => {
      const ws_data: any[][] = [['Day', 'Time', 'Course Code', 'Course Title', 'Room']];
      ALL_DAYS.forEach(day => {
        const courses = routineData[day] || [];
        courses.sort((a,b) => a.startTimeMinutes - b.startTimeMinutes).forEach(course => {
          ws_data.push([day, course.time, course.course, course.title, course.room]);
        });
      });
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      return ws;
  };

  const exportTimelineViewToExcel = () => {
      const header = ['Day', ...timeSlots.map(slot => slot.isBreak ? 'Break' : `${formatTime(slot.start)} - ${formatTime(slot.end)}`)];
      const ws_data: any[][] = [header];
      const merges: XLSX.Range[] = [];

      ALL_DAYS.filter(day => routineData[day] && routineData[day]!.length > 0)
        .forEach((day, rowIndex) => {
            const row: any[] = [day];
            const dayCourses = routineData[day] || [];
            let colIndex = 1;
            let occupiedUntil = 0;


            timeSlots.forEach((slot, slotIndex) => {
                if (occupiedUntil > slot.start) {
                  row.push(''); // placeholder for merged cell
                  colIndex++;
                  return; 
                }

                const course = dayCourses.find(c => c.startTimeMinutes >= slot.start && c.startTimeMinutes < slot.end);
                
                if (course) {
                    const courseDuration = course.endTimeMinutes - course.startTimeMinutes;
                    let colSpan = 0;
                    let accumulatedDuration = 0;

                    for (let i = slotIndex; i < timeSlots.length; i++) {
                      const currentSlot = timeSlots[i];
                      if(accumulatedDuration < courseDuration){
                          accumulatedDuration += (currentSlot.end - currentSlot.start);
                          colSpan++;
                      } else {
                          break;
                      }
                    }

                    occupiedUntil = course.endTimeMinutes;
                    
                    row.push(`${course.course}\n${course.title}\nRoom: ${course.room}`);
                    if (colSpan > 1) {
                        merges.push({ s: { r: rowIndex + 1, c: colIndex }, e: { r: rowIndex + 1, c: colIndex + colSpan - 1 } });
                    }
                    colIndex += colSpan;

                } else {
                    row.push('');
                    occupiedUntil = slot.end;
                    colIndex++;
                }
            });
            ws_data.push(row);
        });
      
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      ws['!merges'] = merges;
      return ws;
  };

  const exportToExcel = () => {
    setIsExporting('excel');
    try {
      const wb = XLSX.utils.book_new();
      let ws;
      let filename;
      if (viewMode === 'list') {
        ws = exportListViewToExcel();
        filename = 'routine-list.xlsx';
      } else {
        ws = exportTimelineViewToExcel();
        filename = 'routine-timeline.xlsx';
      }
      XLSX.utils.book_append_sheet(wb, ws, 'Routine');
      XLSX.writeFile(wb, filename);

    } catch(error) {
      console.error("Excel Export Error:", error);
      toast({
        variant: 'destructive',
        title: "Export Failed",
        description: "Could not export to Excel. Please try again."
      });
    }
    setIsExporting(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={exportToPDF} variant="outline" size="sm" disabled={!!isExporting}>
        {isExporting === 'pdf' ? <Loader2 className="animate-spin" /> : <FileDown />}
        Export PDF
      </Button>
      <Button onClick={exportToExcel} variant="outline" size="sm" disabled={!!isExporting}>
        {isExporting === 'excel' ? <Loader2 className="animate-spin" /> : <FileText />}
        Export Excel
      </Button>
    </div>
  );
}
