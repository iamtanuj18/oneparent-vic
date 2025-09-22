import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Journey Map - OneParent VIC',
  description: 'Discover your personalized single parent journey with evidence-based insights from HILDA research. Get tailored support, resources, and actionable steps for your unique situation.',
  keywords: 'single parent journey, parenting support Victoria, HILDA research, single parent resources, parenting assessment, family support services',
  openGraph: {
    title: 'Your Journey Map - OneParent VIC',
    description: 'Discover your personalized single parent journey with evidence-based insights from HILDA research. Get tailored support, resources, and actionable steps for your unique situation.',
    type: 'website',
    images: [
      {
        url: '/opvic-og.png',
        width: 1200,
        height: 630,
        alt: 'OneParent VIC Journey Map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Journey Map - OneParent VIC',
    description: 'Discover your personalized single parent journey with evidence-based insights from HILDA research.',
    images: ['/opvic-og.png'],
  },
};

export default function JourneyMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}