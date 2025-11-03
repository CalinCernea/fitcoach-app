// app/(app)/profile/page.jsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { calculateAdvancedMetrics } from "@/utils/calorieCalculator";
import { foodComponents } from "@/utils/foodComponentDatabase"; // --- NOU: Importăm ingredientele

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select"; // --- NOU: Importăm componenta MultiSelect

// --- NOU: Importăm componentele pentru grafic ---
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// --- NOU: Pregătim opțiunile pentru MultiSelect ---
const foodOptions = Object.entries(foodComponents).map(([key, value]) => ({
  value: key,
  label: value.name,
}));

// --- Componenta de Loading ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");

  // --- Stări pentru jurnalul de greutate ---
  const [weightLog, setWeightLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(true);

  // --- Funcție pentru a prelua jurnalul de greutate ---
  const fetchWeightLog = useCallback(async (userId) => {
    setLoadingLog(true);
    const { data, error } = await supabase
      .from("weight_log")
      .select("created_at, weight")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Could not load weight progress.");
      console.error("Weight log fetch error:", error);
    } else {
      const formattedData = data.map((log) => ({
        date: new Date(log.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        weight: parseFloat(log.weight),
      }));
      setWeightLog(formattedData);
    }
    setLoadingLog(false);
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      setError("Could not fetch your profile. Please try again.");
      console.error("Profile fetch error:", error);
    } else {
      // --- MODIFICAT: Asigurăm că listele de preferințe nu sunt null la încărcare ---
      setProfileData({
        ...data,
        liked_foods: data.liked_foods || [],
        disliked_foods: data.disliked_foods || [],
      });
      fetchWeightLog(session.user.id);
    }
    setLoading(false);
  }, [router, fetchWeightLog]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const cleanData = {
      ...profileData,
      height: parseInt(profileData.height, 10) || 0,
      weight: parseFloat(profileData.weight) || 0,
      weeklyTarget: parseFloat(profileData.weeklyTarget) || 0,
    };

    const newMetrics = calculateAdvancedMetrics(cleanData);

    // --- MODIFICAT: Includem și listele de preferințe în payload-ul de update ---
    const updatePayload = {
      ...cleanData,
      ...newMetrics,
      liked_foods: profileData.liked_foods,
      disliked_foods: profileData.disliked_foods,
    };

    // 1. Actualizăm profilul principal
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", profileData.id);

    if (profileError) {
      setIsSaving(false);
      toast.error(`Failed to update profile: ${profileError.message}`);
      console.error("Profile update error:", profileError);
      return;
    }

    // 2. Adăugăm intrarea în jurnalul de greutate
    const { error: logError } = await supabase
      .from("weight_log")
      .insert({ user_id: profileData.id, weight: cleanData.weight });

    setIsSaving(false);

    if (logError) {
      toast.warning("Profile saved, but could not log weight entry.");
      console.warn("Weight log insert error:", logError);
    } else {
      toast.success("Profile updated and preferences saved!");
      fetchProfile();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!profileData) {
    return (
      <div className="text-center">
        No profile data found.
        <Link href="/dashboard" className="text-blue-500 underline ml-2">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft />
              </Link>
            </Button>
          </div>
          <CardDescription>
            Update your personal information, goals, and food preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profileData.dob || ""}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profileData.height || ""}
                  onChange={(e) => handleChange("height", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Current Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={profileData.weight || ""}
                  onChange={(e) => handleChange("weight", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select
                  value={profileData.activity || ""}
                  onValueChange={(val) => handleChange("activity", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="lightly_active">
                      Lightly Active
                    </SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="very_active">Very Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select
                  value={profileData.goal || ""}
                  onValueChange={(val) => handleChange("goal", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="get_leaner">Get Leaner</SelectItem>
                    <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                    <SelectItem value="gain_strength">Gain Strength</SelectItem>
                    <SelectItem value="overall_health">
                      Improve Overall Health
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* --- NOU: Secțiunea pentru Preferințe Alimentare --- */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Food Preferences</h3>
              <div className="space-y-2">
                <Label>Foods I Like</Label>
                <MultiSelect
                  options={foodOptions}
                  selected={profileData.liked_foods}
                  onChange={(selected) => handleChange("liked_foods", selected)}
                  placeholder="Select your favorite foods..."
                />
                <p className="text-sm text-muted-foreground">
                  We'll try to include these more often in your plan.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Foods I Dislike / Allergies</Label>
                <MultiSelect
                  options={foodOptions}
                  selected={profileData.disliked_foods}
                  onChange={(selected) =>
                    handleChange("disliked_foods", selected)
                  }
                  placeholder="Select foods to avoid..."
                />
                <p className="text-sm text-muted-foreground">
                  We will exclude these from your meal plan.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Progress</CardTitle>
          <CardDescription>Your weight journey over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingLog ? (
            <div className="text-center p-8">Loading progress chart...</div>
          ) : weightLog.length > 1 ? (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weightLog}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      domain={["dataMin - 2", "dataMax + 2"]}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recent Logs</h4>
                <ul className="space-y-2">
                  {weightLog
                    .slice(-5)
                    .reverse()
                    .map((log, index) => (
                      <li
                        key={index}
                        className="flex justify-between p-2 rounded-md bg-slate-100 dark:bg-slate-800"
                      >
                        <span>{log.date}</span>
                        <span className="font-semibold">{log.weight} kg</span>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 p-8">
              Not enough data to display a chart. Update your weight a few times
              to see your progress.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
