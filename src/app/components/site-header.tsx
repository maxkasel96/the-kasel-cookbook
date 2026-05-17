"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

type NavMatch = "exact" | "prefix";

type NavItem = {
  label: string;
  href: string;
  match: NavMatch;
  isProminent?: boolean;
};

const navigation: NavItem[] = [
  { label: "Recipes", href: "/recipes", match: "prefix" },
  {
    label: "Create Recipe",
    href: "/admin/recipes/create",
    match: "exact",
    isProminent: true,
  },
];

const secondaryNavigation: NavItem[] = [
  { label: "Favorites", href: "/favorites", match: "exact" },
  { label: "Meals", href: "/meals", match: "prefix" },
  { label: "Shopping List", href: "/shopping-list", match: "exact" },
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

export default function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isSecondaryActive = secondaryNavigation.some((item) =>
    isActivePath(pathname, item),
  );

  const closeMenu = () => {
    setIsOpen(false);
  };

  const mobileMenu =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="site-mobile-overlay fixed inset-0 z-[2000] opacity-100 sm:hidden"
              aria-hidden="true"
              tabIndex={-1}
              onClick={closeMenu}
            />
            <aside
              id="mobile-navigation"
              className="site-mobile-panel fixed right-0 top-0 z-[2010] flex h-full w-[86vw] max-w-xs flex-col gap-6 overflow-y-auto px-5 py-6 sm:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="site-brand__eyebrow">Menu</div>
                  <div className="truncate text-base font-semibold text-text-strong">
                    The Kasel Cookbook
                  </div>
                </div>
                <button
                  type="button"
                  className="site-mobile-close"
                  aria-label="Close navigation menu"
                  onClick={closeMenu}
                >
                  Close
                </button>
              </div>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  {navigation.map((item) => {
                    const isActive = isActivePath(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`${getDesktopLinkClass(item, isActive)} w-full justify-start`}
                        href={item.href}
                        onClick={closeMenu}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-border/60 pt-5">
                  <div className="flex flex-col gap-2">
                    {secondaryNavigation.map((item) => {
                      const isActive = isActivePath(pathname, item);

                      return (
                        <Link
                          key={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={[
                            "site-nav-menu__link",
                            isActive ? "site-nav-menu__link--active" : "",
                          ].join(" ")}
                          href={item.href}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>
            </aside>
          </>,
          document.body,
        )
      : null;

  return (
    <header className="site-header px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link className="site-brand" href="/recipes" onClick={closeMenu}>
          <span className="site-brand__eyebrow">Family Recipe Archive</span>
          <span className="site-brand__name">The Kasel Cookbook</span>
        </Link>
        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex flex-wrap items-center gap-2">
            {navigation.map((item) => {
              const isActive = isActivePath(pathname, item);

              return (
                <li key={item.href}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={`${getDesktopLinkClass(item, isActive)} w-full sm:w-auto`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="site-nav-menu">
              <details>
                <summary
                  className={[
                    "site-nav-link site-nav-menu__trigger",
                    isSecondaryActive ? "site-nav-link--active" : "",
                  ].join(" ")}
                >
                  Menu
                </summary>
                <div className="site-nav-menu__panel">
                  {secondaryNavigation.map((item) => {
                    const isActive = isActivePath(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={[
                          "site-nav-menu__link",
                          isActive ? "site-nav-menu__link--active" : "",
                        ].join(" ")}
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </details>
            </li>
          </ul>
        </nav>
        <button
          type="button"
          className="site-menu-button flex items-center justify-center sm:hidden"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <span className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </div>
      {mobileMenu}
    </header>
  );
}
