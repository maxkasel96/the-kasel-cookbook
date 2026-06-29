"use client";

import {
  BookOpen,
  ChefHat,
  Heart,
  Home,
  Menu,
  Plus,
  Settings,
  Soup,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ComponentType } from "react";
import { createPortal } from "react-dom";

type NavMatch = "exact" | "prefix";

type NavItem = {
  label: string;
  href: string;
  match: NavMatch;
  icon: ComponentType<{ className?: string }>;
  isProminent?: boolean;
};

const primaryNavigation: NavItem[] = [
  { label: "Recipes", href: "/recipes", match: "prefix", icon: BookOpen },
  { label: "Favorites", href: "/favorites", match: "exact", icon: Heart },
  { label: "Meals", href: "/meals", match: "prefix", icon: Soup },
];

const utilityNavigation: NavItem[] = [
  {
    label: "Create Recipe",
    href: "/admin/recipes/create",
    match: "exact",
    icon: Plus,
    isProminent: true,
  },
  { label: "Manage Recipes", href: "/admin/recipes", match: "exact", icon: Settings },
  { label: "Recipe Input", href: "/recipe-input", match: "exact", icon: ChefHat },
  { label: "Households", href: "/households", match: "exact", icon: Users },
  { label: "Access", href: "/admin/access", match: "exact", icon: Settings },
  { label: "Login", href: "/login", match: "exact", icon: Home },
];

function isActivePath(pathname: string, item: NavItem) {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({
  item,
  pathname,
  onClick,
  mobile = false,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const Icon = mobile ? item.icon : null;
  const isActive = isActivePath(pathname, item);
  const className = mobile
    ? [
        "site-mobile-tab",
        isActive ? "site-mobile-tab--active" : "",
      ].join(" ")
    : [
        "site-nav-link",
        item.isProminent ? "site-nav-link--prominent" : "",
        isActive ? "site-nav-link--active" : "",
      ].join(" ");

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={className}
      href={item.href}
      onClick={onClick}
    >
      {Icon ? <Icon className="site-nav-icon" aria-hidden="true" /> : null}
      <span>{item.label}</span>
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);
  const isUtilityActive = utilityNavigation.some((item) =>
    isActivePath(pathname, item)
  );

  const mobileMenu =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              type="button"
              className="site-mobile-overlay fixed inset-0 z-[2000] opacity-100 lg:hidden"
              aria-hidden="true"
              tabIndex={-1}
              onClick={closeMenu}
            />
            <aside
              id="mobile-navigation"
              className="site-mobile-panel fixed right-0 top-0 z-[2010] flex h-full w-[88vw] max-w-sm flex-col gap-6 overflow-y-auto px-5 py-6 lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="site-brand__eyebrow">Private Kitchen OS</div>
                  <div className="truncate text-lg font-bold text-text-strong">
                    The Kasel Cookbook
                  </div>
                </div>
                <button
                  type="button"
                  className="site-mobile-icon-button"
                  aria-label="Close navigation menu"
                  onClick={closeMenu}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Mobile menu" className="flex flex-col gap-5">
                <div>
                  <p className="site-mobile-section-label">Cooking</p>
                  <div className="mt-2 grid gap-2">
                    {primaryNavigation.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onClick={closeMenu}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="site-mobile-section-label">Manage</p>
                  <div className="mt-2 grid gap-2">
                    {utilityNavigation.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onClick={closeMenu}
                      />
                    ))}
                  </div>
                </div>
              </nav>
            </aside>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <header className="site-header px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link className="site-brand" href="/recipes" onClick={closeMenu}>
            <span className="site-brand__eyebrow">Private Kitchen OS</span>
            <span className="site-brand__name">The Kasel Cookbook</span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1.5">
              {primaryNavigation.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} pathname={pathname} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <NavLink item={utilityNavigation[0]} pathname={pathname} />
            <div className="site-nav-menu">
              <details>
                <summary
                  className={[
                    "site-nav-link site-nav-menu__trigger",
                    isUtilityActive ? "site-nav-link--active" : "",
                  ].join(" ")}
                >
                  <span>Manage</span>
                </summary>
                <div className="site-nav-menu__panel">
                  {utilityNavigation.slice(1).map((item) => {
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
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>

          <button
            type="button"
            className="site-menu-button flex items-center justify-center lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen(true)}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
        {mobileMenu}
      </header>

      <nav className="site-bottom-nav lg:hidden" aria-label="Primary mobile">
        {primaryNavigation.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            mobile
          />
        ))}
      </nav>
    </>
  );
}
