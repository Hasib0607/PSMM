import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUpcomingSpecialDays, categoryColors } from "@/lib/special-days";

export default async function CalendarPage() {
  const upcomingDays = await getUpcomingSpecialDays(60);

  return (
    <>
      <DashboardHeader
        title="Calendar"
        description="Posting schedule and special days overlay"
      />
      <div className="space-y-6 p-8">
        <Card>
          <CardHeader>
            <CardTitle>Special Days — Next 60 Days</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingDays.map((day) => (
              <div key={day.id} className="rounded-lg border border-zinc-100 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{day.name}</p>
                    {day.nameBn ? (
                      <p className="text-sm text-zinc-600">{day.nameBn}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[day.category] ?? "bg-zinc-100 text-zinc-700"}`}
                  >
                    {day.category.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  {day.date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" · "}
                  {day.daysUntil === 0
                    ? "Today"
                    : day.daysUntil === 1
                      ? "Tomorrow"
                      : `${day.daysUntil} days`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
