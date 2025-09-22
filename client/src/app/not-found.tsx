import Link from "next/link";
import Image from "next/image";
import { Navbar, Footer } from "@/components/layout";
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | OneParent VIC',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header section with no text - just styling */}
      <div className="bg-[#161a24] text-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Empty header space */}
          </div>
        </div>
      </div>

      {/* main content area with 404 message */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* 404 illustration image */}
          <div className="mb-8">
            <Image 
              src="/images/404-illustration.png" 
              alt="404 Page Not Found Illustration"
              width={384}
              height={384}
              className="mx-auto object-contain"
              priority
            />
          </div>
          
          {/* 404 title */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          
          {/* Not Found subtitle */}
          <h2 className="text-3xl font-semibold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent">
              Not Found
            </span>
          </h2>
          
          {/* Embarrassing message */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Oh no, this is embarrassing! The page you are looking for was not found.
          </p>
          
          {/* Go home button */}
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}