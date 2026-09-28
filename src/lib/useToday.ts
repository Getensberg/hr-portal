"use client";
import { useEffect, useState } from "react";
import { todayKey } from "./vacation";

export function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(todayKey());
  }, []);
  return today;
}