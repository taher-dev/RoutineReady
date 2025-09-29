import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardPaste, Upload, Palette } from "lucide-react";

export function Welcome() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to RoutineReady!</CardTitle>
        <CardDescription>
          The simplest way to format your university routine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-foreground/80">
          Tired of messy, hard-to-read routine files? You're in the right place. Just paste your routine text or upload a PDF, and we'll transform it into a clean, beautiful, and organized timetable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <ClipboardPaste className="w-6 h-6" />
            </div>
            <h3 className="font-semibold">Paste Text</h3>
            <p className="text-sm text-muted-foreground">Copy your routine from any source and paste it directly.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-semibold">Upload PDF</h3>
            <p className="text-sm text-muted-foreground">Even scanned, non-selectable PDFs work thanks to our OCR magic.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="font-semibold">Instantly Formatted</h3>
            <p className="text-sm text-muted-foreground">Get a clean, editable, and exportable timetable in seconds.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
