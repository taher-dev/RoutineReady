# **App Name**: RoutineReady

## Core Features:

- Routine Input: Allows users to input routine data either by pasting text or uploading a PDF file, accommodating both selectable and scanned documents.
- Optical Character Recognition: Uses Tesseract.js to extract text from uploaded PDFs, processing even scanned documents for usable routine information. The LLM uses its tool to help recognize hard to read characters, if accuracy is low on the first try.
- Automated Formatting: Automatically formats the extracted or pasted text into a structured, day-wise timetable.
- Day-wise Timetable View: Displays the formatted routine in an intuitive day-wise table, enhancing readability and organization.
- Break Time Highlighting: Visually highlights the designated break time (1:00 PM - 1:30 PM) within the timetable for quick identification.
- Inline Editing: Enables users to directly edit entries within the timetable, correcting any OCR inaccuracies or making personal adjustments.
- Export Options: Offers functionality to export the formatted routine as a PDF or Excel file, providing users with versatile sharing and storage options.

## Style Guidelines:

- Primary color: Light teal (#94D3AC) to represent focus and organization. This is in the green hues suggested by the header color.
- Background color: Off-white (#F5F5F5), emulating ChatGPT's light mode for a soft, clean backdrop.
- Accent color: Soft Blue (#8AB4F8) for interactive elements.
- Body and headline font: 'PT Sans', a humanist sans-serif known for its modern, accessible feel suitable for both headlines and body text, enhancing readability across the app.
- Simple, line-style icons to maintain a clean, unobtrusive aesthetic, enhancing the app's usability without overwhelming the user interface.
- Clean and modern table layout inspired by ChatGPT with soft shadows and minimal borders, to enhance the digital user experience.
- Subtle transitions and animations for user interactions to enhance user experience. For example: Hover effect on table rows.