'use client';

import { RoutineData, ALL_DAYS, Day } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoutineListProps {
    routineData: RoutineData;
}

const getShortDay = (day: Day): string => {
    return day.substring(0, 3).toUpperCase();
}

export function RoutineList({ routineData }: RoutineListProps) {
    const daysWithCourses = ALL_DAYS.filter(day => routineData[day] && routineData[day]!.length > 0);
    
    if (daysWithCourses.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                No routine data to display.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {daysWithCourses.map(day => (
                <div key={day}>
                    <h2 className="text-xl font-bold mb-3 border-b pb-2">{day}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(routineData[day] || []).map(course => (
                            <Card key={course.id} className="bg-card shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-primary-foreground">{course.course}</CardTitle>
                                    <CardDescription className="text-xs">{course.time}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-foreground/90">{course.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Room: {course.room}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
