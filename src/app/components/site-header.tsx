"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavMatch = "exact" | "prefix";

type NavItem = {
  label: string;
  href: string;
  match: NavMatch;
  isProminent?: boolean;
};

const primaryNavigation: NavItem[] = [
  { label: "Recipes", href: "/recipes", match: "prefix" },
  { label: "Meals", href: "/meals", match: "prefix" },
  { label: "Shopping List", href: "/shopping-list", match: "exact" },
  { label: "Favorites", href: "/favorites", match: "exact" },
  {
    label: "Create Recipe",
    href: "/admin/recipes/create",
    match: "exact",
    isProminent: true,
  },
];

const utilityNavigation: NavItem[] = [
  { label: "Households", href: "/households", match: "exact" },
  { label: "Access", href: "/admin/access", match: "exact" },
  { label: "Login", href: "/login", match: "exact" },
];

function isActivePath(pathname: string, item: NavItem) {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getDesktopLinkClass(item: NavItem, isActive: boolean) {
  if (item.isProminent) {
    return [
      "rounded-full border px-4 py-2 text-sm font-semibold transition",
      isActive
        ? "border-border-strong bg-accent text-surface shadow-[3px_3px_0_var(--color-border-strong)]"
        : "border-border bg-accent text-surface hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-border)]",
    ].join(" ");
  }

  return [
    "rounded-full border px-3 py-1.5 text-sm font-medium transition",
    isActive
      ? "border-border bg-surface-2 text-foreground"
      : "border-transparent text-foreground hover:border-border hover:bg-surface-2",
  ].join(" ");
}

function getUtilityLinkClass(isActive: boolean) {
  return [
    "rounded-full border px-3 py-1.5 text-sm transition",
    isActive
      ? "border-border bg-surface text-foreground"
      : "border-transparent text-text-muted hover:border-border hover:bg-surface hover:text-foreground",
  ].join(" ");
}

function getMobileLinkClass(item: NavItem, isActive: boolean) {
  if (item.isProminent) {
    return [
      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
      isActive
        ? "border-border-strong bg-accent text-surface shadow-[3px_3px_0_var(--color-border-strong)]"
        : "border-border bg-accent text-surface hover:bg-accent/90",
    ].join(" ");
  }

  return [
    "rounded-xl border px-3 py-2 text-sm font-medium transition",
    isActive
      ? "border-border bg-surface-2 text-foreground"
      : "border-transparent text-foreground hover:border-border hover:bg-surface-2",
  ].join(" ");
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="relative z-[1000] border-b border-border bg-surface/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <Link
          className="text-lg font-semibold transition hover:text-link"
          href="/recipes"
        >
          The Kasel Cookbook
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <nav aria-label="Primary" className="border-r border-border/70 pr-4">
            <ul className="flex flex-wrap items-center gap-3">
              {primaryNavigation.map((item) => {
                const isActive = isActivePath(pathname, item);

                return (
                  <li key={item.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={getDesktopLinkClass(item, isActive)}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <nav aria-label="Utility">
            <ul className="flex flex-wrap items-center gap-2">
              {utilityNavigation.map((item) => {
                const isActive = isActivePath(pathname, item);

                return (
                  <li key={item.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={getUtilityLinkClass(isActive)}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-surface-2 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={toggleMenu}
        >
          <span className="sr-only">Open menu</span>
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </div>
        </button>
      </div>
      <div
        className={`fixed inset-0 z-[1000] bg-black/40 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
        onClick={closeMenu}
      />
      <aside
        id="mobile-navigation"
        className={`fixed right-0 top-0 z-[1100] flex h-full w-[85vw] max-w-xs flex-col gap-6 overflow-y-auto border-l border-border bg-background px-6 py-6 shadow-xl transition-transform md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">Menu</div>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-sm font-medium transition hover:bg-surface-2"
            onClick={closeMenu}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <nav aria-label="Primary mobile" className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">
              Explore
            </div>
            {primaryNavigation.map((item) => {
              const isActive = isActivePath(pathname, item);

              return (
                <Link
                  key={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={getMobileLinkClass(item, isActive)}
                  href={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <nav
            aria-label="Utility mobile"
            className="border-t border-border/70 pt-5"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-text-muted">
              Account
            </div>
            <div className="flex flex-col gap-2">
              {utilityNavigation.map((item) => {
                const isActive = isActivePath(pathname, item);

                return (
                  <Link
                    key={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={getUtilityLinkClass(isActive)}
                    href={item.href}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </header>
  );
}
