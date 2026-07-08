import { cn } from "@/lib/utils";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = "so với tuần trước",
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-100",
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
      {/* Icon on Left */}
      <div className={cn("rounded-2xl p-4 shrink-0 flex items-center justify-center", iconBg)}>
        <Icon className={cn("h-6 w-6", iconColor)} />
      </div>

      {/* Stats details on Right */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span
              className={cn(
                "text-xs font-bold flex items-center",
                isPositive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(change)}%
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">{changeLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
