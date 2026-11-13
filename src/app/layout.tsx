import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// next/font downloads these at build time and serves them from our own origin.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Queue Manager", template: "%s | Queue Manager" },
  description: "Run walk-in queues: issue tokens, reorder, serve and see wait-time analytics.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#121318" },
  ],
};

// Runs before first paint so a saved Light/Dark choice never flashes the other theme.
const themeScript = `try{var t=localStorage.getItem("qm-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!bg-ink !text-bg !rounded-md !shadow-none !font-sans !border-0",
              description: "!text-bg/80",
              actionButton: "!bg-transparent !text-bg !font-semibold !underline",
            },
          }}
        />
      </body>
    </html>
  );
}
