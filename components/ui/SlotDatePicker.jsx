// components/ui/SlotDatePicker.jsx
"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const ITEM_HEIGHT = 48; // Înălțimea fiecărui item (număr) în px
const VISIBLE_ITEMS = 3; // Câte item-uri sunt vizibile în "fereastră"

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 14; i >= currentYear - 100; i--) {
    years.push(i);
  }
  return years;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const generateDays = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

const PickerColumn = ({ values, onSelect, initialValue }) => {
  const y = useMotionValue(0);
  const ySpring = useSpring(y, { stiffness: 300, damping: 30 });

  const initialIndex = values.indexOf(initialValue);
  useEffect(() => {
    y.set(-(initialIndex * ITEM_HEIGHT));
  }, [initialIndex, y, values]);

  const handleDragEnd = (event, info) => {
    const closestIndex = Math.round(-info.offset.y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(values.length - 1, closestIndex));
    y.set(-(clampedIndex * ITEM_HEIGHT));
    onSelect(values[clampedIndex]);
  };

  return (
    <div
      className="h-full w-full overflow-hidden relative"
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
    >
      <motion.div
        drag="y"
        dragConstraints={{
          top: -((values.length - 1) * ITEM_HEIGHT),
          bottom: 0,
        }}
        onDragEnd={handleDragEnd}
        style={{ y: ySpring }}
        className="w-full"
      >
        {values.map((val, i) => (
          <motion.div
            key={i}
            className="h-12 flex items-center justify-center text-2xl font-semibold"
            style={{ height: ITEM_HEIGHT }}
          >
            {val}
          </motion.div>
        ))}
      </motion.div>
      {/* Indicatorul central */}
      <div className="absolute inset-y-1/2 -translate-y-1/2 h-12 w-full bg-blue-500/10 border-y-2 border-blue-500 rounded-lg" />
    </div>
  );
};

export const SlotDatePicker = ({ value, onChange }) => {
  const date = new Date(value);
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth());
  const [day, setDay] = useState(date.getDate());

  const years = generateYears();
  const days = generateDays(year, month);

  useEffect(() => {
    const newDate = new Date(year, month, day);
    // Verificăm dacă data este validă (ex: 31 Februarie devine 3 Martie)
    if (
      newDate.getFullYear() === year &&
      newDate.getMonth() === month &&
      newDate.getDate() === day
    ) {
      onChange(newDate.toISOString().split("T")[0]);
    }
  }, [year, month, day, onChange]);

  const handleYearSelect = (newYear) => {
    const currentDaysInMonth = new Date(newYear, month + 1, 0).getDate();
    if (day > currentDaysInMonth) {
      setDay(currentDaysInMonth);
    }
    setYear(newYear);
  };

  const handleMonthSelect = (newMonthLabel) => {
    const newMonthIndex = months.indexOf(newMonthLabel);
    const currentDaysInMonth = new Date(year, newMonthIndex + 1, 0).getDate();
    if (day > currentDaysInMonth) {
      setDay(currentDaysInMonth);
    }
    setMonth(newMonthIndex);
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-40 p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
      <PickerColumn values={days} onSelect={setDay} initialValue={day} />
      <PickerColumn
        values={months}
        onSelect={handleMonthSelect}
        initialValue={months[month]}
      />
      <PickerColumn
        values={years}
        onSelect={handleYearSelect}
        initialValue={year}
      />
    </div>
  );
};
