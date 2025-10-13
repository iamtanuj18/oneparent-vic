
// main layout component for the application
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components/layout";
import AuthGuard from "@/components/AuthGuard";

// search engine optimization metadata for single parent support
export const metadata: Metadata = {
  metadataBase: new URL("https://oneparentvic.me"),
  title: "OneParent VIC",
  description: "Practical tools and support for single parents across Victoria, Australia. Find community connections, track emotions, plan activities, and navigate your single parenting journey with confidence.",
  keywords: [
    "single parent victoria",
    "single parent melbourne", 
    "single parent australia",
    "single parent support victoria",
    "single parent resources melbourne",
    "single parent help australia",
    "single parent community victoria",
    "single parent services melbourne",
    "single parent assistance victoria",
    "single parent benefits australia",
    "single parent activities melbourne",
    "single parent housing victoria",
    "single parent mental health melbourne",
    "single parent wellbeing victoria",
    "single mum victoria",
    "single dad melbourne",
    "single mother australia",
    "single father victoria",
    "lone parent melbourne",
    "solo parent victoria",
    "single parent tools",
    "single parent app australia",
    "single parent emotional support",
    "single parent community matching",
    "single parent activity planner",
    "single parent journey map",
    "single parent time management",
    "single parent playdate planner",
    "centrelink single parent",
    "government support single parent victoria",
    "family support services melbourne",
    "parenting support victoria",
    "childcare support melbourne",
    "regional victoria single parent",
    "geelong single parent",
    "ballarat single parent",
    "bendigo single parent",
    "single parent groups melbourne",
    "single parent events victoria",
    "single parent financial help australia"
  ],
  authors: [{ name: "OneParent VIC" }],
  openGraph: {
    title: "OneParent VIC",
    description: "Making life easier for single parents across Victoria - Whether you have just began your journey as a single parent or already navigating through it, our platform offers simple tools and features to help make everyday life a little easier.",
    url: "https://oneparentvic.me",
    siteName: "OneParent VIC",
    images: [
      {
        url: "https://oneparentvic.me/opvic-og.png",
        width: 1200,
        height: 630,
        alt: "OneParent VIC - Supporting single parents across Victoria",
      },
    ],
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OneParent VIC",
    description: "Making life easier for single parents across Victoria - Whether you have just began your journey as a single parent or already navigating through it, our platform offers simple tools and features to help make everyday life a little easier.",
    images: ["https://oneparentvic.me/opvic-og.png"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "OneParent VIC",
              "url": "https://oneparentvic.me",
              "logo": "https://oneparentvic.me/opvic-og.png",
              "description": "Supporting single parents across Victoria with practical tools and resources",
              "areaServed": {
                "@type": "State",
                "name": "Victoria",
                "containedInPlace": {
                  "@type": "Country",
                  "name": "Australia"
                }
              },
              "serviceType": [
                "Single Parent Support Services",
                "Community Matching",
                "Mental Health Resources",
                "Activity Planning",
                "Time Management Tools"
              ],
              "audience": {
                "@type": "Audience",
                "audienceType": "Single Parents"
              }
            })
          }}
        />
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
