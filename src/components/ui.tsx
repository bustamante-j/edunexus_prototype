import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "../lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "sm" | "md";
}) {
  return <button className={cn("button", `button--${variant}`, `button--${size}`, className)} {...props} />;
}

export function IconButton({
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={cn("icon-button", className)} aria-label={label} title={label} {...props} />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("select", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("field", className)}>
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("badge", `badge--${tone}`, className)}>
      {dot ? <span className="badge__dot" /> : null}
      {children}
    </span>
  );
}

export function Panel({
  title,
  meta,
  action,
  children,
  className,
  flush = false,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("panel", flush && "panel--flush", className)}>
      {title || meta || action ? (
        <header className="panel__header">
          <div>
            {meta ? <div className="panel__meta">{meta}</div> : null}
            {title ? <h2 className="panel__title">{title}</h2> : null}
          </div>
          {action ? <div className="panel__action">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("panel__body", flush && "panel__body--flush")}>{children}</div>
    </section>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="page-header__copy">
        {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}

export interface MetricItem {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
}

export function MetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <div className="metric-strip">
      {items.map((item) => (
        <div className={cn("metric-strip__item", item.tone && `metric-strip__item--${item.tone}`)} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </div>
      ))}
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          className={cn("segmented__button", value === option.value && "is-active")}
          aria-pressed={value === option.value}
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, tone = "info" }: { value: number; tone?: "neutral" | "info" | "success" | "warning" | "danger" }) {
  return (
    <div className="progress" aria-label={`${Math.round(value)} percent`}>
      <span className={`progress__bar progress__bar--${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Info size={22} />
      <strong>{title}</strong>
      <span>{detail}</span>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            className={cn("modal", `modal--${size}`)}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18 }}
          >
            <header className="modal__header">
              <div>
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <IconButton label="Close dialog" onClick={onClose}>
                <X size={18} />
              </IconButton>
            </header>
            <div className="modal__body">{children}</div>
            {footer ? <footer className="modal__footer">{footer}</footer> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function InlineNotice({
  tone,
  title,
  children,
}: {
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  children: ReactNode;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;
  return (
    <div className={cn("inline-notice", `inline-notice--${tone}`)}>
      <Icon size={18} />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function TableFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("table-frame", className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton", className)} />;
}
