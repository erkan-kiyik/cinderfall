import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { absoluteUrl } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: "Coseade AI — Optimize Your LinkedIn Profile with AI",
    template: "%s | Coseade AI",
  },
  description:
    "Get recruiter-ready in under 60 seconds. AI-powered LinkedIn profile analysis, ATS scoring, headline generation, and content creation.",
  keywords: [
    "LinkedIn optimization",
    "AI profile analyzer",
    "ATS score",
    "LinkedIn headline generator",
    "recruiter visibility",
    "career coach AI",
  ],
  authors: [{ name: "Coseade AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: absoluteUrl(),
    siteName: "Coseade AI",
    title: "Coseade AI — Optimize Your LinkedIn Profile with AI",
    description:
      "Get recruiter-ready in under 60 seconds. AI-powered LinkedIn profile analysis, ATS scoring, and content generation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coseade AI",
    description: "Optimize your LinkedIn profile with AI. Get recruiter-ready in under 60 seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
