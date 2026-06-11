"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icons";

/** Marmite. wordmark with the accent dot. */
export function Brand({ size = 21 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-accent text-white shadow-card">
        <Icon name="chef" size={20} />
      </span>
      <span className="font-display text-[21px] font-semibold" style={{ fontSize: size }}>
        Marmite<span className="text-accent">.</span>
      </span>
    </span>
  );
}

const NAV = [
  { label: "Accueil", href: "/" },
  { label: "Recettes", href: "/recettes" },
  { label: "Saisons", href: "/saisons" },
];

/** Active state: exact match for the home, prefix match for the rest. */
function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // While the drawer is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/[0.88] backdrop-blur-[12px]">
      <div className="mx-auto flex h-[68px] w-full max-w-content items-center gap-3 px-[18px] sm:gap-7 sm:px-8">
        <Link href="/" className="shrink-0">
          <Brand />
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-2 text-[14.5px] font-semibold transition ${
                  active
                    ? "bg-accent-soft text-accent-ink"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <Link
          href="/recettes"
          className="hidden items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[14px] font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink sm:inline-flex"
        >
          <Icon name="search" size={17} /> Rechercher
        </Link>
        {/* Create CTA: full pill on desktop, icon-only on mobile to save room. */}
        <Link
          href="/recettes/nouvelle"
          aria-label="Créer une recette"
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-full bg-accent px-0 text-[14px] font-semibold text-white shadow-card transition hover:bg-accent-deep active:translate-y-px sm:h-auto sm:px-4 sm:py-2.5 max-sm:w-[42px]"
        >
          <Icon name="plus" size={17} />
          <span className="hidden sm:inline">Créer une recette</span>
        </Link>

        {/* Burger — mobile only; the nav above is hidden below `sm`. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-ink-faint hover:text-ink sm:hidden"
        >
          <Icon name="menu" size={20} />
        </button>
      </div>

      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMenuOpen(false);
          }}
          className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px] sm:hidden"
        >
          <div className="animate-slide-in flex h-full w-[min(82vw,320px)] flex-col bg-bg shadow-card-lg">
            <div className="flex h-[68px] items-center justify-between border-b border-line-soft px-5">
              <Brand size={19} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="grid h-[38px] w-[38px] place-items-center rounded-full bg-surface text-ink shadow-card transition hover:text-accent"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`rounded-input px-4 py-3 text-[16px] font-semibold transition ${
                      active
                        ? "bg-accent-soft text-accent-ink"
                        : "text-ink-soft hover:bg-surface-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/recettes"
                onClick={closeMenu}
                className="mt-2 flex items-center gap-2.5 rounded-input border border-line bg-surface px-4 py-3 text-[15px] font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink"
              >
                <Icon name="search" size={18} /> Rechercher une recette
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
