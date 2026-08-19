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
  const letters = initials(name)
  return (
    <Avatar size={size} className={cn(className)}>
      {/* Only the already-local initials are sent to the avatar service, never
          the real name or `seed` (often a patient/staff id) — the "initials"
          style just draws whatever text it's given, so this keeps the exact
          same visual without a real person's name leaving the origin. */}
      <AvatarImage src={avatarUrl(letters, color)} alt={name} />
      <AvatarFallback>{letters}</AvatarFallback>
    </Avatar>
  )
}

export { PersonAvatar }
