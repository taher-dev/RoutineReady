'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ClipboardPaste, Wand2, Loader2 } from 'lucide-react';

interface RoutineInputProps {
  onTextSubmit: (text: string) => void;
  onFileSubmit: (file: File) => void;
  isLoading: boolean;
}

export function RoutineInput({ onTextSubmit, onFileSubmit, isLoading }: RoutineInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTextFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTextSubmit(text);
  };

  const handleFileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onFileSubmit(file);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Get Started</CardTitle>
        <CardDescription>Provide your routine by pasting text or uploading a PDF.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste"><ClipboardPaste className="mr-2" /> Paste Text</TabsTrigger>
            <TabsTrigger value="upload"><Upload className="mr-2" /> Upload PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="paste" className="pt-4">
            <form onSubmit={handleTextFormSubmit} className="space-y-4">
              <Textarea
                placeholder="Paste your unformatted routine here..."
                className="min-h-[200px] text-sm"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" className="w-full" disabled={isLoading || !text}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 className="mr-2" />}
                Generate from Text
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="upload" className="pt-4">
             <form onSubmit={handleFileFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload">PDF File</Label>
                  <Input 
                    id="pdf-upload" 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isLoading}
                    className="file:text-primary file:font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Scanned PDFs are supported. Max file size: 10MB.
                  </p>
                </div>
              <Button type="submit" className="w-full" disabled={isLoading || !file}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 className="mr-2" />}
                Generate from PDF
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
