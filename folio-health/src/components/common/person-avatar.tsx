import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarUrl } from "@/lib/images"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

function PersonAvatar({
  name,
  seed,
  size = "default",
  className,
  color,
}: {
  name: string
  seed?: string
  size?: "sm" | "default" | "lg"
  className?: string
  color?: string
}) {
  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarImage src={avatarUrl(seed ?? name, color)} alt={name} />
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

export { PersonAvatar }
