import { MobileSidebar } from "@/components/navigation/mobile-sidebar"
import { GlobalSearch } from "@/components/navigation/global-search"
import { QuickActionButton } from "@/components/navigation/quick-action-button"
import { NotificationCenter } from "@/components/navigation/notification-center"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { ProfileMenu } from "@/components/navigation/profile-menu"

function AppTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <MobileSidebar />
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1.5">
        <QuickActionButton />
        <NotificationCenter />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" />
        <ProfileMenu />
      </div>
    </header>
  )
}

export { AppTopbar }
