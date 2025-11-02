// app/(app)/profile/page.jsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { calculateAdvancedMetrics } from "@/utils/calorieCalculator";

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
      setProfileData(data);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Creează un obiect curat pentru a asigura tipurile corecte înainte de calcul și salvare
    const cleanData = {
      ...profileData,
      height: parseInt(profileData.height, 10) || 0,
      weight: parseFloat(profileData.weight) || 0,
      weeklyTarget: parseFloat(profileData.weeklyTarget) || 0,
    };

    const newMetrics = calculateAdvancedMetrics(cleanData);
    const updatePayload = { ...cleanData, ...newMetrics };

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", profileData.id);

    setIsSaving(false);

    if (error) {
      toast.error(`Failed to update profile: ${error.message}`);
      console.error("Profile update error:", error);
    } else {
      toast.success("Profile updated successfully!");
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
    <div className="w-full max-w-2xl">
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
            Update your personal information and goals.
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
    </div>
  );
}
