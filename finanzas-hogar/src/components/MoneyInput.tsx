import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { parseCOPInput } from "@/lib/utils"

interface Props {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  id?: string
  className?: string
  autoFocus?: boolean
}

function format(n: number): string {
  if (!n) return ""
  return new Intl.NumberFormat("es-CO").format(n)
}

export function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  id,
  className,
  autoFocus,
}: Props) {
  const [text, setText] = useState<string>(format(value))
  useEffect(() => {
    setText(format(value))
  }, [value])
  return (
    <div className={"relative " + (className ?? "")}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoFocus={autoFocus}
        className="pl-7 font-mono"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value
          const parsed = parseCOPInput(raw)
          setText(raw === "" ? "" : format(parsed))
          onChange(parsed)
        }}
      />
    </div>
  )
}
