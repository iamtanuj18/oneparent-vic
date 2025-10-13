'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
}

export function ApiErrorFallback({ 
  title = "Something went wrong",
  message = "We're having trouble connecting to our servers. This could be due to a network issue or temporary service disruption.",
  showRetry = true,
  onRetry
}: Omit<ErrorBoundaryProps, 'children' | 'fallback'>) {
  return (
    <Card className="p-8 bg-red-50 border-red-200">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
          <p className="text-red-700 max-w-md">{message}</p>
        </div>

        <div className="flex flex-col items-center space-y-3 text-sm text-red-600">
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span>Check your internet connection</span>
          </div>
          <div>• Try refreshing the page</div>
          <div>• Contact support if the problem persists</div>
        </div>

        {showRetry && onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  )
}

export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ApiErrorFallback
      title="Connection Problem"
      message="Unable to connect to our servers. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  )
}

export function ValidationErrorFallback({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <ApiErrorFallback
      title="Validation Error"
      message={message || "The information provided couldn't be processed. Please check your inputs and try again."}
      onRetry={onRetry}
    />
  )
}

export function ServerErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ApiErrorFallback
      title="Server Error"
      message="Our servers are experiencing issues. Our team has been notified and we're working on a fix."
      onRetry={onRetry}
    />
  )
}

// Hook for handling API errors consistently
export function useApiErrorHandling() {
  const handleApiError = (error: any, fallbackMessage: string = "An unexpected error occurred") => {
    console.error('API Error:', error)
    
    if (!navigator.onLine) {
      return "You appear to be offline. Please check your internet connection."
    }
    
    if (error?.response?.status >= 500) {
      return "Our servers are experiencing issues. Please try again in a few minutes."
    }
    
    if (error?.response?.status === 429) {
      return "Too many requests. Please wait a moment and try again."
    }
    
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return error?.response?.data?.message || "Invalid request. Please check your inputs."
    }
    
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return "Network error. Please check your internet connection."
    }
    
    return fallbackMessage
  }

  return { handleApiError }
}