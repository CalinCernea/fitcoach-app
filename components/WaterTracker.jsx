// components/WaterTracker.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassWater, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

const getFormattedDate = (date) => date.toISOString().split("T")[0];

const LoadingSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
    </CardHeader>
    <CardContent className="flex flex-col items-center gap-4 pt-4">
      <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      <div className="flex gap-2 w-full">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
      </div>
    </CardContent>
  </Card>
);

export function WaterTracker({ userId, dailyTarget }) {
  const [consumed, setConsumed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTodayIntake = useCallback(async () => {
    setLoading(true);
    const today = getFormattedDate(new Date());
    const { data, error } = await supabase
      .from("water_log")
      .select("amount_ml")
      .eq("user_id", userId)
      .eq("date", today);

    if (error) {
      console.error("Error fetching water intake:", error);
      toast.error("Could not load water intake.");
    } else {
      const total = data.reduce((sum, entry) => sum + entry.amount_ml, 0);
      setConsumed(total);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchTodayIntake();
    }
  }, [userId, fetchTodayIntake]);

  const handleAddWater = async (amount) => {
    setIsUpdating(true);
    const today = getFormattedDate(new Date());

    const { error } = await supabase
      .from("water_log")
      .insert({ user_id: userId, date: today, amount_ml: amount });

    if (error) {
      toast.error("Failed to add water. Please try again.");
      console.error("Water log insert error:", error);
    } else {
      setConsumed((prev) => prev + amount);
      toast.success(`+${amount}ml added!`);
    }
    setIsUpdating(false);
  };

  const handleRemoveLast = async () => {
    setIsUpdating(true);
    const today = getFormattedDate(new Date());

    const { data: lastEntry, error: fetchError } = await supabase
      .from("water_log")
      .select("id, amount_ml")
      .eq("user_id", userId)
      .eq("date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !lastEntry) {
      toast.info("No entries to remove for today.");
      setIsUpdating(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("water_log")
      .delete()
      .eq("id", lastEntry.id);

    if (deleteError) {
      toast.error("Failed to remove last entry.");
      console.error("Water log delete error:", deleteError);
    } else {
      setConsumed((prev) => Math.max(0, prev - lastEntry.amount_ml));
      toast.success(`-${lastEntry.amount_ml} removed.`);
    }
    setIsUpdating(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const progress = dailyTarget > 0 ? (consumed / dailyTarget) * 100 : 0;

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GlassWater className="text-blue-500" />
          Daily Water Intake
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 pb-3">
        <div
          className="relative h-20 w-20 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 overflow-hidden"
          title={`${Math.round(progress)}%`}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-500"
            style={{ height: `${progress}%` }}
          ></div>
          <GlassWater className="relative h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="text-center">
          <p className="text-xl font-bold">
            {consumed.toLocaleString()}
            <span className="text-sm font-normal text-slate-500">
              {" "}
              / {dailyTarget.toLocaleString()} ml
            </span>
          </p>
          <p className="text-sm text-slate-500">Today's Goal</p>
        </div>

        {/* --- MODIFICARE: Elimină w-full de aici pentru a permite centrarea --- */}
        <div className="grid grid-cols-4 gap-2 pl-8">
          <Button
            variant="outline"
            onClick={() => handleAddWater(250)}
            disabled={isUpdating}
          >
            <Plus className="mr-1 h-4 w-4" /> 250ml
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddWater(500)}
            disabled={isUpdating}
          >
            <Plus className="mr-1 h-4 w-4" /> 500ml
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddWater(750)}
            disabled={isUpdating}
          >
            <Plus className="mr-1 h-4 w-4" /> 750ml
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleRemoveLast}
            disabled={isUpdating || consumed === 0}
            title="Remove last entry"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
