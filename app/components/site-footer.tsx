import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SETTINGS_NAV } from "../parametres/_nav";
import { Egg } from "./Logo";

const SAISONS_LINKS = [
  { label: "Ce mois-ci", href: "/saisons" },
  { label: "Toute l'année", href: "/saisons?m=1,2,3,4,5,6,7,8,9,10,11,12" },
  { label: "Printemps", href: "/saisons?m=3,4,5,6" },
  { label: "Été", href: "/saisons?m=6,7,8,9" },
  { label: "Automne", href: "/saisons?m=9,10,11,12" },
  { label: "Hiver", href: "/saisons?m=12,1,2,3" },
];

export async function SiteFooter() {
  const release = process.env.APP_RELEASE ?? "dev";
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return (
    // footer-chrome: #101012 in dark, var(--color-surface) in light (see globals.css)
    <footer className="footer-chrome mt-14 border-t border-line-soft">
      {/* Mega sitemap — 4 cols: [brand] [Recettes] [Saisons] [Paramètres] */}
      <div className="foot-mega">
        {/* Col 1 — brand lockup: egg (square, 24cqw) + wordmark + baseline */}
        <div className="foot-intro">
          <div className="foot-egg" aria-hidden="true">
            <Egg size={96} />
          </div>
          <div className="foot-lockup">
            <span className="foot-brand-name" aria-hidden="true">Sur le Plat</span>
            <span className="foot-tag">Vos recettes dans une même coquille</span>
          </div>
        </div>

        {/* Col 2 — Recettes */}
        <div>
          <Link href="/recettes" className="foot-col-h">
            Recettes
          </Link>
          {categories.length === 0 ? (
            <p className="text-[13.5px] text-ink-faint">Aucune catégorie</p>
          ) : (
            <ul className="foot-col-list">
              {categories.map((c) => (
                <li key={c.name}>
                  <Link href={`/recettes?cat=${encodeURIComponent(c.name)}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Col 3 — Saisons */}
        <div>
          <Link href="/saisons" className="foot-col-h">
            Saisons
          </Link>
          <ul className="foot-col-list">
            {SAISONS_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Paramètres (groups from SETTINGS_NAV) */}
        <div>
          <Link href="/parametres" className="foot-col-h">
            Paramètres
          </Link>
          <div className="foot-col-groups">
            {SETTINGS_NAV.map((g) => (
              <div key={g.group}>
                <p className="foot-col-glabel">{g.group}</p>
                <ul className="foot-col-list">
                  {g.items.map((it) => (
                    <li key={it.slug}>
                      <Link href={`/parametres/${it.slug}`}>{it.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom strip — copyright + release, single line, left-aligned */}
      <div className="foot-strip">
        <div className="foot-strip-meta">
          <p>© {new Date().getFullYear()} Sur le Plat. Tous droits réservés.</p>
          <span className="rounded-md bg-surface-muted px-2.5 py-1 font-mono text-[12px] text-ink-faint">
            Release {release}
          </span>
        </div>
      </div>
    </footer>
  );
}
