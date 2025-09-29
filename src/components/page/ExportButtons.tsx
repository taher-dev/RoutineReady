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
  tableRef?: React.RefObject<any>; // tableRef is not used in the manual build approach
}


export function ExportButtons({ routineData }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<null | 'pdf' | 'excel'>(null);
  const { toast } = useToast();

  const exportToPDF = () => {
    setIsExporting('pdf');
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        format: 'a4',
      });

      const head = [['Day', 'Time', 'Course', 'Room']];
      
      const daysWithCourses = ALL_DAYS.filter(day => routineData[day] && routineData[day]!.length > 0);

      const body = daysWithCourses.flatMap(day => {
        const dayCourses = routineData[day] || [];
        // Important: Sort courses by start time to process them in order
        const sortedCourses = [...dayCourses].sort((a,b) => a.startTimeMinutes - b.startTimeMinutes);

        return sortedCourses.map(course => [
            getShortDay(day),
            course.time,
            `${course.course}\n${course.title}`,
            course.room
        ]);
      });

      (doc as any).autoTable({
        head,
        body,
        theme: 'grid',
        headStyles: {
            fillColor: [148, 211, 172],
            textColor: [32, 56, 42],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [25, 25, 28] }, // Day column
        },
        didParseCell: (data: any) => {
             data.cell.styles.valign = 'middle';
             data.cell.styles.halign = 'center';
        },
        margin: { top: 28.35, right: 10, left: 10, bottom: 28.35 },
      });

      doc.save('routine.pdf');

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

  const exportToExcel = () => {
    setIsExporting('excel');
    try {
      const wb = XLSX.utils.book_new();
      
      const ws_data: any[][] = [['Day', 'Time', 'Course Code', 'Course Title', 'Room']];
      
      ALL_DAYS.forEach(day => {
        const courses = routineData[day] || [];
        courses.sort((a,b) => a.startTimeMinutes - b.startTimeMinutes).forEach(course => {
          ws_data.push([day, course.time, course.course, course.title, course.room]);
        });
      });

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, 'Routine');
      XLSX.writeFile(wb, 'routine.xlsx');

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
