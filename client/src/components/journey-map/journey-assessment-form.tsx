'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Calendar, User, Heart, Home, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { StepIndicator } from '@/components/playdate/StepIndicator';
import { ANIMATION_CONFIG, FADE_UP_VARIANT } from '@/lib/animation';
import { AssessmentRequest } from '@/lib/api/journey-map';
import Image from 'next/image';

interface AssessmentFormData {
  separationDate: string;
  childAge: number | null;
  numberOfChildren: number | null;
  housingType: string;
  employmentStatus: string;
  incomeBracket: string;
  childcareUsage: string;
  stressLevel: number | null;
  supportNetworkStrength: number | null;
  biggestChallenges: string[];
  improvementGoals: string[];
}

interface JourneyAssessmentFormProps {
  onBackToIntro: () => void;
  onAssessmentComplete: (data: AssessmentRequest) => void;
}

export function JourneyAssessmentForm({ onBackToIntro, onAssessmentComplete }: JourneyAssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AssessmentFormData>({
    separationDate: '',
    childAge: null,
    numberOfChildren: null,
    housingType: '',
    employmentStatus: '',
    incomeBracket: '',
    childcareUsage: '',
    stressLevel: null,
    supportNetworkStrength: null,
    biggestChallenges: [],
    improvementGoals: []
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dateError, setDateError] = useState('');

  // get current date for validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];
  
  // calculate min date (20 years back from today)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 20);
  const minDateString = minDate.toISOString().split('T')[0];

  const steps = [
    "When your single parenthood began?",
    "About your family", 
    "Living & financial situation",
    "Employment & childcare",
    "Wellbeing & support goals"
  ];

  // update form data helper
  const updateFormData = (field: keyof AssessmentFormData, value: string | number | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // clear error when user makes selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // handle separation date change with real-time validation
  const handleSeparationDateChange = (date: string) => {
    setDateError(''); // clear any previous error
    updateFormData('separationDate', date);
    
    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        setDateError('Single parenthood cannot begin in the future');
        return;
      }
      
      // check if date is not too far in the past (20 years max)
      const minAllowedDate = new Date();
      minAllowedDate.setFullYear(minAllowedDate.getFullYear() - 20);
      minAllowedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < minAllowedDate) {
        setDateError('Please choose a date within the last 20 years');
        return;
      }
    }
  };

  // validate on blur (when user finishes typing and clicks away)
  const handleDateBlur = () => {
    if (formData.separationDate && formData.separationDate.length > 0 && formData.separationDate.length < 10) {
      setDateError('Please enter a complete date');
    }
  };

  // validation for each step
  const validateCurrentStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (currentStep) {
      case 0:
        if (!formData.separationDate) {
          newErrors.separationDate = 'please select when your single parenthood began';
        } else {
          const selectedDate = new Date(formData.separationDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (selectedDate > today) {
            newErrors.separationDate = 'single parenthood cannot begin in the future';
          } else {
            // check if date is not too far in the past (20 years max)
            const minAllowedDate = new Date();
            minAllowedDate.setFullYear(minAllowedDate.getFullYear() - 20);
            minAllowedDate.setHours(0, 0, 0, 0);
            
            if (selectedDate < minAllowedDate) {
              newErrors.separationDate = 'please choose a date within the last 20 years';
            }
          }
        }
        break;
      case 1:
        if (formData.numberOfChildren === null) {
          newErrors.numberOfChildren = 'please select how many children you have';
        } else if (formData.childAge === null) {
          newErrors.childAge = 'please select your youngest child age';
        }
        break;
      case 2:
        if (!formData.housingType) {
          newErrors.housingType = 'please select your housing situation';
        }
        if (!formData.incomeBracket) {
          newErrors.incomeBracket = 'please select your income bracket';
        }
        break;
      case 3:
        if (!formData.employmentStatus) {
          newErrors.employmentStatus = 'please select your employment status';
        }
        if (!formData.childcareUsage) {
          newErrors.childcareUsage = 'please select your childcare usage';
        }
        break;
      case 4:
        if (formData.stressLevel === null) {
          newErrors.stressLevel = 'please select your current stress level';
        }
        if (formData.supportNetworkStrength === null) {
          newErrors.supportNetworkStrength = 'please rate your support network strength';
        }
        if (formData.biggestChallenges.length === 0) {
          newErrors.biggestChallenges = 'please select at least one challenge you are facing';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // navigation handlers
  const scrollToStepIndicator = () => {
    // scroll to show step indicator at top of viewport
    setTimeout(() => {
      const stepIndicator = document.getElementById('step-indicator-anchor');
      if (stepIndicator) {
        // calculate position to show steps counter clearly at top
        const rect = stepIndicator.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // position so steps are visible with space above
        const targetPosition = rect.top + scrollTop - 100; // space above for positioning
        
        window.scrollTo({ 
          top: Math.max(50, targetPosition), // minimum 50px from top
          behavior: 'smooth' 
        });
      } else {
        // fallback scroll to default position
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }, 100); // delay to ensure dom is ready
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === steps.length - 1) {
        // final step complete journey mapping
        // convert form data to api format
        const assessmentData: AssessmentRequest = {
          separationDate: formData.separationDate,
          childAge: formData.childAge || 0,
          numberOfChildren: formData.numberOfChildren || 1,
          housingType: formData.housingType,
          employmentStatus: formData.employmentStatus,
          incomeBracket: formData.incomeBracket,
          childcareUsage: formData.childcareUsage,
          stressLevel: formData.stressLevel || 5,
          supportNetworkStrength: formData.supportNetworkStrength || 5,
          biggestChallenges: formData.biggestChallenges,
          improvementGoals: formData.improvementGoals
        };
        onAssessmentComplete(assessmentData);
      } else {
        setCurrentStep(prev => prev + 1);
        setDateError(''); // clear date error when progressing to next step
        // scroll to step indicator after state update
        setTimeout(scrollToStepIndicator, 100);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // scroll to step indicator after state update
      setTimeout(scrollToStepIndicator, 100);
    } else {
      onBackToIntro();
    }
  };

  // step 1 separation date selection
  const renderSeparationDateStep = () => (
    <motion.div 
      className="space-y-8"
      initial={FADE_UP_VARIANT.initial}
      animate={FADE_UP_VARIANT.animate}
      transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">When your single parenthood began</h2>
        <p className="text-gray-600">This helps us understand where you are in your journey</p>
      </div>

      <div className="max-w-md mx-auto">
        <label htmlFor="separation-date" className="block text-sm font-medium text-gray-700 mb-2">
          Single parenthood start date
        </label>
        <input
          id="separation-date"
          type="date"
          value={formData.separationDate}
          onChange={(e) => handleSeparationDateChange(e.target.value)}
          onBlur={handleDateBlur}
          min={minDateString}
          max={todayString}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
            dateError || errors.separationDate ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {(dateError || errors.separationDate) && (
          <p className="mt-2 text-sm text-red-600">{dateError || errors.separationDate}</p>
        )}
      </div>
    </motion.div>
  );

  // step 2 family information
  const renderFamilyInfoStep = () => {
    const childAgeOptions = [
      { value: 0, label: 'under 1 year', image: '/images/boy-selection.png' },
      { value: 1, label: '1 year old', image: '/images/boy-selection.png' },
      { value: 2, label: '2 years old', image: '/images/boy-selection.png' },
      { value: 3, label: '3 years old', image: '/images/boy-selection.png' },
      { value: 4, label: '4 years old', image: '/images/boy-selection.png' },
      { value: 5, label: 'older than 4 years', image: '/images/boy-selection.png' }
    ];

    const numberOfChildrenOptions = [
      { value: 1, label: '1 child' },
      { value: 2, label: '2 children' },
      { value: 3, label: '3 children' },
      { value: 4, label: '4+ children' }
    ];

    return (
      <motion.div 
        className="space-y-8"
        initial={FADE_UP_VARIANT.initial}
        animate={FADE_UP_VARIANT.animate}
        transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">About your family</h2>
        </div>

        {/* number of children */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How many children do you have?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {numberOfChildrenOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => {
                    updateFormData('numberOfChildren', option.value);
                    // clear child age if user selects different number
                    if (option.value === 0) {
                      updateFormData('childAge', null);
                    }
                  }}
                  className={`p-4 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.numberOfChildren === option.value
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-blue-600 mb-2">{option.value === 4 ? '4+' : option.value}</div>
                  <div className="text-sm font-medium text-gray-700">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.numberOfChildren && (
            <p className="text-center text-sm text-red-600">{errors.numberOfChildren}</p>
          )}
        </div>

        {/* youngest child age */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How old is your youngest child?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childAgeOptions.map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    onClick={() => updateFormData('childAge', option.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      formData.childAge === option.value
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden">
                        <Image
                          src={option.image}
                          alt={option.label}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          sizes="80px"
                        />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">{option.label}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {errors.childAge && (
              <p className="text-center text-sm text-red-600">{errors.childAge}</p>
            )}
          </div>
      </motion.div>
    );
  };

  // step 3 living and financial situation
  const renderLivingFinancialStep = () => {
    const housingOptions = [
      { value: 'rental_private', label: 'Private rental', icon: '🏠' },
      { value: 'rental_social', label: 'Social housing', icon: '🏡' },
      { value: 'owned', label: 'Own home', icon: '🏠' },
      { value: 'family_friends', label: 'Staying with family/friends', icon: '👥' },
      { value: 'transitional', label: 'Transitional/emergency housing', icon: '🏠' },
      { value: 'other', label: 'Other', icon: '📍' }
    ];

    const incomeOptions = [
      { value: 'under_30k', label: 'Under $30,000' },
      { value: '30k_50k', label: '$30,000 - $50,000' },
      { value: '50k_70k', label: '$50,000 - $70,000' },
      { value: '70k_100k', label: '$70,000 - $100,000' },
      { value: 'over_100k', label: 'Over $100,000' },
      { value: 'prefer_not_say', label: 'Prefer not to say' }
    ];

    return (
      <motion.div 
        className="space-y-8"
        initial={FADE_UP_VARIANT.initial}
        animate={FADE_UP_VARIANT.animate}
        transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your living and financial situation</h2>
        </div>

        {/* housing type */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">What is your current housing situation?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {housingOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => updateFormData('housingType', option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.housingType === option.value
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.housingType && (
            <p className="text-center text-sm text-red-600">{errors.housingType}</p>
          )}
        </div>

        {/* income bracket */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Annual household income (optional but helps with insights)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {incomeOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => updateFormData('incomeBracket', option.value)}
                  className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.incomeBracket === option.value
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.incomeBracket && (
            <p className="text-center text-sm text-red-600">{errors.incomeBracket}</p>
          )}
        </div>
      </motion.div>
    );
  };

  // step 4 employment and childcare
  const renderEmploymentChildcareStep = () => {
    const employmentOptions = [
      { value: 'full_time', label: 'Full time employed', icon: '💼' },
      { value: 'part_time', label: 'Part time employed', icon: '🕐' },
      { value: 'casual', label: 'Casual work', icon: '📅' },
      { value: 'unemployed', label: 'Looking for work', icon: '🔍' },
      { value: 'studying', label: 'Studying/training', icon: '📚' },
      { value: 'home_parent', label: 'Stay at home parent', icon: '👶' }
    ];

    const childcareOptions = [
      { value: 'none', label: 'No formal childcare' },
      { value: 'occasional', label: 'Occasional/casual care' },
      { value: 'part_time', label: 'Part time (1-3 days)' },
      { value: 'full_time', label: 'Full time (4+ days)' },
      { value: 'school_age', label: 'School age children only' },
      { value: 'family_support', label: 'Family/friends support' }
    ];

    return (
      <motion.div 
        className="space-y-8"
        initial={FADE_UP_VARIANT.initial}
        animate={FADE_UP_VARIANT.animate}
        transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Employment and Childcare</h2>
        </div>

        {/* employment status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">What is your current employment status?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employmentOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => updateFormData('employmentStatus', option.value)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.employmentStatus === option.value
                      ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-2">{option.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm">{option.label}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.employmentStatus && (
            <p className="text-center text-sm text-red-600">{errors.employmentStatus}</p>
          )}
        </div>

        {/* childcare usage */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How much formal childcare do you use?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {childcareOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => updateFormData('childcareUsage', option.value)}
                  className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.childcareUsage === option.value
                      ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.childcareUsage && (
            <p className="text-center text-sm text-red-600">{errors.childcareUsage}</p>
          )}
        </div>
      </motion.div>
    );
  };

  // step 5 wellbeing and support goals
  const renderWellbeingSupportStep = () => {
    const stressLevels = [
      { value: 1, label: 'Very low', color: 'bg-green-100 text-green-800 border-green-200' },
      { value: 2, label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
      { value: 3, label: 'Mild', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { value: 4, label: 'Mild', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { value: 5, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      { value: 6, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      { value: 7, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      { value: 8, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      { value: 9, label: 'Very high', color: 'bg-red-100 text-red-800 border-red-200' },
      { value: 10, label: 'Extreme', color: 'bg-red-100 text-red-800 border-red-200' }
    ];

    const supportLevels = [
      { value: 1, label: 'Very limited' },
      { value: 2, label: 'Limited' },
      { value: 3, label: 'Some support' },
      { value: 4, label: 'Moderate' },
      { value: 5, label: 'Strong network' }
    ];

    const challengeOptions = [
      { value: 'financial_stress', label: 'Financial stress' },
      { value: 'housing_instability', label: 'Housing concerns' },
      { value: 'childcare_costs', label: 'Childcare costs' },
      { value: 'employment_issues', label: 'Employment challenges' },
      { value: 'mental_health', label: 'Mental health' },
      { value: 'social_isolation', label: 'Feeling isolated' },
      { value: 'time_management', label: 'Managing everything alone' },
      { value: 'accessing_services', label: 'Accessing support services' }
    ];

    const improvementGoals = [
      { value: 'reduce_stress', label: 'Reduce stress levels' },
      { value: 'financial_stability', label: 'Improve financial situation' },
      { value: 'better_housing', label: 'Find better housing' },
      { value: 'career_growth', label: 'Advance career/education' },
      { value: 'social_connections', label: 'Build social connections' },
      { value: 'self_care', label: 'Focus on self-care' },
      { value: 'child_wellbeing', label: 'Support children better' },
      { value: 'life_balance', label: 'Achieve better life balance' }
    ];

    return (
      <motion.div 
        className="space-y-8"
        initial={FADE_UP_VARIANT.initial}
        animate={FADE_UP_VARIANT.animate}
        transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Wellbeing and Support Goals</h2>
        </div>

        {/* stress level */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How would you rate your current stress level?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stressLevels.map((level) => (
              <motion.div
                key={level.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  onClick={() => updateFormData('stressLevel', level.value)}
                  className={`p-4 text-center rounded-lg border cursor-pointer transition-all duration-200 ${
                    formData.stressLevel === level.value
                      ? 'ring-2 ring-orange-500 shadow-lg scale-105'
                      : 'hover:shadow-md'
                  } ${level.color}`}
                >
                  <div className="text-2xl font-bold mb-1">{level.value}</div>
                  <div className="text-xs font-medium">{level.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <span>1 = no stress</span>
            <span>10 = overwhelming stress</span>
          </div>
          {errors.stressLevel && (
            <p className="text-center text-sm text-red-600">{errors.stressLevel}</p>
          )}
        </div>

        {/* support network strength */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">How would you rate your support network?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {supportLevels.map((level) => (
              <motion.div
                key={level.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => updateFormData('supportNetworkStrength', level.value)}
                  className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.supportNetworkStrength === level.value
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl font-bold text-blue-600 mb-1">{level.value}</div>
                  <div className="text-xs font-medium text-gray-700">{level.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.supportNetworkStrength && (
            <p className="text-center text-sm text-red-600">{errors.supportNetworkStrength}</p>
          )}
        </div>

        {/* biggest challenges */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">What are your biggest challenges right now? (Select all that apply)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {challengeOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => {
                    const currentChallenges = formData.biggestChallenges;
                    const isSelected = currentChallenges.includes(option.value);
                    const newChallenges = isSelected 
                      ? currentChallenges.filter(c => c !== option.value)
                      : [...currentChallenges, option.value];
                    updateFormData('biggestChallenges', newChallenges);
                  }}
                  className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.biggestChallenges.includes(option.value)
                      ? 'ring-2 ring-red-500 bg-red-50 border-red-500 shadow-lg'
                      : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {errors.biggestChallenges && (
            <p className="text-center text-sm text-red-600">{errors.biggestChallenges}</p>
          )}
        </div>

        {/* improvement goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">What would you most like to improve? (Select up to 3)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {improvementGoals.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  onClick={() => {
                    const currentGoals = formData.improvementGoals;
                    const isSelected = currentGoals.includes(option.value);
                    let newGoals;
                    if (isSelected) {
                      newGoals = currentGoals.filter(g => g !== option.value);
                    } else if (currentGoals.length < 3) {
                      newGoals = [...currentGoals, option.value];
                    } else {
                      return;
                    }
                    updateFormData('improvementGoals', newGoals);
                  }}
                  className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.improvementGoals.includes(option.value)
                      ? 'ring-2 ring-green-500 bg-green-50 border-green-500 shadow-lg'
                      : formData.improvementGoals.length >= 3
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center">
            Selected {formData.improvementGoals.length} out of 3
          </p>
        </div>
      </motion.div>
    );
  };

  // get current step component
  const getStepComponent = () => {
    switch (currentStep) {
      case 0:
        return renderSeparationDateStep();
      case 1:
        return renderFamilyInfoStep();
      case 2:
        return renderLivingFinancialStep();
      case 3:
        return renderEmploymentChildcareStep();
      case 4:
        return renderWellbeingSupportStep();
      default:
        return null;
    }
  };

  // render navigation buttons matching playdate style
  const renderNavigationButtons = () => (
    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 px-4 sm:px-0">
      <Button
        variant="outline"
        size="lg"
        onClick={handlePrevious}
        className="flex items-center justify-center w-full sm:w-auto order-2 sm:order-1"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {currentStep === 0 ? 'Back' : 'Previous'}
      </Button>

      <Button
        variant="primary"
        size="lg"
        onClick={handleNext}
        className="flex items-center justify-center w-full sm:w-auto order-1 sm:order-2"
      >
        {currentStep === steps.length - 1 ? (
          'Create My Journey Map'
        ) : (
          <>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Your"
        titleGradientText="Journey"
        subtitle="Understanding your experience as a single parent through real data and insights from other families in Victoria"
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 sm:pb-32">
        {/* progress indicator */}
        <div id="step-indicator-anchor" className="mb-8 sm:mb-12">
          <StepIndicator 
            steps={steps}
            currentStep={currentStep}
            showAllSteps={true}
          />
        </div>

        {/* form content sections */}
        <div className="mb-6 sm:mb-8 bg-white shadow-lg border-0 mx-1 sm:mx-0 rounded-lg">
          <div className="p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8 lg:pt-9">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {getStepComponent()}
            </motion.div>
          </div>
        </div>

        {/* navigation buttons */}
        <motion.div
          key={`nav-${currentStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {renderNavigationButtons()}
        </motion.div>
      </div>
    </div>
  );
}