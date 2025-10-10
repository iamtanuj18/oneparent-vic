'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Home, 
  Users,
  CheckCircle,
  AlertTriangle,
  Edit3,
  BarChart3,
  Clock,
  BookOpen,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ANIMATION_CONFIG, FADE_UP_VARIANT } from '@/lib/animation';
import { AssessmentResponse, submitAssessment } from '@/lib/api/journey-map';
import { formatText, formatTimeframe, formatCategory, formatLevel } from '@/lib/textUtils';

interface JourneyResultsProps {
  assessmentResults: AssessmentResponse;
  onDeleteData: () => void;
}

type DashboardTab = 'overview' | 'actions' | 'history' | 'update';

export function JourneyResults({ assessmentResults: initialAssessmentResults, onDeleteData }: JourneyResultsProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(initialAssessmentResults);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [updateData, setUpdateData] = useState({
    numberOfChildren: null as number | null,
    childAge: null as number | null,
    employmentStatus: '',
    housingType: '',
    incomeBracket: '',
    childcareUsage: '',
    stressLevel: null as number | null,
    supportNetworkStrength: null as number | null,
    biggestChallenges: [] as string[],
    improvementGoals: [] as string[]
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  // sync initial assessment results to state
  useEffect(() => {
    setAssessmentResults(initialAssessmentResults);
  }, [initialAssessmentResults]);

  // save initial assessment to history if not already saved
  useEffect(() => {
    const saveInitialAssessmentToHistory = () => {
      try {
        const savedHistoryData = localStorage.getItem('oneparent_journey_history');
        let history: {
          originalSeparationDate: string;
          assessments: Array<{
            timestamp: string;
            data: any;
            type: string;
          }>;
        } = {
          originalSeparationDate: getOriginalSeparationDate(),
          assessments: []
        };

        if (savedHistoryData) {
          history = JSON.parse(savedHistoryData);
        }

        // if no assessments in history yet, save this initial one
        if (!history.assessments || history.assessments.length === 0) {
          history.assessments = [];
          history.assessments.push({
            timestamp: initialAssessmentResults.userPosition?.assessmentDate || new Date().toISOString(),
            data: initialAssessmentResults,
            type: 'initial'
          });

          localStorage.setItem('oneparent_journey_history', JSON.stringify(history));
        }
      } catch (error) {
        console.error('Error saving initial assessment to history:', error);
      }
    };

    if (initialAssessmentResults && initialAssessmentResults.userPosition) {
      saveInitialAssessmentToHistory();
    }
  }, [initialAssessmentResults]);

  // load current assessment from localStorage if available for tab refreshes
  useEffect(() => {
    const loadCurrentAssessment = () => {
      try {
        const savedAssessment = localStorage.getItem('oneparent_journey_assessment');
        if (savedAssessment) {
          const parsed = JSON.parse(savedAssessment);
          // only update if the saved data is newer than initial data
          if (parsed.userPosition?.assessmentDate > initialAssessmentResults.userPosition?.assessmentDate) {
            setAssessmentResults(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading current assessment from localStorage:', error);
      }
    };

    loadCurrentAssessment();

    // listen for storage changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oneparent_journey_assessment' && e.newValue) {
        try {
          const newAssessment = JSON.parse(e.newValue);
          setAssessmentResults(newAssessment);
        } catch (error) {
          console.error('Error parsing storage update:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialAssessmentResults]);

  // initialize update data with current values using useEffect
  useEffect(() => {
    if (!isUpdating && updateData.numberOfChildren === null) {
      setIsUpdating(true);
      setUpdateData({
        numberOfChildren: assessmentResults.userPosition.numberOfChildren || null,
        childAge: assessmentResults.userPosition.childAge || null,
        employmentStatus: assessmentResults.userPosition.employmentStatus || '',
        housingType: assessmentResults.userPosition.housingType || '',
        incomeBracket: assessmentResults.userPosition.incomeBracket || '',
        childcareUsage: assessmentResults.userPosition.childcareUsage || '',
        stressLevel: assessmentResults.userPosition.stressLevel || null,
        supportNetworkStrength: assessmentResults.userPosition.supportNetworkStrength || null,
        biggestChallenges: [...(assessmentResults.userPosition.biggestChallenges || [])],
        improvementGoals: [...(assessmentResults.userPosition.improvementGoals || [])]
      });
    }
  }, [isUpdating, updateData.numberOfChildren, assessmentResults.userPosition]);

  // check if update form is valid
  const isUpdateFormValid = () => {
    return updateData.numberOfChildren !== null && 
           updateData.childAge !== null && 
           updateData.stressLevel !== null && 
           updateData.supportNetworkStrength !== null &&
           updateData.employmentStatus !== '' &&
           updateData.housingType !== '' &&
           updateData.incomeBracket !== '' &&
           updateData.childcareUsage !== '';
  };

  // check if any form data has changed from current assessment
  const hasChanges = () => {
    if (!assessmentResults?.userPosition) return false;
    
    const current = assessmentResults.userPosition;
    return (
      updateData.numberOfChildren !== current.numberOfChildren ||
      updateData.childAge !== current.childAge ||
      updateData.employmentStatus !== current.employmentStatus ||
      updateData.housingType !== current.housingType ||
      updateData.incomeBracket !== current.incomeBracket ||
      updateData.childcareUsage !== current.childcareUsage ||
      updateData.stressLevel !== current.stressLevel ||
      updateData.supportNetworkStrength !== current.supportNetworkStrength ||
      JSON.stringify(updateData.biggestChallenges.sort()) !== JSON.stringify([...(current.biggestChallenges || [])].sort()) ||
      JSON.stringify(updateData.improvementGoals.sort()) !== JSON.stringify([...(current.improvementGoals || [])].sort())
    );
  };

  // get original separation date from localStorage history or current data
  const getOriginalSeparationDate = () => {
    try {
      const savedData = localStorage.getItem('oneparent_journey_history');
      if (savedData) {
        const history = JSON.parse(savedData);
        if (history.originalSeparationDate) {
          return history.originalSeparationDate;
        }
      }
    } catch (error) {
      console.error('Error reading separation date from history:', error);
    }
    
    // fallback calculate from current time since data this should only happen once
    const { years, months } = assessmentResults.userPosition.timeSince;
    const separationDate = new Date();
    separationDate.setFullYear(separationDate.getFullYear() - years);
    separationDate.setMonth(separationDate.getMonth() - months);
    return separationDate.toISOString().split('T')[0];
  };

  // save assessment to history and update current
  const saveAssessmentToHistory = (newAssessmentResult: any) => {
    try {
      const originalSeparationDate = getOriginalSeparationDate();
      const timestamp = new Date().toISOString();
      
      // get existing history
      const savedData = localStorage.getItem('oneparent_journey_history');
      let history: {
        originalSeparationDate: string;
        assessments: Array<{
          timestamp: string;
          data: any;
          type: string;
        }>;
      } = {
        originalSeparationDate,
        assessments: []
      };
      
      if (savedData) {
        history = JSON.parse(savedData);
      }
      
      // if this is the first assessment or we are updating from old format
      if (!history.assessments || history.assessments.length === 0) {
        history.assessments = [];
        // add current assessment as first historical record if it doesn't exist
        if (assessmentResults) {
          // use the original assessment timestamp, not current timestamp
          const originalTimestamp = assessmentResults.userPosition?.assessmentDate || 
                                  new Date(Date.now() - 60000).toISOString(); // fallback: 1 minute ago
          
          history.assessments.push({
            timestamp: originalTimestamp,
            data: assessmentResults,
            type: 'initial'
          });
        }
      }
      
      // add new assessment
      history.assessments.push({
        timestamp: timestamp,
        data: newAssessmentResult,
        type: 'update'
      });
      
      // save to localStorage
      localStorage.setItem('oneparent_journey_history', JSON.stringify(history));
      localStorage.setItem('oneparent_journey_assessment', JSON.stringify(newAssessmentResult));
      
    } catch (error) {
      console.error('Error saving assessment to history:', error);
    }
  };

  // get assessment history for display
  const getAssessmentHistory = () => {
    try {
      const savedData = localStorage.getItem('oneparent_journey_history');
      if (savedData) {
        const history = JSON.parse(savedData);
        return history.assessments || [];
      }
    } catch (error) {
      console.error('Error reading assessment history:', error);
    }
    return [];
  };

  // handle update form submission
  const handleUpdateSubmit = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    
    // immediately scroll to show the loading state for better ux
    setTimeout(() => {
      const updateSectionHeader = document.getElementById('update-section-header');
      
      if (updateSectionHeader) {
        updateSectionHeader.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      } else {
        // fallback: scroll to a reasonable position where loading is visible
        window.scrollTo({ 
          top: Math.max(0, window.scrollY - 200), 
          behavior: 'smooth' 
        });
      }
    }, 50); // small delay to ensure loading state is rendered
    
    try {
      // validate required fields before submission
      if (updateData.numberOfChildren === null || updateData.numberOfChildren === undefined) {
        setUpdateError('Please select the number of children');
        setUpdateLoading(false);
        return;
      }
      
      if (updateData.stressLevel === null || updateData.stressLevel === undefined) {
        setUpdateError('Please rate your current stress level');
        setUpdateLoading(false);
        return;
      }
      
      if (updateData.childAge === null || updateData.childAge === undefined) {
        setUpdateError('Please select your child\'s age range');
        setUpdateLoading(false);
        return;
      }
      
      if (updateData.supportNetworkStrength === null || updateData.supportNetworkStrength === undefined) {
        setUpdateError('Please rate your support network strength');
        setUpdateLoading(false);
        return;
      }
      
      // check if there are actually changes
      if (!hasChanges()) {
        setUpdateError('No changes detected. Please modify at least one field to update your situation.');
        setUpdateLoading(false);
        return;
      }
      
      // get current assessment from history for previous assessment data
      const assessmentHistory = getAssessmentHistory();
      const currentAssessment = assessmentHistory[assessmentHistory.length - 1];
      
      // prepare assessment data with updates using original separation date
      const updatedAssessment = {
        // use original separation date - never recalculate this
        separationDate: getOriginalSeparationDate(),
        // update family situation
        numberOfChildren: updateData.numberOfChildren,
        childAge: updateData.childAge,
        // update living & financial
        employmentStatus: updateData.employmentStatus,
        housingType: updateData.housingType,
        incomeBracket: updateData.incomeBracket,
        childcareUsage: updateData.childcareUsage,
        // update wellbeing
        stressLevel: updateData.stressLevel,
        supportNetworkStrength: updateData.supportNetworkStrength,
        biggestChallenges: updateData.biggestChallenges,
        improvementGoals: updateData.improvementGoals,
        // include previous assessment data for progress comparison
        previousAssessment: currentAssessment ? {
          timestamp: currentAssessment.timestamp,
          stressLevel: assessmentResults.userPosition.stressLevel,
          supportNetworkStrength: assessmentResults.userPosition.supportNetworkStrength,
          employmentStatus: assessmentResults.userPosition.employmentStatus,
          housingType: assessmentResults.userPosition.housingType,
          biggestChallenges: assessmentResults.userPosition.biggestChallenges,
          improvementGoals: assessmentResults.userPosition.improvementGoals
        } : undefined
      };

      // submit to backend for new analysis
      const updatedResults = await submitAssessment(updatedAssessment);
      
      // save to history and update current
      saveAssessmentToHistory(updatedResults);
      
      // update current assessment state immediately
      setAssessmentResults(updatedResults);
      
      // force update localStorage for current assessment
      localStorage.setItem('oneparent_journey_assessment', JSON.stringify(updatedResults));
      
      // dispatch storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'oneparent_journey_assessment',
        newValue: JSON.stringify(updatedResults),
        storageArea: localStorage
      }));
      
      // switch to history tab to show the progression
      setActiveTab('history');
      
      // reset form state
      setIsUpdating(false);
      setUpdateError(null);
      
      // auto-scroll to top of the history tab and show success notification
      setTimeout(() => {
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
        // show success notification after tab switch is complete
        setShowUpdateSuccess(true);
        // auto-hide notification after 8 seconds
        setTimeout(() => setShowUpdateSuccess(false), 8000);
      }, 100);
      
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateError('Failed to update your situation. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // helper function to format labels by removing underscores and capitalizing
  const formatLabel = (label: string | undefined) => {
    if (!label) return '';
    return label
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Scroll to top function for the prompt button
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // helper function to format time since separation
  const formatTimeSince = (timeSince: { years: number; months: number } | undefined) => {
    if (!timeSince) return '0 years';
    
    const { years, months } = timeSince;
    
    if (years === 0 && months === 0) {
      return 'Less than 1 month';
    } else if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`;
    } else if (months === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    } else {
      const yearText = years === 1 ? '1 year' : `${years} years`;
      const monthText = months === 1 ? '1 month' : `${months} months`;
      return `${yearText} and ${monthText}`;
    }
  };

  // compact version for cards
  const formatTimeSinceCompact = (timeSince: { years: number; months: number } | undefined) => {
    if (!timeSince) return '0y';
    
    const { years, months } = timeSince;
    
    if (years === 0 && months === 0) {
      return '<1m';
    } else if (years === 0) {
      return `${months}m`;
    } else if (months === 0) {
      return `${years}y`;
    } else {
      return `${years}y ${months}m`;
    }
  };



  // helper function to format timeframes with better readability
  const formatTimeframe = (timeframe: string | undefined) => {
    if (!timeframe) return '';
    
    const timeframeMap: { [key: string]: string } = {
      'immediate': 'Immediate (Next 1-2 weeks)',
      'ongoing': 'Ongoing',
      '2-6 months': '2-6 Months',
      'immediate and ongoing': 'Immediate & Ongoing',
      '6-12 months': '6-12 Months',
      '1-3 months': '1-3 Months',
      'short-term': 'Short-term (1-3 months)',
      'medium-term': 'Medium-term (3-6 months)',
      'long-term': 'Long-term (6+ months)'
    };
    
    return timeframeMap[timeframe.toLowerCase()] || formatText(timeframe);
  };

  const { userPosition, comprehensiveAnalysis, mentalHealth, childcare, housingStress } = assessmentResults;

  // tab navigation component
  const TabNavigation = () => (
    <div className="flex justify-center mb-6">
      <div className="inline-flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'actions', label: 'Action Plan', icon: Target },
          { id: 'history', label: 'My Journey History', icon: TrendingUp },
          { id: 'update', label: 'Update Situation', icon: Edit3 }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as DashboardTab)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all text-center whitespace-nowrap ${
              activeTab === id 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // overview dashboard with enhanced intelligence features
  const OverviewDashboard = () => (
    <div className="space-y-8">
      {/* Journey Stage & Contextual Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Journey Stage */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Your Journey Stage
          </h3>
          <div className="text-center p-4 bg-blue-50 rounded-lg mb-4">
            <div className="text-sm text-gray-600 mb-2">
              You are in the
            </div>
            <div className="text-2xl font-bold text-blue-600 capitalize">
              {comprehensiveAnalysis.journeyStage ? comprehensiveAnalysis.journeyStage.replace(/_/g, ' ') : 'Assessment Stage'}
            </div>
            <div className="text-sm text-gray-600">Stage</div>
          </div>
          <div className="space-y-3">
            {comprehensiveAnalysis.trajectoryPrediction?.stageDescription && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Stage Description:</strong> {comprehensiveAnalysis.trajectoryPrediction.stageDescription}
                </p>
              </div>
            )}
            {comprehensiveAnalysis.trajectoryPrediction?.sixMonthOutlook && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>6 Month Outlook:</strong> {comprehensiveAnalysis.trajectoryPrediction.sixMonthOutlook}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contextual Insights */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-500" />
            Research Insights
          </h3>
          <div className="space-y-3">
            {comprehensiveAnalysis.contextualInsights?.situationContext && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {comprehensiveAnalysis.contextualInsights.situationContext}
                </p>
              </div>
            )}
            {comprehensiveAnalysis.contextualInsights?.dataBasedHope && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Research-Based Insights:</p>
                <p className="text-sm text-green-700">
                  {comprehensiveAnalysis.contextualInsights.dataBasedHope}
                </p>
              </div>
            )}
            {(comprehensiveAnalysis.contextualInsights?.keyOpportunities || []).length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800">Available Opportunities:</p>
                {(comprehensiveAnalysis.contextualInsights.keyOpportunities || []).slice(0, 3).map((opportunity: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {opportunity}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HILDA Data Comparison */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          How You Compare to Other Single Parents (HILDA Data)
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">Mental Health Recovery</h4>
            </div>
            <div className="space-y-3">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {mentalHealth.singleParentChallengesPct}%
                </div>
                <div className="text-sm text-gray-600">
                  Single parents at {formatTimeSince(userPosition.timeSince)} since separation still face challenges
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">
                  {mentalHealth.populationChallengesPct}%
                </div>
                <div className="text-xs text-gray-600">General population challenges</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-700">
                  ✓ You&apos;re doing better than {mentalHealth.userBetterThan}% of single parents at your stage
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Childcare Costs (Youngest Child)</h4>
            </div>
            <div className="space-y-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ${childcare.ageSpecificCost}/week
                </div>
                <div className="text-sm text-gray-600">
                  For your youngest child ({userPosition.childAge === 5 ? '4+ years old' : `${userPosition.childAge} year${userPosition.childAge === 1 ? '' : 's'} old`})
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-semibold text-gray-700">
                    ${childcare.singleParentAvgCost}
                  </div>
                  <div className="text-xs text-gray-600">Single parents avg</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-semibold text-gray-700">
                    ${childcare.coupleParentAvgCost}
                  </div>
                  <div className="text-xs text-gray-600">Couples avg</div>
                </div>
              </div>
              
              <div className={`text-center p-3 rounded-lg ${
                childcare.singleParentSavings !== null && childcare.singleParentSavings > 0 
                  ? 'bg-green-50' 
                  : 'bg-yellow-50'
              }`}>
                <div className={`text-sm font-medium ${
                  childcare.singleParentSavings !== null && childcare.singleParentSavings > 0 
                    ? 'text-green-700' 
                    : 'text-yellow-700'
                }`}>
                  {childcare.singleParentSavings !== null && childcare.singleParentSavings > 0 ? (
                    `💰 Single parents save ~$${Number(childcare.singleParentSavings).toFixed(2)}/week vs couples`
                  ) : childcare.singleParentSavings === 0 ? (
                    `⚖️ Single parents and couples have similar childcare costs`
                  ) : (
                    `� Single parents may pay more for childcare than couples`
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-semibold">Housing Stress</h4>
            </div>
            <div className="space-y-3">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {housingStress.singleParentStressPct}%
                </div>
                <div className="text-sm text-gray-600">
                  Single parents experiencing housing stress
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-700">
                  {housingStress.allPeopleStressPct}%
                </div>
                <div className="text-xs text-gray-600">General population stress</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm font-medium text-orange-700">
                  ⚠️ {housingStress.riskMultiplier}x higher risk than general population
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Housing Type Impact */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Your Housing Situation Impact</h4>
          <p className="text-blue-800 text-sm">
            You&apos;re in <strong>{formatLabel(userPosition.housingType)}</strong> housing. 
            {assessmentResults?.comprehensiveAnalysis?.contextualInsights?.housingInsight ? ` ${assessmentResults.comprehensiveAnalysis.contextualInsights.housingInsight}` : ''}
          </p>
        </div>
      </div>

      {/* Family Situation Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Your Family Situation
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatTimeSinceCompact(userPosition.timeSince)}
            </div>
            <div className="text-sm text-gray-600">Time Since Separation</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {userPosition.numberOfChildren}
            </div>
            <div className="text-sm text-gray-600">Children</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {userPosition.childAge === 5 ? '4+' : userPosition.childAge}
            </div>
            <div className="text-sm text-gray-600">Youngest Child Age</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {userPosition.stressLevel}/10
            </div>
            <div className="text-sm text-gray-600">Current Stress Level</div>
          </div>
        </div>
      </div>

      {/* Current Challenges & Goals */}
        <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Your Biggest Challenges
          </h3>
          <div className="space-y-2">
            {(userPosition.biggestChallenges || []).map((challenge, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-800 text-sm font-medium">{formatText(challenge)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Your Improvement Goals
          </h3>
          <div className="space-y-2">
            {(userPosition.improvementGoals || []).map((goal, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-800 text-sm font-medium">{formatText(goal)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>      {/* Current Situation Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Your Current Situation Analysis
        </h3>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {(comprehensiveAnalysis.riskFactors || []).length}
            </div>
            <div className="text-sm text-gray-600">Challenge Areas</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {(comprehensiveAnalysis.protectiveFactors || []).length}
            </div>
            <div className="text-sm text-gray-600">Strength Areas</div>
          </div>
        </div>
        
        {/* Detailed Challenge and Strength Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-red-800 mb-3">Areas Needing Support</h4>
            <div className="space-y-2">
              {(comprehensiveAnalysis.riskFactors || []).length > 0 ? (
                (comprehensiveAnalysis.riskFactors || []).map((challenge: any, index: number) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="font-medium text-red-800">{challenge.factor}</div>
                    <div className="text-sm text-red-600 mt-1">
                      Category: {challenge.category} | Attention Level: {challenge.severity}
                    </div>
                    {challenge.actionable && (
                      <div className="text-sm text-blue-600 mt-1">💡 {challenge.actionable}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Risk factor analysis is being processed...</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-green-800 mb-3">Your Strength Areas</h4>
            <div className="space-y-2">
              {(comprehensiveAnalysis.protectiveFactors || []).length > 0 ? (
                (comprehensiveAnalysis.protectiveFactors || []).map((strength: any, index: number) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="font-medium text-green-800">{strength.factor}</div>
                    <div className="text-sm text-green-600 mt-1">
                      Category: {formatText(strength.category)} | Strength: {formatText(strength.strength || '')} | Impact: {strength.resilienceImpact || ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Strength analysis is being processed...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stress Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Financial Stress Analysis
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {userPosition.numberOfChildren}
            </div>
            <div className="text-sm text-gray-600">Children to Support</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600 mb-2">
              {formatText(userPosition.incomeBracket || '')}
            </div>
            <div className="text-sm text-gray-600">Income Bracket</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Financial Stress Factors</h4>
            <div className="space-y-2">
              {(comprehensiveAnalysis.financialStress?.factors || []).length > 0 ? (
                (comprehensiveAnalysis.financialStress.factors || []).map((factor: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{factor}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Financial stress analysis is being processed...</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Financial Recommendations</h4>
            <div className="space-y-2">
              {(comprehensiveAnalysis.financialStress?.recommendations || []).length > 0 ? (
                (comprehensiveAnalysis.financialStress.recommendations || []).map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                    <span className="text-blue-800">{rec}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Financial recommendations are being processed...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // enhanced action plan dashboard with intelligent sequencing
  const ActionPlanDashboard = () => (
    <div className="space-y-6">
      {/* Next Steps Timeline */}
      {comprehensiveAnalysis.nextSteps && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Your Intelligent Action Timeline
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comprehensiveAnalysis.nextSteps?.week1 && (
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <h4 className="font-semibold text-red-800 mb-2">Week 1</h4>
                <p className="text-sm text-red-700">{comprehensiveAnalysis.nextSteps?.week1}</p>
              </div>
            )}
            {comprehensiveAnalysis.nextSteps?.month1 && (
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-semibold text-yellow-800 mb-2">Month 1</h4>
                <p className="text-sm text-yellow-700">{comprehensiveAnalysis.nextSteps?.month1}</p>
              </div>
            )}
            {comprehensiveAnalysis.nextSteps?.month3 && (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-2">Month 3</h4>
                <p className="text-sm text-blue-700">{comprehensiveAnalysis.nextSteps?.month3}</p>
              </div>
            )}
            {comprehensiveAnalysis.nextSteps?.month6 && (
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 mb-2">Month 6</h4>
                <p className="text-sm text-green-700">{comprehensiveAnalysis.nextSteps?.month6}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Plan Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Your Personalized Action Plan
        </h3>
        
        {/* Action Plan Summary */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {(comprehensiveAnalysis.personalizedActions || []).filter(a => a.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority Actions</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {(comprehensiveAnalysis.personalizedActions || []).filter(a => a.priority === 'medium').length}
            </div>
            <div className="text-sm text-gray-600">Medium Priority Actions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {(comprehensiveAnalysis.personalizedActions || []).filter(a => a.priority === 'low').length}
            </div>
            <div className="text-sm text-gray-600">Low Priority Actions</div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Immediate Actions (Next 30 Days)</h4>
          {(() => {
            const immediateActions = (comprehensiveAnalysis.personalizedActions || [])
              .filter((action: any) => action.timeframe === 'immediate')
              .reduce((unique: any[], action: any) => {
                // deduplicate by action title
                if (!unique.some((a: any) => a.action === action.action)) {
                  unique.push(action);
                }
                return unique;
              }, []);
            
            return immediateActions.length > 0 ? (
              immediateActions.map((action, index) => (
              <div key={`immediate-${index}`} className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        action.priority === 'high' ? 'bg-red-100 text-red-800' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {(action.priority || '').toUpperCase()} PRIORITY
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        IMMEDIATE
                      </span>
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-1">{action.action}</h5>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                    {action.successRate && (
                      <p className="text-green-600 text-sm font-medium mt-1">📊 Success Rate: {action.successRate}</p>
                    )}
                    {action.expectedOutcome && (
                      <p className="text-blue-600 text-sm mt-1">🎯 Expected: {action.expectedOutcome}</p>
                    )}
                    {action.dependencies && action.dependencies.length > 0 && (
                      <div className="mt-2">
                        <p className="text-orange-600 text-sm font-medium">⚠️ Dependencies:</p>
                        <ul className="text-orange-600 text-sm ml-4">
                          {(action.dependencies || []).map((dep: string, i: number) => (
                            <li key={i}>• {dep}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button className="text-green-600 hover:text-green-700 ml-4">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))) : (
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">Immediate actions are being processed...</p>
              </div>
            );
          })()}
        </div>

        <div className="space-y-4 mt-8">
          <h4 className="font-semibold text-gray-800">Medium-term Actions (1-6 Months)</h4>
          {(() => {
            const usedActions = new Set((comprehensiveAnalysis.personalizedActions || [])
              .filter((action: any) => action.timeframe === 'immediate')
              .map((action: any) => action.action));
            
            const mediumTermActions = (comprehensiveAnalysis.personalizedActions || [])
              .filter((action: any) => action.timeframe === 'short-term' && !usedActions.has(action.action))
              .reduce((unique: any[], action: any) => {
                // deduplicate by action title
                if (!unique.some(a => a.action === action.action)) {
                  unique.push(action);
                }
                return unique;
              }, []);
            
            return mediumTermActions.length > 0 ? (
              mediumTermActions.map((action, index) => (
              <div key={`medium-${index}`} className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        action.priority === 'high' ? 'bg-red-100 text-red-800' :
                        action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {(action.priority || '').toUpperCase()} PRIORITY
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        SHORT-TERM
                      </span>
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-1">{action.action}</h5>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                  </div>
                  <button className="text-green-600 hover:text-green-700 ml-4">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))) : (
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">Medium-term actions are being processed...</p>
              </div>
            );
          })()}
        </div>

        {/* Long-term Actions for Low Priority Items */}
        <div className="space-y-4 mt-8">
          <h4 className="font-semibold text-gray-800">Long-term Actions (6+ Months)</h4>
          {(() => {
            const usedActions = new Set((comprehensiveAnalysis.personalizedActions || [])
              .filter(action => action.timeframe === 'immediate' || action.timeframe === 'short-term')
              .map(action => action.action));
            
            const longTermActions = (comprehensiveAnalysis.personalizedActions || [])
              .filter((action: any) => action.timeframe === 'long-term' && !usedActions.has(action.action))
              .reduce((unique: any[], action: any) => {
                // deduplicate by action title
                if (!unique.some(a => a.action === action.action)) {
                  unique.push(action);
                }
                return unique;
              }, []);
            
            return longTermActions.length > 0 ? (
              longTermActions.map((action: any, index: number) => (
              <div key={`long-${index}`} className="p-4 border-l-4 border-green-500 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {(action.priority || '').toUpperCase()} PRIORITY
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        LONG-TERM
                      </span>
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-1">{action.action}</h5>
                    <p className="text-gray-600 text-sm">{action.description}</p>
                    {action.successRate && (
                      <div className="text-sm text-blue-600 mt-2">📊 Success Rate: {action.successRate}</div>
                    )}
                    {action.expectedOutcome && (
                      <div className="text-sm text-green-600 mt-1">🎯 Expected: {action.expectedOutcome}</div>
                    )}
                  </div>
                  <button className="text-green-600 hover:text-green-700 ml-4">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))) : (
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">Long-term actions will be generated based on your situation analysis.</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Financial Action Plan */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          Financial Action Plan
        </h3>
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">
            Priority Financial Steps (Based on {comprehensiveAnalysis.financialStress?.level || ''} stress level)
          </h4>
          <div className="space-y-2">
            {(comprehensiveAnalysis.financialStress?.recommendations || []).length > 0 ? (
              (comprehensiveAnalysis.financialStress.recommendations || []).map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-white rounded">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                  <span className="text-blue-800 text-sm">{rec}</span>
                </div>
              ))
            ) : (
              <div className="p-3 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-600">Financial action plan is being processed...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Challenge-Specific Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Challenge-Specific Action Items
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-md font-semibold text-red-800 mb-3">Addressing Your Current Challenges</h4>
            <div className="space-y-2">
              {(comprehensiveAnalysis.challengeSpecificActions || []).map((challengeAction, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg">
                  <div className="text-md font-semibold text-red-800 mb-1">{formatText(challengeAction.challenge)}</div>
                  <div className="text-sm text-red-600 mb-2">
                    {challengeAction.action}
                  </div>
                  {(challengeAction as any).evidenceBase && (
                    <div className="text-xs font-medium text-red-500 mb-1">
                      📊 {(challengeAction as any).evidenceBase}
                    </div>
                  )}
                  {(challengeAction as any).timeline && (
                    <div className="text-xs font-medium text-red-400">
                      ⏱️ Timeframe: {formatTimeframe((challengeAction as any).timeline)}
                    </div>
                  )}
                  {(challengeAction as any).urgency && (
                    <div className={`text-xs font-medium mt-1 ${
                      (challengeAction as any).urgency === 'high' ? 'text-red-600' :
                      (challengeAction as any).urgency === 'medium' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`}>
                      ⚡ Priority: {formatLevel((challengeAction as any).urgency || '')}
                    </div>
                  )}
                </div>
              ))}
              {(comprehensiveAnalysis.challengeSpecificActions || []).length === 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Challenge-specific actions will appear here based on your assessment responses.
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-green-800 mb-3">Working Towards Your Goals</h4>
            <div className="space-y-2">
              {(comprehensiveAnalysis.goalSpecificActions || []).map((goalAction, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg">
                  <div className="text-md font-semibold text-green-800 mb-1">{formatText(goalAction.goal)}</div>
                  <div className="text-sm text-green-600 mb-2">
                    {goalAction.action}
                  </div>
                  {(goalAction as any).evidenceBase && (
                    <div className="text-xs font-medium text-green-500 mb-1">
                      📊 {(goalAction as any).evidenceBase}
                    </div>
                  )}
                  {(goalAction as any).timeframe && (
                    <div className="text-xs font-medium text-green-400 mb-1">
                      ⏱️ Timeframe: {formatTimeframe((goalAction as any).timeframe)}
                    </div>
                  )}
                  {(goalAction as any).firstStep && (
                    <div className="text-xs font-medium text-green-600 mb-1">
                      🚀 First Step: {(goalAction as any).firstStep}
                    </div>
                  )}
                  {(goalAction as any).victoriaResources && (
                    <div className="text-xs font-medium text-green-500">
                      🏛️ Victoria Resources: {(goalAction as any).victoriaResources}
                    </div>
                  )}
                </div>
              ))}
              {(comprehensiveAnalysis.goalSpecificActions || []).length === 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    Goal-specific actions will appear here based on your improvement goals.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // journey history dashboard - redesigned for textual summaries
  const HistoryDashboard = () => {
    const assessmentHistory = getAssessmentHistory();
    const currentAssessment = assessmentHistory[assessmentHistory.length - 1];
    const previousAssessment = assessmentHistory[assessmentHistory.length - 2];
    
    // generate textual summary for current situation
    const generateCurrentSituationSummary = () => {
      if (comprehensiveAnalysis?.situationSummary) {
        return comprehensiveAnalysis.situationSummary;
      }
      
      // if no backend summary, show loading message instead of fallback
      return "Your situation summary is being generated based on HILDA research and your assessment data...";
    };

    // generate comparison summary if previous assessment exists
    const generateComparisonSummary = () => {
      if (!previousAssessment || !currentAssessment) {
        return "No previous update found to compare with.";
      }
      
      // helper function to clean text from gemini formatting issues
      const cleanTextFormatting = (text: string) => {
        return text
          // remove emoji characters that get corrupted
          .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
          // remove corrupted characters
          .replace(/�/g, '')
          // remove markdown bold formatting
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          // remove markdown italic formatting
          .replace(/\*([^*]+)\*/g, '$1')
          // clean up extra spaces
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      // first try to use gemini-generated progress summary (but clean it)
      if (comprehensiveAnalysis?.progressSummary) {
        return cleanTextFormatting(comprehensiveAnalysis.progressSummary);
      }
      
      // Try different possible data structures
      const prev = previousAssessment.userPosition || previousAssessment.data?.userPosition || previousAssessment;
      const curr = currentAssessment.userPosition || currentAssessment.data?.userPosition || currentAssessment;
      
      // If we still don't have the right structure, try to extract from responses
      let prevData = prev;
      let currData = curr;
      
      // Check if data is in responses array
      if (previousAssessment.responses && Array.isArray(previousAssessment.responses)) {
        // Try to find stress level and support network from responses
        const stressResponse = previousAssessment.responses.find((r: any) => r.question?.includes('stress') || r.question?.includes('overwhelmed'));
        const supportResponse = previousAssessment.responses.find((r: any) => r.question?.includes('support') || r.question?.includes('network'));
        if (stressResponse || supportResponse) {
          prevData = {
            stressLevel: stressResponse?.value || stressResponse?.answer,
            supportNetworkStrength: supportResponse?.value || supportResponse?.answer,
            ...prev
          };
        }
      }
      
      if (currentAssessment.responses && Array.isArray(currentAssessment.responses)) {
        const stressResponse = currentAssessment.responses.find((r: any) => r.question?.includes('stress') || r.question?.includes('overwhelmed'));
        const supportResponse = currentAssessment.responses.find((r: any) => r.question?.includes('support') || r.question?.includes('network'));
        if (stressResponse || supportResponse) {
          currData = {
            stressLevel: stressResponse?.value || stressResponse?.answer,
            supportNetworkStrength: supportResponse?.value || supportResponse?.answer,
            ...curr
          };
        }
      }
      
      // If we still can't find meaningful data, show what we have
      if (!prevData && !currData) {
        return `Unable to generate comparison - data structure may have changed. Please try updating your journey again.`;
      }
      
      // Use the extracted data for comparison
      const prevToUse = prevData || {};
      const currToUse = currData || {};
      
      const improvements = [];
      const challenges = [];
      const changes = [];
      const insights = [];
      
      // Analyze stress level changes
      if (prevToUse.stressLevel != null && currToUse.stressLevel != null) {
        const stressDiff = currToUse.stressLevel - prevToUse.stressLevel;
        if (stressDiff < 0) {
          improvements.push(`Your stress levels have decreased from ${prevToUse.stressLevel}/10 to ${currToUse.stressLevel}/10 - that's fantastic progress!`);
        } else if (stressDiff > 0) {
          challenges.push(`Your stress levels have increased from ${prevToUse.stressLevel}/10 to ${currToUse.stressLevel}/10. This is understandable given life changes.`);
        } else {
          insights.push(`Your stress levels have remained stable at ${currToUse.stressLevel}/10.`);
        }
      }
      
      // Analyze support network changes
      if (prevToUse.supportNetworkStrength != null && currToUse.supportNetworkStrength != null) {
        const supportDiff = currToUse.supportNetworkStrength - prevToUse.supportNetworkStrength;
        if (supportDiff > 0) {
          improvements.push(`Your support network has strengthened from ${prevToUse.supportNetworkStrength}/10 to ${currToUse.supportNetworkStrength}/10. Building connections is crucial for wellbeing.`);
        } else if (supportDiff < 0) {
          challenges.push(`Your support network strength has decreased from ${prevToUse.supportNetworkStrength}/10 to ${currToUse.supportNetworkStrength}/10. This happens sometimes during transitions.`);
        } else {
          insights.push(`Your support network has remained at ${currToUse.supportNetworkStrength}/10.`);
        }
      }
      
      // Analyze life changes
      const lifeChanges = [];
      
      // Employment changes
      if (prevToUse.employmentStatus && currToUse.employmentStatus && prevToUse.employmentStatus !== currToUse.employmentStatus) {
        const empMap: { [key: string]: string } = {
          'full_time': 'full-time work',
          'part_time': 'part-time work', 
          'casual': 'casual work',
          'unemployed': 'unemployment',
          'student': 'studying',
          'volunteer': 'volunteer work'
        };
        lifeChanges.push(`moved from ${empMap[prevToUse.employmentStatus] || prevToUse.employmentStatus} to ${empMap[currToUse.employmentStatus] || currToUse.employmentStatus}`);
      }
      
      // Housing changes
      if (prevToUse.housingType && currToUse.housingType && prevToUse.housingType !== currToUse.housingType) {
        const houseMap: { [key: string]: string } = {
          'family_friends': 'staying with family/friends',
          'private_rental': 'private rental',
          'social_housing': 'social housing',
          'transitional': 'transitional housing',
          'own_home': 'your own home',
          'other': 'other housing'
        };
        lifeChanges.push(`transitioned from ${houseMap[prevToUse.housingType] || prevToUse.housingType} to ${houseMap[currToUse.housingType] || currToUse.housingType}`);
      }
      
      // Number of children changes
      if (prevToUse.numberOfChildren != null && currToUse.numberOfChildren != null && prevToUse.numberOfChildren !== currToUse.numberOfChildren) {
        const childDiff = currToUse.numberOfChildren - prevToUse.numberOfChildren;
        if (childDiff > 0) {
          lifeChanges.push(`welcomed ${childDiff === 1 ? 'a new child' : `${childDiff} new children`} to your family`);
        }
      }
      
      if (lifeChanges.length > 0) {
        changes.push(`You've ${lifeChanges.join(' and ')} since your last update.`);
      }
      
      // Build a warm, encouraging summary
      let summary = "";
      
      if (improvements.length > 0) {
        summary += "Positive Progress:\n";
        improvements.forEach(improvement => {
          summary += `• ${improvement}\n`;
        });
        summary += "\n";
      }
      
      if (changes.length > 0) {
        summary += "Life Updates:\n";
        changes.forEach(change => {
          summary += `• ${change}\n`;
        });
        summary += "\n";
      }
      
      if (challenges.length > 0) {
        summary += "Areas Requiring Attention:\n";
        challenges.forEach(challenge => {
          summary += `• ${challenge}\n`;
        });
        summary += "\n";
      }
      
      if (insights.length > 0 && improvements.length === 0 && challenges.length === 0) {
        summary += "Stability & Consistency:\n";
        insights.forEach(insight => {
          summary += `• ${insight}\n`;
        });
        summary += "\n";
      }
      
      // Add encouraging conclusion
      if (improvements.length > 0) {
        summary += "Keep up the excellent work! These positive changes show your resilience and determination. Your updated action plan will help you continue this progress.";
      } else if (challenges.length > 0) {
        summary += "� **Remember, every journey has ups and downs.** You're managing significant challenges, and that takes incredible strength. Your updated action plan includes fresh strategies to help you move forward.";
      } else if (changes.length > 0) {
        summary += "Change is part of growth. You're navigating life transitions while caring for your family - that's no small feat. Your action plan has been refreshed to support your current situation.";
      } else {
        summary += "Consistency can be a strength. Your action plans have been updated with the latest recommendations to help you continue your journey forward.";
      }
      
      return summary;
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            My Journey History
          </h3>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Track Your Progress Over Time</h4>
            <p className="text-blue-800 text-sm">
              See how your situation has evolved since becoming a single parent. Each time you update 
              your situation, we create a snapshot so you can track your progress and see positive changes. 
              Updates also refresh your overview, action plans, and recommendations to match your current situation.
            </p>
          </div>

          {/* Current Situation Summary */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Current Situation</h4>
              <span className="text-sm text-gray-500">
                {currentAssessment ? new Date(currentAssessment.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                {generateCurrentSituationSummary()}
              </p>
            </div>
          </div>

          {/* Progress Comparison */}
          {previousAssessment && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Comparison of Current and Last Update
              </h4>
              <div className="p-6 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="text-green-800 leading-relaxed whitespace-pre-line">
                  {generateComparisonSummary()}
                </div>
              </div>
            </div>
          )}

          {/* Journey Timeline */}
          {assessmentHistory.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Journey Timeline</h4>
              <div className="space-y-6">
                {assessmentHistory.slice().reverse().map((assessment: any, index: number) => {
                  // Generate textual summary for each journey snapshot - prioritize backend data
                  const assessmentSummary = assessment.data.comprehensiveAnalysis?.situationSummary || 
                    "Journey summary is being generated based on HILDA research...";
                  
                  return (
                    <div key={assessment.timestamp} className="relative">
                      <div className="flex gap-4">
                        <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${
                          index === 0 ? 'bg-green-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-lg font-semibold ${
                              index === 0 ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {assessment.type === 'initial' ? 'Initial Journey Map' : 'Situation Update'}
                              {index === 0 && ' (Current)'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(assessment.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="p-4 bg-white border rounded-lg shadow-sm">
                            <p className="text-gray-800 leading-relaxed">
                              {assessmentSummary}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < assessmentHistory.length - 1 && (
                        <div className="absolute left-2 top-8 w-0.5 h-8 bg-gray-300"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* First Time Message */}
          {assessmentHistory.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium mb-2">Your Journey Starts Here</h4>
              <p className="text-sm">
                This is your first assessment. Update your situation over time to see your progress and track changes.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Update Situation Dashboard
  const UpdateDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          
          <h3 id="update-section-header" className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-500" />
            Update Your Situation
          </h3>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What Happens When You Update?</h4>
            <p className="text-blue-800 text-sm">
              Your updated situation generates fresh action plans, recommendations, and insights using HILDA research data. 
              We'll analyze your progress over time and create new personalized strategies based on your current situation.
            </p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateSubmit(); }} className="space-y-6">
            {/* Number of Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 1, label: '1 child' },
                  { value: 2, label: '2 children' },
                  { value: 3, label: '3 children' },
                  { value: 4, label: '4+ children' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setUpdateData({ ...updateData, numberOfChildren: option.value })}
                    className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.numberOfChildren === option.value
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl font-bold text-blue-600 mb-1">{option.value === 4 ? '4+' : option.value}</div>
                    <div className="text-xs font-medium text-gray-700">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Youngest Child Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age of Youngest Child</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { value: 0, label: 'Under 1 year' },
                  { value: 1, label: '1 year old' },
                  { value: 2, label: '2 years old' },
                  { value: 3, label: '3 years old' },
                  { value: 4, label: '4 years old' },
                  { value: 5, label: 'Older than 4 years' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setUpdateData({ ...updateData, childAge: option.value })}
                    className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.childAge === option.value
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Housing Situation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Housing Situation</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'rental_private', label: 'Private Rental' },
                  { value: 'rental_social', label: 'Social Housing' },
                  { value: 'owned', label: 'Own Home' },
                  { value: 'family_friends', label: 'Staying with Family/Friends' },
                  { value: 'transitional', label: 'Transitional/Emergency Housing' },
                  { value: 'other', label: 'Other' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setUpdateData({ ...updateData, housingType: option.value })}
                    className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.housingType === option.value
                        ? 'ring-2 ring-green-500 bg-green-50 border-green-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Annual Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Household Income</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { value: 'under_30k', label: 'Under $30,000' },
                  { value: '30k_50k', label: '$30,000 - $50,000' },
                  { value: '50k_70k', label: '$50,000 - $70,000' },
                  { value: '70k_100k', label: '$70,000 - $100,000' },
                  { value: 'over_100k', label: 'Over $100,000' },
                  { value: 'prefer_not_say', label: 'Prefer not to say' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setUpdateData({ ...updateData, incomeBracket: option.value })}
                    className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.incomeBracket === option.value
                        ? 'ring-2 ring-green-500 bg-green-50 border-green-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { value: 'full_time', label: 'Full-time employed' },
                  { value: 'part_time', label: 'Part-time employed' },
                  { value: 'casual', label: 'Casual work' },
                  { value: 'unemployed', label: 'Looking for work' },
                  { value: 'studying', label: 'Studying/training' },
                  { value: 'home_parent', label: 'Stay-at-home parent' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setUpdateData({ ...updateData, employmentStatus: option.value })}
                    className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.employmentStatus === option.value
                        ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Childcare Usage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Childcare Usage</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { value: 'none', label: 'No formal childcare' },
                  { value: 'occasional', label: 'Occasional/casual care' },
                  { value: 'part_time', label: 'Part-time (1-3 days)' },
                  { value: 'full_time', label: 'Full-time (4+ days)' },
                  { value: 'school_age', label: 'School-age children only' },
                  { value: 'family_support', label: 'Family/friends support' }
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setUpdateData({ ...updateData, childcareUsage: option.value })}
                    className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.childcareUsage === option.value
                        ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Stress Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: 1, label: 'Very Low', color: 'bg-green-100 text-green-800 border-green-200' },
                  { value: 2, label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
                  { value: 3, label: 'Mild', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { value: 4, label: 'Mild', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { value: 5, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { value: 6, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { value: 7, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { value: 8, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { value: 9, label: 'Very High', color: 'bg-red-100 text-red-800 border-red-200' },
                  { value: 10, label: 'Extreme', color: 'bg-red-100 text-red-800 border-red-200' }
                ].map((level) => (
                  <div
                    key={level.value}
                    onClick={() => setUpdateData({ ...updateData, stressLevel: level.value })}
                    className={`p-3 text-center rounded-lg border cursor-pointer transition-all duration-200 ${
                      updateData.stressLevel === level.value
                        ? 'ring-2 ring-orange-500 shadow-lg scale-105'
                        : 'hover:shadow-md'
                    } ${level.color}`}
                  >
                    <div className="text-lg font-bold mb-1">{level.value}</div>
                    <div className="text-xs font-medium">{level.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>1 = No stress</span>
                <span>10 = Overwhelming stress</span>
              </div>
            </div>

            {/* Support Network Strength */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Network Strength</label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { value: 1, label: 'Very Limited' },
                  { value: 2, label: 'Limited' },
                  { value: 3, label: 'Some Support' },
                  { value: 4, label: 'Moderate' },
                  { value: 5, label: 'Strong Network' }
                ].map((level) => (
                  <div
                    key={level.value}
                    onClick={() => setUpdateData({ ...updateData, supportNetworkStrength: level.value })}
                    className={`p-4 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      updateData.supportNetworkStrength === level.value
                        ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl font-bold text-orange-600 mb-1">{level.value}</div>
                    <div className="text-xs font-medium text-gray-700">{level.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Biggest Challenges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Biggest Challenges (select all that apply)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'financial_stress', label: 'Financial stress' },
                  { value: 'housing_instability', label: 'Housing concerns' },
                  { value: 'childcare_costs', label: 'Childcare costs' },
                  { value: 'employment_issues', label: 'Employment challenges' },
                  { value: 'mental_health', label: 'Mental health' },
                  { value: 'social_isolation', label: 'Feeling isolated' },
                  { value: 'time_management', label: 'Managing everything alone' },
                  { value: 'accessing_services', label: 'Accessing support services' }
                ].map((challenge) => (
                  <label key={challenge.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={updateData.biggestChallenges.includes(challenge.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUpdateData({ ...updateData, biggestChallenges: [...updateData.biggestChallenges, challenge.value] });
                        } else {
                          setUpdateData({ ...updateData, biggestChallenges: updateData.biggestChallenges.filter(c => c !== challenge.value) });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{challenge.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Improvement Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Improvement Goals (select up to 3)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: 'reduce_stress', label: 'Reduce stress levels' },
                  { value: 'financial_stability', label: 'Improve financial situation' },
                  { value: 'better_housing', label: 'Find better housing' },
                  { value: 'career_growth', label: 'Advance career/education' },
                  { value: 'social_connections', label: 'Build social connections' },
                  { value: 'self_care', label: 'Focus on self-care' },
                  { value: 'child_wellbeing', label: 'Support children better' },
                  { value: 'life_balance', label: 'Achieve better life balance' }
                ].map((goal) => (
                  <label key={goal.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={updateData.improvementGoals.includes(goal.value)}
                      onChange={(e) => {
                        if (e.target.checked && updateData.improvementGoals.length < 3) {
                          setUpdateData({ ...updateData, improvementGoals: [...updateData.improvementGoals, goal.value] });
                        } else if (!e.target.checked) {
                          setUpdateData({ ...updateData, improvementGoals: updateData.improvementGoals.filter(g => g !== goal.value) });
                        }
                      }}
                      disabled={!updateData.improvementGoals.includes(goal.value) && updateData.improvementGoals.length >= 3}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className={`text-sm ${!updateData.improvementGoals.includes(goal.value) && updateData.improvementGoals.length >= 3 ? 'text-gray-400' : ''}`}>{goal.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Selected: {updateData.improvementGoals.length}/3</p>
            </div>

            {/* Error Display */}
            {updateError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{updateError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateLoading || !isUpdateFormValid() || !hasChanges()}
                className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                  updateLoading || !isUpdateFormValid() || !hasChanges()
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {updateLoading ? 'Updating...' : hasChanges() ? 'Update My Situation' : 'No Changes to Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Your"
        titleGradientText="Journey"
        subtitle="Understanding your experience as a single parent through real data and insights from other families in Victoria"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNavigation />

        {/* Top-level Update Loading Overlay */}
        {updateLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 mx-4 max-w-md w-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Updating Your Situation</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Please wait up to 2 minutes and don't close your browser until we update your journey with fresh insights.
                </p>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={FADE_UP_VARIANT.initial}
          animate={FADE_UP_VARIANT.animate}
          transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
        >
          {activeTab === 'overview' && <OverviewDashboard />}
          {activeTab === 'actions' && <ActionPlanDashboard />}
          {activeTab === 'history' && <HistoryDashboard />}
          {activeTab === 'update' && <UpdateDashboard />}
        </motion.div>

        {/* Scroll Up Prompt */}
        <div className="mt-8 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <Button
              onClick={scrollToTop}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md mx-auto"
            >
              <motion.div
                animate={{ 
                  y: [0, -3, 0]
                }}
                transition={{ 
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ChevronUp className="w-4 h-4" />
              </motion.div>
              See Your Complete Journey Analysis
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Your personalized overview, action plan, and detailed insights are waiting above
            </p>
          </motion.div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-white rounded-lg shadow-lg">
          <div className="text-sm text-gray-600 flex-1">
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="font-semibold text-blue-900 mb-1">Data Attribution</div>
              <div className="text-blue-800 leading-relaxed">
                This journey map uses data from the <strong>Household, Income and Labour Dynamics in Australia (HILDA) Survey Statistical Report 2024</strong>, Melbourne Institute, licensed under CC-BY 3.0 AU. 
                We've applied advanced analytics and AI-powered insights through Google's Gemini to personalize recommendations and generate action plans tailored to your unique situation.
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Please carefully analyze all results and recommendations as AI systems can make errors. Use this as a supportive tool alongside professional advice when making important life decisions.
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button 
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 font-semibold"
            >
              Delete My Data
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete All Journey Data?
              </h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete your journey map, journey history, and all stored data. This action cannot be undone.
              </p>
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} size="lg" className="px-8 py-4 text-lg font-semibold">
                  Cancel
                </Button>
                <Button 
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold" 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteData();
                  }}
                  size="lg"
                >
                  Delete Data
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Success Notification */}
      {showUpdateSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 bg-white border border-green-200 rounded-lg shadow-xl p-6 max-w-sm z-50"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">Journey Updated Successfully!</h4>
              <p className="text-sm text-gray-600 mb-3">
                Your situation has been updated and all sections have been refreshed with new insights and action plans.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  View Overview
                </button>
                <button 
                  onClick={() => setActiveTab('actions')}
                  className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                >
                  New Actions
                </button>
                <button 
                  onClick={() => setShowUpdateSuccess(false)}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
