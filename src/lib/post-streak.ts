import { db } from "@/lib/db";
import { toLocalDateString } from "@/lib/dates";

/** Record daily content activity (draft created) for streak tracking. */
export async function recordContentActivity(userId: string): Promise<void> {
  const todayStr = toLocalDateString();
  const today = new Date(`${todayStr}T00:00:00`);

  const existing = await db.postStreak.findUnique({
    where: { userId },
  });

  if (!existing) {
    await db.postStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastPostDate: today,
      },
    });
    return;
  }

  if (existing.lastPostDate) {
    const lastStr = toLocalDateString(existing.lastPostDate);
    if (lastStr === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    const nextStreak = lastStr === yesterdayStr ? existing.currentStreak + 1 : 1;
    const longestStreak = Math.max(existing.longestStreak, nextStreak);

    await db.postStreak.update({
      where: { userId },
      data: {
        currentStreak: nextStreak,
        longestStreak,
        lastPostDate: today,
      },
    });
    return;
  }

  await db.postStreak.update({
    where: { userId },
    data: {
      currentStreak: 1,
      longestStreak: Math.max(existing.longestStreak, 1),
      lastPostDate: today,
    },
  });
}
