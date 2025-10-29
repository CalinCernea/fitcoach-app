// components/OnboardingForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const calculateAdvancedMetrics = (data) => {
  const { sex, weight, height, dob, activity, goal, weeklyTarget } = data;
  const age = new Date().getFullYear() - new Date(dob).getFullYear();
  let bmr;
  if (sex === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    active: 1.55,
    very_active: 1.725,
  };
  const tdee = bmr * activityMultipliers[activity];
  const weeklyCaloricChange = weeklyTarget * 7700;
  const dailyCaloricChange = weeklyCaloricChange / 7;
  let targetCalories;
  if (goal.includes("lose") || goal.includes("leaner")) {
    targetCalories = tdee - dailyCaloricChange;
  } else if (goal.includes("gain")) {
    targetCalories = tdee + dailyCaloricChange;
  } else {
    targetCalories = tdee;
  }
  const proteinGrams = weight * 1.8;
  const proteinCalories = proteinGrams * 4;
  const fatCalories = targetCalories * 0.25;
  const fatGrams = fatCalories / 9;
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbsGrams = carbCalories / 4;
  return {
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    targetProtein: Math.round(proteinGrams),
    targetCarbs: Math.round(carbsGrams),
    targetFats: Math.round(fatGrams),
  };
};

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    dob: "1995-01-01",
    sex: "male",
    height: 180,
    weight: 80,
    activity: "lightly_active",
    goal: "lose_weight",
    dietaryPreferences: "none",
    allergies: [],
    weeklyTarget: 0.5,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAllergyChange = (allergy) => {
    setFormData((prev) => {
      const newAllergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy];
      return { ...prev, allergies: newAllergies };
    });
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    const calculatedResults = calculateAdvancedMetrics(formData);
    const dataToStore = {
      onboardingData: formData,
      planResults: calculatedResults,
    };
    localStorage.setItem("onboardingSession", JSON.stringify(dataToStore));
    router.push("/signup");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange("dob", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <RadioGroup
                  value={formData.sex}
                  onValueChange={(val) => handleChange("sex", val)}
                  className="flex items-center h-10"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label>Activity Level</Label>
              <Select
                value={formData.activity}
                onValueChange={(val) => handleChange("activity", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Fitness Goal</Label>
              <Select
                value={formData.goal}
                onValueChange={(val) => handleChange("goal", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your main goal" />
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
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label>Dietary Preferences</Label>
              <Select
                value={formData.dietaryPreferences}
                onValueChange={(val) => handleChange("dietaryPreferences", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any specific diet?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Food Allergies</Label>
              <div className="grid grid-cols-2 gap-2">
                {["dairy", "gluten", "nuts", "soy"].map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={allergy}
                      checked={formData.allergies.includes(allergy)}
                      onCheckedChange={() => handleAllergyChange(allergy)}
                    />
                    <Label htmlFor={allergy} className="capitalize font-normal">
                      {allergy}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        const isLosing =
          formData.goal.includes("lose") || formData.goal.includes("leaner");
        const isGaining = formData.goal.includes("gain");
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label htmlFor="weeklyTarget">Desired Weekly Progress</Label>
              <p className="text-sm text-slate-500">
                How much weight do you want to {isLosing ? "lose" : "gain"} per
                week?
              </p>
              <div className="flex items-center gap-4">
                <Input
                  id="weeklyTarget"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1"
                  value={formData.weeklyTarget}
                  onChange={(e) =>
                    handleChange("weeklyTarget", parseFloat(e.target.value))
                  }
                  disabled={!isLosing && !isGaining}
                />
                <span className="text-slate-600">kg/week</span>
              </div>
              {!isLosing && !isGaining && (
                <p className="text-xs text-amber-600 pt-2">
                  This setting is for weight loss/gain goals.
                </p>
              )}
              <p className="text-xs text-slate-500 pt-2">
                A sustainable rate is 0.2-0.8kg per week. We recommend 0.5kg.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create Your Profile</CardTitle>
        <CardDescription>
          Step {step} of 4. Let's get to know you better.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[280px]">{renderStep()}</CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          className={step === 1 ? "invisible" : ""}
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back
        </Button>
        {step < 4 && (
          <Button onClick={handleNext}>
            Next <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
        {step === 4 && (
          <Button onClick={handleSubmit}>
            Calculate & Continue <Sparkles className="ml-2 w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
