// components/WeeklyOverviewWidget.jsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Funcție helper pentru a adăuga zile la o dată (o putem muta într-un fișier utilitar mai târziu)
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Funcție helper pentru a formata data (similar, poate fi centralizată)
const getFormattedDate = (date) => date.toISOString().split("T")[0];

export function WeeklyOverviewWidget({
  plans,
  currentDate,
  startOfWeek,
  onDaySelect,
  changeWeek,
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Weekly View</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => changeWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => {
          const dayDate = addDays(startOfWeek, i);
          const dayString = getFormattedDate(dayDate);
          const plan = plans.get(dayString);
          const isSelected = getFormattedDate(currentDate) === dayString;

          return (
            <button
              key={dayString}
              onClick={() => onDaySelect(dayDate)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-center border-2 transition-all duration-200 h-full ${
                isSelected
                  ? "border-blue-500 bg-blue-100 dark:bg-blue-900/50 shadow-md"
                  : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <p className="font-bold text-sm">
                {dayDate.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className="text-xs text-slate-500 mb-2">{dayDate.getDate()}</p>
              {plan ? (
                <div className="text-xs font-semibold">
                  {Math.round(plan.totals.calories)}
                  <span className="text-slate-500 font-normal"> kcal</span>
                </div>
              ) : (
                <div className="h-6"></div> // Placeholder pentru a menține alinierea
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
