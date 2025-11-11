// components/SwapMealDialog.jsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Beef, Wheat, Droplets } from "lucide-react";

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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose an Alternative Meal</DialogTitle>
          <DialogDescription>
            Select a meal to replace the current one. All alternatives match
            your preferences and dietary requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {alternatives.map((meal, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => onSelectMeal(meal)}
            >
              <div className="flex gap-4">
                {meal.imageUrl && (
                  <img
                    src={meal.imageUrl}
                    alt={meal.name}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{meal.name}</h3>
                    {meal.isPrepMode && (
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Prep Mode
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Calories:</span>
                      <p className="font-medium">
                        {Math.round(meal.total_calories)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Beef className="h-3 w-3 text-red-500" />
                      <span className="text-slate-500">Protein:</span>
                      <p className="font-medium">
                        {Math.round(meal.total_protein)}g
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wheat className="h-3 w-3 text-yellow-500" />
                      <span className="text-slate-500">Carbs:</span>
                      <p className="font-medium">
                        {Math.round(meal.total_carbs)}g
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-blue-500" />
                      <span className="text-slate-500">Fats:</span>
                      <p className="font-medium">
                        {Math.round(meal.total_fats)}g
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-slate-600">
                      {meal.ingredients
                        ?.slice(0, 3)
                        .map((ing) => ing.name)
                        .join(", ")}
                      {meal.ingredients?.length > 3 &&
                        ` +${meal.ingredients.length - 3} more`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
