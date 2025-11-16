// app/(app)/profile/page.jsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { calculateAdvancedMetrics } from "@/utils/calorieCalculator";
import { ingredients } from "@/utils/recipeDatabase";
import { useDebouncedCallback } from "use-debounce";

// --- NOU: Importuri pentru UI și Animații ---
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Target,
  Heart,
  Utensils,
  Check,
  Settings,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput"; // Refolosim componenta!
import { Input } from "@/components/ui/input";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const foodOptions = Object.entries(ingredients).map(([key, value]) => ({
  value: key,
  label: value.name,
}));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");
  const [weightLog, setWeightLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(true);

  // --- NOU: Stări pentru noul UI ---
  const [activeTab, setActiveTab] = useState("details");
  const [savingStatus, setSavingStatus] = useState({});
  const [needsPlanRefresh, setNeedsPlanRefresh] = useState(false);

  const fetchWeightLog = useCallback(async (userId) => {
    setLoadingLog(true);
    const { data, error } = await supabase
      .from("weight_log")
      .select("created_at, weight")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Could not load weight progress.");
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
    } else {
      setProfileData({
        ...data,
        gender: data.sex,
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

  // --- NOU: Logica de Salvare Automată ---
  const debouncedUpdate = useDebouncedCallback(async (field, value, label) => {
    setSavingStatus((prev) => ({ ...prev, [field]: "saving" }));

    const updatedProfileForCalc = { ...profileData, [field]: value };
    const profileForApi = {
      ...updatedProfileForCalc,
      sex: updatedProfileForCalc.gender,
    };

    const updatePayload = {};
    if (field === "gender") {
      updatePayload.sex = value;
    } else {
      updatePayload[field] = value;
    }

    const fieldsThatTriggerRecalculation = [
      "weight",
      "height",
      "dob",
      "activity",
      "goal",
      "weeklyTarget",
      "gender",
    ];

    if (fieldsThatTriggerRecalculation.includes(field)) {
      const newMetrics = calculateAdvancedMetrics(profileForApi);
      if (newMetrics) {
        Object.assign(updatePayload, newMetrics);
      }
      if (updatedProfileForCalc.weight) {
        updatePayload.daily_water_target = Math.round(
          updatedProfileForCalc.weight * 35
        );
      }
      if (field === "weight") {
        await supabase
          .from("weight_log")
          .insert({ user_id: updatedProfileForCalc.id, weight: value });
      }
    }

    delete updatePayload.gender;

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", updatedProfileForCalc.id);

    if (error) {
      setSavingStatus((prev) => ({ ...prev, [field]: "error" }));
      toast.error(`Failed to update ${label}.`);
      console.error("Update Error:", error);
    } else {
      setSavingStatus((prev) => ({ ...prev, [field]: "saved" }));

      // --- MODIFICARE CRUCIALĂ ---
      if (fieldsThatTriggerRecalculation.includes(field)) {
        // În loc să facem fetchProfile(), setăm steagul.
        console.log("🚩 Plan refresh needed. Flag set to true.");
        setNeedsPlanRefresh(true);
      }
    }
  }, 1500);

  const handleChange = (field, value, label = field) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate(field, value, label);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!profileData)
    return <div className="text-center">No profile data found.</div>;

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
        {/* ================== COLOANA STÂNGĂ: NAVIGARE ================== */}
        <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold mb-3">
                {profileData.name ? (
                  profileData.name.charAt(0).toUpperCase()
                ) : (
                  <User />
                )}
              </div>
              <h2 className="text-xl font-bold">{profileData.name}</h2>
              <p className="text-sm text-slate-500">{profileData.email}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  if (needsPlanRefresh) {
                    // Dacă este nevoie de refresh, navigăm cu parametrul special
                    router.push("/dashboard?refresh=true");
                  } else {
                    // Altfel, navigăm normal
                    router.push("/dashboard");
                  }
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button>
            </div>
            <nav className="space-y-2">
              <TabButton
                icon={User}
                label="Personal Details"
                isActive={activeTab === "details"}
                onClick={() => setActiveTab("details")}
              />
              <TabButton
                icon={Target}
                label="Goals & Metrics"
                isActive={activeTab === "goals"}
                onClick={() => setActiveTab("goals")}
              />
              <TabButton
                icon={Utensils}
                label="Food Preferences"
                isActive={activeTab === "prefs"}
                onClick={() => setActiveTab("prefs")}
              />
              <TabButton
                icon={Heart}
                label="My Progress"
                isActive={activeTab === "progress"}
                onClick={() => setActiveTab("progress")}
              />
            </nav>
          </div>
        </aside>

        {/* ================== COLOANA DREAPTĂ: CONȚINUT ================== */}
        <main className="w-full md:w-3/4 lg:w-4/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              {activeTab === "details" && (
                <SectionWrapper title="Personal Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditableField
                      label="Full Name"
                      field="name"
                      value={profileData.name}
                      onChange={handleChange}
                      status={savingStatus.name}
                    />
                    <EditableField
                      label="Date of Birth"
                      field="dob"
                      type="date"
                      value={profileData.dob}
                      onChange={handleChange}
                      status={savingStatus.dob}
                    />
                  </div>
                </SectionWrapper>
              )}
              {activeTab === "goals" && (
                <SectionWrapper title="Goals & Metrics">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditableField
                      label="Height (cm)"
                      field="height"
                      type="number"
                      value={profileData.height}
                      onChange={handleChange}
                      status={savingStatus.height}
                    />
                    <EditableField
                      label="Current Weight (kg)"
                      field="weight"
                      type="number"
                      step="0.1"
                      value={profileData.weight}
                      onChange={handleChange}
                      status={savingStatus.weight}
                    />
                    <EditableSelect
                      label="Activity Level"
                      field="activity"
                      value={profileData.activity}
                      onChange={handleChange}
                      status={savingStatus.activity}
                      options={[
                        { value: "sedentary", label: "Sedentary" },
                        { value: "lightly_active", label: "Lightly Active" },
                        { value: "active", label: "Active" },
                        { value: "very_active", label: "Very Active" },
                      ]}
                    />
                    <EditableSelect
                      label="Primary Goal"
                      field="goal"
                      value={profileData.goal}
                      onChange={handleChange}
                      status={savingStatus.goal}
                      options={[
                        { value: "lose_weight", label: "Lose Weight" },
                        { value: "get_leaner", label: "Get Leaner" },
                        { value: "gain_muscle", label: "Gain Muscle" },
                        { value: "gain_strength", label: "Gain Strength" },
                        {
                          value: "overall_health",
                          label: "Improve Overall Health",
                        },
                      ]}
                    />
                  </div>
                </SectionWrapper>
              )}
              {activeTab === "prefs" && (
                <SectionWrapper title="Food Preferences">
                  <div className="space-y-8">
                    <div>
                      <Label className="text-base font-semibold">
                        Foods I Like
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        We'll try to include these more often.
                      </p>
                      <MultiSelect
                        options={foodOptions}
                        selected={profileData.liked_foods}
                        onChange={(selected) =>
                          handleChange("liked_foods", selected, "Liked foods")
                        }
                        placeholder="Select your favorite foods..."
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold">
                        Foods I Dislike / Allergies
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        We will exclude these from your meal plan.
                      </p>
                      <MultiSelect
                        options={foodOptions}
                        selected={profileData.disliked_foods}
                        onChange={(selected) =>
                          handleChange(
                            "disliked_foods",
                            selected,
                            "Disliked foods"
                          )
                        }
                        placeholder="Select foods to avoid..."
                      />
                    </div>
                  </div>
                </SectionWrapper>
              )}
              {activeTab === "progress" && (
                <SectionWrapper title="My Progress">
                  {loadingLog ? (
                    <div className="text-center p-8">
                      Loading progress chart...
                    </div>
                  ) : weightLog.length > 1 ? (
                    <div className="h-80 w-full bg-white dark:bg-slate-900 p-4 rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={weightLog}
                          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            strokeOpacity={0.2}
                          />
                          <XAxis dataKey="date" />
                          <YAxis
                            domain={["dataMin - 2", "dataMax + 2"]}
                            allowDecimals={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                              backdropFilter: "blur(4px)",
                              borderRadius: "0.5rem",
                              border: "1px solid rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <motion.g>
                            <Line
                              type="monotone"
                              dataKey="weight"
                              stroke="#3b82f6"
                              strokeWidth={3}
                              dot={{ r: 5 }}
                              activeDot={{ r: 8 }}
                            />
                          </motion.g>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 p-8">
                      Not enough data to display a chart.
                    </p>
                  )}
                </SectionWrapper>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- COMPONENTE HELPER PENTRU NOUL UI ---

const TabButton = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
      isActive
        ? "bg-blue-500 text-white shadow-md"
        : "hover:bg-slate-100 dark:hover:bg-slate-800"
    }`}
  >
    <Icon className="h-5 w-5 flex-shrink-0" />
    <span className="font-semibold">{label}</span>
  </button>
);

const SectionWrapper = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm">
    <h3 className="text-2xl font-bold mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
      {title}
    </h3>
    {children}
  </div>
);

const EditableField = ({ label, field, value, onChange, status, ...props }) => (
  <div className="space-y-2">
    {/* Partea de sus cu eticheta și statusul rămâne la fel */}
    <div className="flex items-center justify-between h-6">
      <Label htmlFor={field} className="text-base">
        {label}
      </Label>
      <AnimatePresence mode="wait">
        <motion.div
          key={status || "idle"}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="flex items-center gap-1 text-xs"
        >
          {status === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          )}
          {status === "saved" && <Check className="h-4 w-4 text-green-500" />}
        </motion.div>
      </AnimatePresence>
    </div>

    {/* Aici este înlocuirea: un Input simplu cu placeholder */}
    <Input
      id={field}
      placeholder={label} // Folosim label-ul ca placeholder
      value={value || ""}
      onChange={(e) => onChange(field, e.target.value, label)}
      className="h-14 text-base" // Am păstrat înălțimea pentru consistență vizuală
      {...props}
    />
  </div>
);

const EditableSelect = ({ label, field, value, onChange, status, options }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between h-6">
      <Label className="text-base">{label}</Label>
      <AnimatePresence mode="wait">
        <motion.div
          key={status || "idle"}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="flex items-center gap-1 text-xs"
        >
          {status === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          )}
          {status === "saved" && <Check className="h-4 w-4 text-green-500" />}
        </motion.div>
      </AnimatePresence>
    </div>
    <Select
      value={value || ""}
      onValueChange={(val) => onChange(field, val, label)}
    >
      <SelectTrigger className="h-14 text-base">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-base">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
