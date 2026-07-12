import { cn } from "../lib/utils";

export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className={cn("brand", compact && "brand--compact", inverse && "brand--inverse")}>
      <span className="brand__mark">
        <img src="/assets/edunexus-mark.png" alt="" />
      </span>
      {!compact ? (
        <span className="brand__wordmark">
          <strong>EduNexus</strong>
          <small>Learner Records System</small>
        </span>
      ) : null}
    </div>
  );
}

