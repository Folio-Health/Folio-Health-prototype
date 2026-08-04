import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function RegistrationStepper({
  steps,
  currentStep,
}: {
  steps: string[]
  currentStep: number
}) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <li key={step} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  !isCompleted && !isCurrent && "border-border bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckIcon className="size-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "max-w-24 text-center text-xs font-medium",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                  index < currentStep ? "bg-primary" : "bg-border"
                )}
                style={{ marginBottom: "1.25rem" }}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export { RegistrationStepper }
