"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Recipes", href: "/recipes" },
  { label: "Login", href: "/login" },
];

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="relative z-50 border-b border-border bg-surface/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <div className="text-lg font-semibold">The Kasel Cookbook</div>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex flex-wrap gap-3 text-sm font-medium">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  className="rounded-full border border-transparent px-3 py-1 transition hover:border-border hover:bg-surface-2"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
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
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
        onClick={closeMenu}
      />
      <aside
        id="mobile-navigation"
        className={`fixed right-0 top-0 z-50 flex h-full w-[85vw] max-w-xs flex-col gap-6 overflow-y-auto border-l border-border bg-background px-6 py-6 shadow-xl transition-transform md:hidden ${
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
        <nav aria-label="Mobile" className="flex flex-col gap-3">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition hover:border-border hover:bg-surface-2"
              href={item.href}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </header>
  );
}
