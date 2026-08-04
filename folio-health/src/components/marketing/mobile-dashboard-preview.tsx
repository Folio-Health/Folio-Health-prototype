import {
  UsersIcon,
  CalendarDaysIcon,
  BedDoubleIcon,
  TrendingUpIcon,
  HomeIcon,
  ActivityIcon,
  UserRoundIcon,
  WifiIcon,
  SignalIcon,
  BatteryFullIcon,
} from "lucide-react"
import { LogoMark } from "@/components/common/logo"

const TILES = [
  { label: "Patients", value: "128", icon: UsersIcon, tone: "text-primary bg-primary/10" },
  { label: "Appts", value: "86", icon: CalendarDaysIcon, tone: "text-violet-600 bg-violet-500/10 dark:text-violet-400" },
  { label: "Admissions", value: "24", icon: BedDoubleIcon, tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400" },
  { label: "Revenue", value: "12.4M", icon: TrendingUpIcon, tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400" },
]

const BARS = [40, 65, 50, 80, 60, 35, 55]

function MobileDashboardPreview() {
  return (
    <div className="flex h-full flex-col bg-background pt-8">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 pt-1 text-[9px] font-semibold text-foreground">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <SignalIcon className="size-2.5" />
          <WifiIcon className="size-2.5" />
          <BatteryFullIcon className="size-3" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <LogoMark size={16} />
          <span className="text-[11px] font-semibold text-foreground">Dashboard</span>
        </div>
        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRoundIcon className="size-3" />
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-1.5 px-3">
        {TILES.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-border bg-card p-2">
            <span className={`mb-1 flex size-4.5 items-center justify-center rounded-md ${tile.tone}`}>
              <tile.icon className="size-2.5" />
            </span>
            <p className="text-[11px] font-semibold text-foreground">{tile.value}</p>
            <p className="text-[8px] text-muted-foreground">{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Mini chart card */}
      <div className="mx-3 mt-1.5 rounded-lg border border-border bg-card p-2">
        <p className="mb-1.5 text-[9px] font-medium text-foreground">Visits this week</p>
        <div className="flex h-10 items-end gap-1">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-sm bg-primary/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom tab bar */}
      <div className="flex items-center justify-around border-t border-border bg-card py-2">
        <HomeIcon className="size-3.5 text-primary" />
        <UsersIcon className="size-3.5 text-muted-foreground" />
        <ActivityIcon className="size-3.5 text-muted-foreground" />
        <UserRoundIcon className="size-3.5 text-muted-foreground" />
      </div>
    </div>
  )
}

export { MobileDashboardPreview }
