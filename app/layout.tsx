import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Recipe Manager", template: "%s · Recipe Manager" },
  description: "Gestion de recettes de cuisine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // lang="fr": the app is in French (accessibility/SEO).
  // suppressHydrationWarning on <html> AND <body>: extensions
  // (translation, ColorZilla, Grammarly…) rewrite lang / style on <html>
  // or inject attributes on <body> after server rendering, causing a false
  // hydration mismatch. The option only acts at the level of the tag where it
  // is set; children are still checked normally.
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <div className="flex-1">{children}</div>
        {/* Global footer: current year + app version (APP_RELEASE = git tag). */}
        <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          © {new Date().getFullYear()} — Release: {process.env.APP_RELEASE ?? "dev"}
        </footer>
      </body>
    </html>
  );
}
