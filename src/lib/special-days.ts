import type { SpecialDayView } from "@/types";

const FALLBACK_SPECIAL_DAYS: SpecialDayView[] = [
  { id: "1", name: "International Mother Language Day", nameBn: "আন্তর্জাতিক মাতৃভাষা দিবস", category: "bd_national", month: 2, day: 21 },
  { id: "2", name: "Valentine's Day", nameBn: "ভ্যালেন্টাইনস ডে", category: "international", month: 2, day: 14 },
  { id: "3", name: "Independence Day", nameBn: "স্বাধীনতা দিবস", category: "bd_national", month: 3, day: 26 },
  { id: "4", name: "International Women's Day", nameBn: "আন্তর্জাতিক নারী দিবস", category: "international", month: 3, day: 8 },
  { id: "5", name: "Pohela Boishakh", nameBn: "পহেলা বৈশাখ", category: "bd_national", month: 4, day: 14 },
  { id: "6", name: "Mother's Day", nameBn: "মা দিবস", category: "international", month: 5, day: 8 },
  { id: "7", name: "Victory Day", nameBn: "বিজয় দিবস", category: "bd_national", month: 12, day: 16 },
  { id: "8", name: "Christmas", nameBn: "বড়দিন", category: "religious", month: 12, day: 25 },
];

export interface UpcomingSpecialDay extends SpecialDayView {
  daysUntil: number;
  date: Date;
}

function getNextOccurrence(month: number, day: number, from = new Date()) {
  const candidate = new Date(from.getFullYear(), month - 1, day);
  if (candidate < from) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

function daysBetween(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function fromFallback(daysAhead: number): UpcomingSpecialDay[] {
  const today = new Date();
  const results: UpcomingSpecialDay[] = [];

  for (const day of FALLBACK_SPECIAL_DAYS) {
    if (!day.month || !day.day) continue;
    const date = getNextOccurrence(day.month, day.day, today);
    const daysUntil = daysBetween(today, date);
    if (daysUntil <= daysAhead) {
      results.push({ ...day, daysUntil, date });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function getUpcomingSpecialDays(
  daysAhead = 14,
): Promise<UpcomingSpecialDay[]> {
  if (!process.env.DATABASE_URL) {
    return fromFallback(daysAhead);
  }

  try {
    const { db } = await import("@/lib/db");
    const days = await db.specialDay.findMany({
      where: {
        dateType: "fixed",
        month: { not: null },
        day: { not: null },
      },
    });

    const today = new Date();
    const results: UpcomingSpecialDay[] = [];

    for (const day of days) {
      if (!day.month || !day.day) continue;
      const date = getNextOccurrence(day.month, day.day, today);
      const daysUntil = daysBetween(today, date);
      if (daysUntil <= daysAhead) {
        results.push({
          id: day.id,
          name: day.name,
          nameBn: day.nameBn,
          category: day.category,
          month: day.month,
          day: day.day,
          description: day.description,
          daysUntil,
          date,
        });
      }
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  } catch {
    return fromFallback(daysAhead);
  }
}

export const categoryColors: Record<string, string> = {
  bd_national: "bg-green-100 text-green-800",
  international: "bg-blue-100 text-blue-800",
  religious: "bg-purple-100 text-purple-800",
  sports: "bg-orange-100 text-orange-800",
  personal: "bg-pink-100 text-pink-800",
};
