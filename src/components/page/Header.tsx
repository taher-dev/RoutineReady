import { FileSpreadsheet } from 'lucide-react';

export function Header() {
  return (
    <header className="p-4 border-b bg-card shadow-sm sticky top-0 z-20 backdrop-blur-sm bg-card/80">
      <div className="container mx-auto flex items-center gap-3">
        <FileSpreadsheet className="text-primary h-7 w-7" />
        <h1 className="text-2xl font-bold font-headline text-foreground">
          RoutineReady
        </h1>
      </div>
    </header>
  );
}
