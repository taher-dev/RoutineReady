
'use client';

import { RoutineData, ALL_DAYS, Day } from "@/lib/types";
import { Button } from "../ui/button";
import { FileDown, ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toPng } from 'html-to-image';
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
  getTargetElement: () => HTMLElement | null;
}


export function ExportButtons({ routineData, viewMode, getTargetElement }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<null | 'pdf' | 'image'>(null);
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
                          styles: { valign: 'middle', halign: 'center', fillColor: [237, 244, 239] }
                      });

                  } else {
                      row.push(slot.isBreak ? { content: 'Break', styles: { valign: 'middle', halign: 'center', fillColor: [245, 245, 245] } } : '');
                      occupiedUntil = slot.end;
                  }
              });
              return row;
          });

      (doc as any).autoTable({
          head,
          body,
          theme: 'grid',
          styles: { fontSize: 9, valign: 'middle', halign: 'center', minCellHeight: 25 },
          headStyles: { fillColor: [148, 211, 172], textColor: [32, 56, 42], fontStyle: 'bold' },
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
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
  
  const exportToImage = async () => {
    setIsExporting('image');
    
    let elementToCapture = getTargetElement();
    if (!elementToCapture) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Could not find the view to capture.',
      });
      setIsExporting(null);
      return;
    }

    // Create a temporary wrapper to style the image output
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.background = 'white';
    wrapper.style.padding = '20px';
    wrapper.style.fontFamily = "'PT Sans', sans-serif";
    wrapper.style.width = viewMode === 'list' ? '800px' : '1200px';

    const title = document.createElement('h1');
    title.innerText = 'Class Routine';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';
    wrapper.appendChild(title);

    // Clone the node to avoid moving the original from the DOM
    const clone = elementToCapture.cloneNode(true) as HTMLElement;
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
        const dataUrl = await toPng(wrapper, { 
            quality: 1.0, 
            pixelRatio: 2,
            backgroundColor: 'white'
        });
        const link = document.createElement('a');
        link.download = `routine-${viewMode}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error("Image Export Error:", error);
        toast({
            variant: 'destructive',
            title: "Export Failed",
            description: "Could not export to image. Please try again."
        });
    } finally {
        document.body.removeChild(wrapper);
        setIsExporting(null);
    }
};


  return (
    <div className="flex items-center gap-2">
      <Button onClick={exportToPDF} variant="outline" size="sm" disabled={!!isExporting}>
        {isExporting === 'pdf' ? <Loader2 className="animate-spin" /> : <FileDown />}
        Export PDF
      </Button>
       <Button onClick={exportToImage} variant="outline" size="sm" disabled={!!isExporting}>
        {isExporting === 'image' ? <Loader2 className="animate-spin" /> : <ImageIcon />}
        Export Image
      </Button>
    </div>
  );
}
 