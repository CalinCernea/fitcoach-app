// components/MealDetailDialog.jsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Beef,
  BookOpen,
  CheckCircle,
  Droplets,
  Replace,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

export function MealDetailDialog({ meal, isOpen, onOpenChange, onSwap }) {
  // Dacă nu există o masă selectată, nu randa nimic.
  if (!meal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{meal.name}</DialogTitle>
          <DialogDescription>
            Here are the details for your meal. Enjoy!
          </DialogDescription>
        </DialogHeader>

        {/* Container principal cu scroll */}
        <div className="flex-grow overflow-y-auto pr-4">
          {/* Imaginea mesei */}
          {meal.imageUrl && (
            <div className="relative h-60 w-full mb-4 rounded-lg overflow-hidden">
              <img
                src={meal.imageUrl}
                alt={meal.name}
                className="absolute h-full w-full object-cover"
              />
            </div>
          )}

          {/* Secțiunea de Macronutrienți */}
          <div className="px-4 py-3 mb-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-500">Calories</p>
                <p className="text-xl font-bold text-blue-500">
                  {Math.round(meal.total_calories)}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-slate-500">Protein</span>
                <div className="flex items-center gap-1 font-semibold">
                  <Beef className="h-4 w-4 text-red-500" />
                  {Math.round(meal.total_protein)}g
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-slate-500">Carbs</span>
                <div className="flex items-center gap-1 font-semibold">
                  <Wheat className="h-4 w-4 text-yellow-500" />
                  {Math.round(meal.total_carbs)}g
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-sm text-slate-500">Fats</span>
                <div className="flex items-center gap-1 font-semibold">
                  <Droplets className="h-4 w-4 text-sky-500" />
                  {Math.round(meal.total_fats)}g
                </div>
              </div>
            </div>
          </div>

          {/* Grid pentru Ingrediente și Instrucțiuni */}
          <div className="grid md:grid-cols-2 gap-8 p-4">
            {/* Coloana Ingrediente */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" /> Ingredients
              </h4>
              {meal.isPrepMode && meal.categorizedIngredients ? (
                // --- Afișaj pentru Prep Mode ---
                <>
                  {meal.categorizedIngredients.prepped.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Prepped Components
                      </p>
                      <ul className="space-y-2">
                        {meal.categorizedIngredients.prepped.map((ing, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center p-2 rounded-md bg-green-50 dark:bg-green-900/20"
                          >
                            <span>{ing.name}</span>
                            <span className="font-mono text-slate-500">
                              {ing.amount}
                              {ing.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meal.categorizedIngredients.fresh.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-600 font-medium mb-2">
                        Fresh Ingredients
                      </p>
                      <ul className="space-y-2">
                        {meal.categorizedIngredients.fresh.map((ing, i) => (
                          <li
                            key={i}
                            className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
                          >
                            <span>{ing.name}</span>
                            <span className="font-mono text-slate-500">
                              {ing.amount}
                              {ing.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                // --- Afișaj Standard ---
                <ul className="space-y-2">
                  {meal.ingredients?.map((ing, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
                    >
                      <span>{ing.name}</span>
                      <span className="font-mono text-slate-500">
                        {ing.amount}
                        {ing.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Coloana Instrucțiuni */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />{" "}
                {meal.isPrepMode ? "Assembly" : "Instructions"}
              </h4>
              <ol className="list-decimal list-inside space-y-3 text-slate-600 dark:text-slate-300">
                {meal.instructions?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Footer-ul dialogului cu butonul de Swap */}
        <DialogFooter className="pt-4 border-t">
          <Button
            variant="default"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:shadow-lg transition-shadow"
            onClick={onSwap}
          >
            <Replace className="mr-2 h-4 w-4" />
            Swap this Meal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
