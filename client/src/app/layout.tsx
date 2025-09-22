
// main layout component for the application
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout";
import AuthGuard from "@/components/AuthGuard";

// search engine optimization metadata for single parent support
export const metadata: Metadata = {
  metadataBase: new URL("https://oneparentvic.me"),
  title: "OneParent VIC",
  description: "Supporting single parents across Victoria",
  keywords: [
    "single parent",
    "single parents",
    "single parent victoria",
    "single parent australia", 
    "single parent support",
    "single parent resources",
    "single parent help",
    "single parent community",
    "single parent events",
    "single parent services",
    "single parent assistance",
    "single parent programs",
    "single parent benefits",
    "single parent groups",
    "single parent activities",
    "single parent family",
    "single parent children",
    "single parent advice",
    "single parent legal aid",
    "single parent financial support",
    "single parent housing",
    "single parent mental health",
    "single parent wellbeing",
    "parenting victoria",
    "parenting australia",
    "family support victoria",
    "family support australia",
    "childcare victoria",
    "childcare australia",
    "government support single parent",
    "centrelink single parent",
    "victoria single parent benefits",
    "melbourne single parent",
    "regional victoria single parent",
    "lone parent victoria",
    "lone parent australia",
    "solo parent victoria",
    "solo parent australia",
    "support for single mums victoria",
    "support for single dads victoria",
    "single mother victoria",
    "single father victoria",
    "single mum australia",
    "single dad australia",
    "victoria parenting help",
    "victoria family events",
    "victoria parent community"
  ],
  authors: [{ name: "OneParent VIC" }],
  openGraph: {
    title: "OneParent VIC",
    description: "Making life easier for single parents across Victoria - Whether you have just began your journey as a single parent or already navigating through it, our platform offers simple tools and features to help make everyday life a little easier.",
    url: "https://oneparentvic.me",
    siteName: "OneParent VIC",
    images: [
      {
        url: "/opvic-og.png",
        width: 1200,
        height: 630,
        alt: "OneParent VIC",
      },
    ],
    locale: "en_AU",
    type: "website",
  },
  icons: {
    icon: ["/favicon.ico?v=3"],
    shortcut: ["/favicon.ico?v=3"],
    apple: ["/favicon.ico?v=3"],
  },
};

// browser viewport settings for theme color
export const viewport: Viewport = {
  themeColor: "#1e2430",
};

// root layout providing html structure and navigation
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://oneparentvic.me" />
        <link rel="icon" href="/favicon.ico?v=3" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=3" />
        <meta name="msapplication-TileImage" content="/favicon.ico?v=3" />
      </head>
      <body>
        <AuthGuard>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </AuthGuard>
      </body>
    </html>
  );
}
