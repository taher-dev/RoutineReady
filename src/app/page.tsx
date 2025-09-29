'use client';

import { useState, useRef, useMemo } from 'react';
import { Header } from '@/components/page/Header';
import { RoutineInput } from '@/components/page/RoutineInput';
import { RoutineTable, type RoutineTableRef } from '@/components/page/RoutineTable';
import { RoutineList } from '@/components/page/RoutineList';
import { ExportButtons } from '@/components/page/ExportButtons';
import { RoutineData } from '@/lib/types';
import { enhanceOcrAccuracy } from '@/lib/actions';
import { parseRoutineText } from '@/lib/routine-parser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Welcome } from '@/components/page/Welcome';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { List, Table } from 'lucide-react';

export default function Home() {
  const [routineData, setRoutineData] = useState<RoutineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const tableRef = useRef<RoutineTableRef>(null);
  const { toast } = useToast();

  const handleTextSubmit = async (text: string) => {
    if (!text.trim()) {
      setError('Pasted text is empty.');
      toast({
        variant: 'destructive',
        title: 'Input Error',
        description: 'Pasted text is empty.',
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    setRoutineData(null);
    try {
      const parsedData = parseRoutineText(text);
      if (Object.keys(parsedData).length === 0) {
        const description = "Couldn't find any routine information in the text. Please check the format.";
        setError(description);
        toast({ variant: 'destructive', title: 'Parsing Failed', description });
        setRoutineData(null);
      } else {
        setRoutineData(parsedData);
      }
    } catch (e) {
      const description = 'Failed to parse routine. Please check the text format.';
      setError(description);
      toast({ variant: 'destructive', title: 'Error', description });
      console.error(e);
    }
    setIsLoading(false);
  };
  
  const mockOcrExtraction = async (file: File): Promise<string> => {
    console.log(`Simulating OCR for ${file.name}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `
      SATURDAY
      10:00 AM - 11:30 AM CSE 205 Data Structure A-404
      11:30 AM- 01:00 PM CSE 206 Data Structure Lab A-503
      
      SUNDAY
      10:00AM - 11:30 AM MATH 107 Complex Variable A-405
      
      M0NDAY
      08:30 AM - 10:00 AM CSE 315 Artificial Inteligence J-105
      01:30 PM - 03:00 PM CSE 317 System Analysis A-401

      TUESDAY
      10:00 AM - 11:30 AM EEE 101 Electrical Circuits A-411
      01:30 PM - 04:30 PM CSE 316 AI Lab A-503
      
      WEDNESAY
      11:30 AM - 01:00 PM CSE 315 Artificial Inteligence J-105
    `;
  };

  const handleFileSubmit = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setRoutineData(null);
    try {
      const ocrText = await mockOcrExtraction(file);
      const { enhancedText } = await enhanceOcrAccuracy(ocrText);
      const parsedData = parseRoutineText(enhancedText);

      if (Object.keys(parsedData).length === 0) {
        const description = "Couldn't extract a routine from the PDF. You can try pasting the text manually.";
        setError(description);
        toast({ variant: 'destructive', title: 'Processing Failed', description });
        setRoutineData(null);
      } else {
        setRoutineData(parsedData);
      }
    } catch (e) {
      const description = 'An error occurred during PDF processing.';
      setError(description);
      toast({ variant: 'destructive', title: 'Error', description });
      console.error(e);
    }
    setIsLoading(false);
  };

  const hasData = useMemo(() => routineData && Object.keys(routineData).some(day => routineData[day as keyof RoutineData]?.length ?? 0 > 0), [routineData]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <RoutineInput 
            onTextSubmit={handleTextSubmit}
            onFileSubmit={handleFileSubmit}
            isLoading={isLoading}
          />
          
          {isLoading && (
             <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Generating Your Routine...</CardTitle>
                  <CardDescription>Please wait while we work our magic. This may take a moment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
          )}

          {!isLoading && !hasData && <Welcome />}
          
          {hasData && !isLoading && (
            <Card className="overflow-hidden shadow-md">
               <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Your Formatted Routine</CardTitle>
                  <CardDescription>
                    {viewMode === 'table' 
                      ? 'Click on any cell to edit. You can export your routine below.'
                      : 'This is a preview of the PDF format. Switch to table view to edit.'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'table' ? 'list' : 'table')}>
                    {viewMode === 'table' ? <List /> : <Table />}
                  </Button>
                  <ExportButtons routineData={routineData} viewMode={viewMode} />
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'table' ? (
                  <RoutineTable 
                    ref={tableRef}
                    initialData={routineData} 
                    onUpdate={setRoutineData}
                  />
                ) : (
                  <RoutineList routineData={routineData} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <footer className="text-center py-6 text-muted-foreground text-sm">
        <p>Built with ❤️ by Firebase Studio. RoutineReady &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
