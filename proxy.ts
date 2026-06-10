import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mode maintenance (Next 16 : "Proxy", ex-Middleware). Quand APP_MAINTENANCE="true",
// toute requête renvoie une page 503 « En construction » — sauf bypass propriétaire.
// Piloté par env : true uniquement sur la Production Vercel ; off en Preview/local.
// (L'env du proxy est résolu au build Edge → toggler APP_MAINTENANCE demande un redeploy.)

const BYPASS_COOKIE = "mnt_bypass";

const MAINTENANCE_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>En construction</title>
<style>
  :root { color-scheme: light dark; }
  html, body { height: 100%; margin: 0; }
  body {
    display: flex; align-items: center; justify-content: center;
    min-height: 100%; padding: 24px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: #fafafa; color: #18181b;
  }
  @media (prefers-color-scheme: dark) { body { background: #0a0a0a; color: #ededed; } }
  main { text-align: center; max-width: 32rem; }
  .emoji { font-size: 3rem; line-height: 1; }
  h1 { font-size: 1.5rem; font-weight: 600; margin: 1rem 0 0.5rem; }
  p { margin: 0; color: #71717a; }
</style>
</head>
<body>
  <main>
    <div class="emoji">🚧</div>
    <h1>En construction</h1>
    <p>Le site est en cours de préparation. Revenez bientôt&nbsp;!</p>
  </main>
</body>
</html>`;

export function proxy(request: NextRequest) {
  // Hors maintenance → laisser passer.
  if (process.env.APP_MAINTENANCE !== "true") {
    return NextResponse.next();
  }

  const bypassSecret = process.env.APP_MAINTENANCE_BYPASS;

  // Bypass déjà accordé (cookie posé précédemment).
  if (bypassSecret && request.cookies.get(BYPASS_COOKIE)?.value === bypassSecret) {
    return NextResponse.next();
  }

  // Demande de bypass via ?unlock=<secret> → pose le cookie et nettoie l'URL.
  const unlock = request.nextUrl.searchParams.get("unlock");
  if (bypassSecret && unlock === bypassSecret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("unlock");
    const res = NextResponse.redirect(url);
    res.cookies.set(BYPASS_COOKIE, bypassSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });
    return res;
  }

  // Sinon : page 503 « En construction ».
  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "Retry-After": "3600",
      "Cache-Control": "no-store",
    },
  });
}

// S'applique à toutes les routes sauf les assets internes Next et le favicon.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
