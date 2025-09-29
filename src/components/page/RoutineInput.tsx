'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Send, Loader2, Paperclip } from 'lucide-react';

interface RoutineInputProps {
  onTextSubmit: (text: string) => void;
  onFileSubmit: (file: File) => void;
  isLoading: boolean;
}

export function RoutineInput({ onTextSubmit, onFileSubmit, isLoading }: RoutineInputProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSubmit(e.target.files[0]);
    }
  };

  const handleTextFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
        onTextSubmit(text);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextFormSubmit(e);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>Provide your routine by pasting text or uploading a PDF.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleTextFormSubmit} className="relative">
            <Textarea
                placeholder="Paste your unformatted routine here, or upload a file..."
                className="min-h-[120px] text-sm pr-28"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
            />
            <div className='absolute bottom-3 right-3 flex items-center gap-2'>
                <input 
                    id="pdf-upload" 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                    disabled={isLoading}
                />
                <Button type="button" variant="ghost" size="icon" onClick={handleUploadClick} disabled={isLoading} aria-label="Upload PDF">
                    <Paperclip />
                </Button>
                <Button type="submit" size="icon" disabled={isLoading || !text} aria-label="Generate from Text">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </div>
        </form>
         <p className="text-xs text-muted-foreground mt-2">
            You can also upload a scanned PDF. Press Shift+Enter for a new line.
        </p>
      </CardContent>
    </Card>
  );
}
