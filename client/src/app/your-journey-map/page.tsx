'use client';

import { useState, useEffect } from 'react';
import JourneyIntroduction from '@/components/journey-map/journey-introduction';
import { JourneyAssessmentForm } from '@/components/journey-map/journey-assessment-form';
import { JourneyResults } from '@/components/journey-map/journey-results';
import { submitAssessment, AssessmentResponse, AssessmentRequest } from '@/lib/api/journey-map';
import { PageHeader } from '@/components/ui/page-header';

const ASSESSMENT_STORAGE_KEY = 'oneparent_journey_assessment';
const HISTORY_STORAGE_KEY = 'oneparent_journey_history';

export default function JourneyMapPageRoute() {
  const [currentView, setCurrentView] = useState<'introduction' | 'assessment' | 'results'>('introduction');
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load existing assessment data when component mounts
  useEffect(() => {
    const savedData = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAssessmentResults(parsed);
        setCurrentView('results');
      } catch (e) {
        console.error('Error parsing saved assessment data:', e);
        localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
      }
    }
  }, []);

  const handleStartAssessment = () => {
    setCurrentView('assessment');
    setError(null);
    // scroll to top when starting assessment
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleBackToIntro = () => {
    setCurrentView('introduction');
    setError(null);
    // scroll to top when going back to intro
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleAssessmentComplete = async (formData: AssessmentRequest) => {
    setLoading(true);
    setError(null);
    
    // scroll to top immediately when form is submitted
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const results = await submitAssessment(formData);
      setAssessmentResults(results);
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(results));
      setCurrentView('results');
      // scroll to top when results are ready
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'assessment failed');
      console.error('assessment submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = () => {
    // completely remove all journey-related data from localStorage
    // remove the primary keys used by this journey map page
    localStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    
    // also clear any API-generated journey keys (oneParentVIC_journey_*)
    Object.keys(localStorage)
      .filter(key => key.startsWith('oneParentVIC_journey_'))
      .forEach(key => localStorage.removeItem(key));
    
    // defensive cleanup for any other oneparent_journey keys
    Object.keys(localStorage)
      .filter(key => key.startsWith('oneparent_journey'))
      .forEach(key => localStorage.removeItem(key));
    
    // reset component state completely
    setAssessmentResults(null);
    setError(null);
    setLoading(false);
    setCurrentView('introduction');
    
    // scroll to top when returning to introduction
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Your"
          titleGradientText="Journey"
          subtitle="Understanding your experience as a single parent through real data and insights from other families in Victoria"
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your journey</h2>
            <p className="text-gray-600">Please wait up to 2 minutes. Don't close your browser...</p>
          </div>
        </div>
      </div>
    );
  }

  // render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="Your"
          titleGradientText="Journey"
          subtitle="Understanding your experience as a single parent through real data and insights from other families in Victoria"
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Assessment error</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentView('assessment');
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setCurrentView('introduction');
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Back to start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // render current view
  switch (currentView) {
    case 'assessment':
      return (
        <JourneyAssessmentForm 
          onBackToIntro={handleBackToIntro}
          onAssessmentComplete={handleAssessmentComplete}
        />
      );
    case 'results':
      return assessmentResults ? (
        <JourneyResults 
          assessmentResults={assessmentResults}
          onDeleteData={handleDeleteData}
        />
      ) : (
        <div className="min-h-screen bg-gray-50">
          <PageHeader 
            title="Your"
            titleGradientText="Journey"
            subtitle="Understanding your experience as a single parent through real data and insights from other families in Victoria"
          />
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-4">No Results Available</h1>
              <p className="text-gray-600 mb-6">Please complete the assessment first.</p>
              <button
                onClick={() => {
                  setCurrentView('assessment');
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }}
                className="btn-primary"
              >
                Start Journey
              </button>
            </div>
          </div>
        </div>
      );
    default:
      return <JourneyIntroduction onStartAssessment={handleStartAssessment} />;
  }
}