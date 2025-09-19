import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Your Journey Map | OneParent VIC',
  description: 'Navigate your single parent journey with personalized guidance and support resources.',
}

export default function JourneyMapPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Single Parent Journey Map
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Navigate your unique path with personalized guidance, resources, and support tailored to your situation.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-8">
            We&apos;re building a personalized journey map to help guide you through your single parent experience. 
            This feature will provide customized resources, milestones, and support based on your unique situation.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <Link
                href="/playdate"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Plan Activities
              </Link>
              <Link
                href="/events"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Find Events
              </Link>
            </div>
            <Link
              href="/"
              className="inline-block text-blue-600 hover:underline mt-4"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}