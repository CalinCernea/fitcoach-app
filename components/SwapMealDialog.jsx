// components/SwapMealDialog.jsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";

export function SwapMealDialog({
  isOpen,
  onOpenChange,
  alternatives,
  onSelectMeal,
}) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose an Alternative</DialogTitle>
          <DialogDescription>
            Select a meal below to swap it into your plan. Calorie and macro
            counts are similar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {alternatives.map((meal, index) => (
            <Card
              key={`${meal.id}-${index}`}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500"
              onClick={() => {
                onSelectMeal(meal);
                onOpenChange(false);
              }}
            >
              <CardContent className="p-4">
                <div className="relative h-32 w-full mb-3 rounded-md overflow-hidden">
                  {meal.imageUrl ? (
                    <img
                      src={meal.imageUrl}
                      alt={meal.name}
                      className="absolute h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800">
                      <UtensilsCrossed className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-md mb-1">{meal.name}</h3>
                <p className="text-sm text-blue-500 font-bold">
                  {meal.total_calories} kcal
                </p>
                {/* --- AICI ESTE CORECȚIA --- */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-medium">P:</span> {meal.total_protein}g
                  &bull; <span className="font-medium">C:</span>{" "}
                  {meal.total_carbs}g &bull;{" "}
                  <span className="font-medium">F:</span> {meal.total_fats}g
                </div>
                {/* Am schimbat </p> în </div> */}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
