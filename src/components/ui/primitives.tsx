import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function Button<T extends ElementType = "button">({
  as,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = as ?? "button";

  return (
    <Component
      className={cx(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function IconButton<T extends ElementType = "button">({
  as,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: PolymorphicProps<T>) {
  const Component = as ?? "button";

  return (
    <Component
      className={cx(
        "ui-icon-button",
        `ui-button--${variant}`,
        `ui-icon-button--${size}`,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function PageShell({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "wide" | "detail" | "editor";
  className?: string;
}) {
  return (
    <main className={cx("ui-page-shell", `ui-page-shell--${variant}`, className)}>
      {children}
    </main>
  );
}

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("ui-page-header", className)}>
      <div className="ui-page-header__copy">
        {kicker ? <p className="ui-kicker">{kicker}</p> : null}
        <h1 className="ui-page-title">{title}</h1>
        {subtitle ? <div className="ui-page-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="ui-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "sunken";
}) {
  return <section className={cx("ui-panel", `ui-panel--${tone}`, className)}>{children}</section>;
}

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: "neutral" | "primary" | "success" | "warning" | "danger";
  className?: string;
}) {
  return (
    <span className={cx("ui-badge", `ui-badge--${variant}`, className)}>
      {children}
    </span>
  );
}

export function MetadataPill({
  icon,
  label,
  value,
  className,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("ui-metadata-pill", className)}>
      {icon ? <span className="ui-metadata-pill__icon">{icon}</span> : null}
      <span>
        <span className="ui-metadata-pill__label">{label}</span>
        <span className="ui-metadata-pill__value">{value}</span>
      </span>
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("ui-empty-state", className)}>
      {icon ? <div className="ui-empty-state__icon">{icon}</div> : null}
      <h2>{title}</h2>
      {children ? <div className="ui-empty-state__copy">{children}</div> : null}
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("ui-skeleton", className)} aria-hidden="true" />;
}
