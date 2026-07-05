import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function DashboardHeader({
  title,
  description,
  badge,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-sm px-8 py-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {badge ? <Badge variant="info">{badge}</Badge> : null}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
