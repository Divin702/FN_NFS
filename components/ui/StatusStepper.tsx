import { Fragment } from "react";
import { Check, X as XIcon, Clock } from "lucide-react";
import { cn } from "@/lib/cn";

export type StepState = "done" | "current" | "upcoming" | "declined" | "cancelled";

export interface StepItem {
  label: string;
  sub?: string;
  state: StepState;
}

function circleClasses(state: StepState) {
  switch (state) {
    case "done":
      return "bg-emerald-500 border-emerald-500 text-white";
    case "current":
      return "bg-amber-50 border-amber-400 text-amber-500";
    case "declined":
      return "bg-red-500 border-red-500 text-white";
    case "cancelled":
      return "bg-gray-400 border-gray-400 text-white";
    default:
      return "bg-white border-gray-300 text-gray-300";
  }
}

function CircleIcon({ state }: { state: StepState }) {
  if (state === "declined" || state === "cancelled") return <XIcon size={13} />;
  if (state === "current") return <Clock size={12} />;
  return <Check size={13} />;
}

/** Color of the connector that follows a step, based on the NEXT step's state. */
function lineClass(next?: StepState) {
  if (!next) return "bg-gray-200";
  if (next === "done") return "bg-emerald-300";
  if (next === "declined") return "bg-red-200";
  if (next === "cancelled") return "bg-gray-300";
  return "bg-gray-200";
}

export function StatusStepper({ steps }: { steps: StepItem[] }) {
  return (
    <>
      {/* Mobile: vertical timeline */}
      <ol className="sm:hidden flex flex-col">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0",
                    circleClasses(s.state),
                  )}
                >
                  <CircleIcon state={s.state} />
                </span>
                {!last && (
                  <span className={cn("w-0.5 flex-1 my-1 rounded-full", lineClass(steps[i + 1]?.state))} />
                )}
              </div>
              <div className={cn(!last && "pb-3")}>
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    s.state === "upcoming" ? "text-gray-400" : "text-gray-800",
                  )}
                >
                  {s.label}
                </p>
                {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop: horizontal stepper */}
      <ol className="hidden sm:flex items-start">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          return (
            <Fragment key={i}>
              <li className="flex flex-col items-center text-center w-20 shrink-0">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2",
                    circleClasses(s.state),
                  )}
                >
                  <CircleIcon state={s.state} />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold mt-1.5",
                    s.state === "upcoming" ? "text-gray-400" : "text-gray-800",
                  )}
                >
                  {s.label}
                </span>
                {s.sub && (
                  <span className="text-[9px] text-gray-400 leading-tight mt-0.5">{s.sub}</span>
                )}
              </li>
              {!last && (
                <span className={cn("h-0.5 flex-1 mt-3.5 rounded-full", lineClass(steps[i + 1]?.state))} />
              )}
            </Fragment>
          );
        })}
      </ol>
    </>
  );
}
