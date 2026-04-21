import * as Icons from "lucide-react"
import { cn } from "@/lib/utils"

type IconName = keyof typeof Icons

interface Props {
  name?: string
  color?: string
  size?: number
  className?: string
}

export function CategoryIcon({
  name,
  color = "#6b7280",
  size = 18,
  className,
}: Props) {
  const iconKey = (name && (name in Icons) ? name : "Tag") as IconName
  const Comp = Icons[iconKey] as React.FC<{ size?: number; color?: string; className?: string }>
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        className,
      )}
      style={{
        width: size + 14,
        height: size + 14,
        backgroundColor: `${color}20`,
      }}
    >
      <Comp size={size} color={color} />
    </span>
  )
}
