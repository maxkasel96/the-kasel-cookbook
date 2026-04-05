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
      "site-nav-link site-nav-link--prominent",
      isActive ? "site-nav-link--active" : "",
    ].join(" ");
  }

  return [
    "site-nav-link",
    isActive ? "site-nav-link--active" : "text-foreground",
  ].join(" ");
}

function getUtilityLinkClass(isActive: boolean) {
  return [
    "site-nav-link site-nav-link--utility",
    isActive ? "site-nav-link--active" : "",
  ].join(" ");
}

function getMobileLinkClass(item: NavItem, isActive: boolean) {
  if (item.isProminent) {
    return [
      "site-nav-link site-nav-link--prominent w-full justify-start rounded-[1.25rem] px-4 py-3",
      isActive ? "site-nav-link--active" : "",
    ].join(" ");
  }

  return [
    "site-nav-link w-full justify-start rounded-[1.1rem] px-4 py-3",
    isActive ? "site-nav-link--active" : "text-foreground",
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
    <header className="site-header px-6 py-5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-5">
        <Link className="site-brand" href="/recipes" onClick={closeMenu}>
          <span className="site-brand__eyebrow">Family Recipe Archive</span>
          <span className="site-brand__name">The Kasel Cookbook</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <nav
            aria-label="Primary"
            className="border-r border-border/60 pr-5"
          >
            <ul className="flex flex-wrap items-center gap-2">
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
            <ul className="flex flex-wrap items-center gap-1.5">
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
          className="site-menu-button flex items-center justify-center md:hidden"
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
        className={`site-mobile-overlay fixed inset-0 z-[1000] transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
        onClick={closeMenu}
      />
      <aside
        id="mobile-navigation"
        className={`site-mobile-panel fixed right-0 top-0 z-[1100] flex h-full w-[85vw] max-w-xs flex-col gap-6 overflow-y-auto px-6 py-6 transition-transform md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="site-section-label">Navigate</div>
            <div className="text-base font-semibold text-text-strong">Menu</div>
          </div>
          <button
            type="button"
            className="site-mobile-close px-3 py-1 text-sm font-medium"
            onClick={closeMenu}
          >
            Close
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <nav aria-label="Primary mobile" className="flex flex-col gap-3">
            <div className="site-section-label">Explore</div>
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
            className="border-t border-border/50 pt-5"
          >
            <div className="site-section-label mb-3">Account</div>
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
