'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { StepIndicator } from './StepIndicator';
import { PlanTargetStep } from './steps/PlanTargetStep';
import { AboutYouStep } from './steps/AboutYouStep';
import { AboutKidsStep } from './steps/AboutKidsStep';
import { LocationTimeStep } from './steps/LocationTimeStep';
import { InterestsGoalsStep } from './steps/InterestsGoalsStep';
import { usePlayDateForm } from './hooks/usePlayDateForm';
import { SafetyCheckLoader } from './SafetyCheckLoader';
import { ActivityResults } from './ActivityResults';
import { ActivitySkeleton } from './ActivitySkeleton';

export function PlayDatePlanner() {
  const [step1Error, setStep1Error] = useState('');
  const {
    currentStep,
    formData,
    loading,
    showResults,
    suggestions,
    validationErrors,
    safetyCheckLoading,
    safetyCheckError,
    generatingActivity,
    currentActivity,
    updateFormData,
    nextStep,
    prevStep,
    resetForm,
    validateCurrentStep,
    performSafetyCheck,
    clearSafetyError,
    generateActivity,
    startOver,
    exportToPDF
  } = usePlayDateForm();

  // dynamic steps based on plan type
  const isWithKids = formData.planFor === 'withKids';
  const steps = isWithKids 
    ? [
        "Who's this for?",
        "About You", 
        "About your kid(s)",
        "Setting & time",
        "Interests & goals"
      ]
    : [
        "Who's this for?",
        "About You",
        "Setting & time", 
        "Interests & goals"
      ];

  // step component configuration to reduce repetitive logic
  const getStepComponent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PlanTargetStep
            formData={formData}
            updateFormData={handleFormDataUpdate}
            error={step1Error}
          />
        );
      case 1:
        return (
          <AboutYouStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
          />
        );
      case 2:
        if (isWithKids) {
          return (
            <AboutKidsStep
              formData={formData}
              updateFormData={updateFormData}
              validationErrors={validationErrors}
            />
          );
        } else {
          return (
            <LocationTimeStep
              formData={formData}
              updateFormData={updateFormData}
              validationErrors={validationErrors}
            />
          );
        }
      case 3:
        if (isWithKids) {
          return (
            <LocationTimeStep
              formData={formData}
              updateFormData={updateFormData}
              validationErrors={validationErrors}
            />
          );
        } else {
          return (
            <InterestsGoalsStep
              formData={formData}
              updateFormData={updateFormData}
              validationErrors={validationErrors}
              onSafetyCheck={performSafetyCheck}
              safetyCheckError={safetyCheckError}
              onClearSafetyError={clearSafetyError}
            />
          );
        }
      case 4:
        return (
          <InterestsGoalsStep
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            onSafetyCheck={performSafetyCheck}
            safetyCheckError={safetyCheckError}
            onClearSafetyError={clearSafetyError}
          />
        );
      default:
        return null;
    }
  };

  // render navigation buttons based on current step
  const renderNavigationButtons = () => {
    if (currentStep === 0) {
      return (
        <div className="flex justify-center px-4 sm:px-0">
          <Button
            onClick={handleStartPlanning}
            variant="primary"
            size="lg"
            className="flex items-center w-full sm:w-auto justify-center"
          >
            Start
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 px-4 sm:px-0">
        <Button
          variant="outline"
          size="lg"
          onClick={prevStep}
          className="flex items-center justify-center w-full sm:w-auto order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handleNextStep}
          className="flex items-center justify-center w-full sm:w-auto order-1 sm:order-2"
        >
          {currentStep === steps.length - 1 ? (
            'Generate Activities'
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    );
  };

  // handle start planning button for first step
  const handleStartPlanning = () => {
    if (formData.planFor === '') {
      setStep1Error('Please select who you are planning for to continue');
      return;
    }
    setStep1Error('');
    nextStep();
  };

  // handle next step or generate activities on final step
  const handleNextStep = async () => {
    if (currentStep === steps.length - 1) {
      if (validateCurrentStep()) {
        // clear any previous safety errors when user tries again
        if (safetyCheckError && clearSafetyError) {
          clearSafetyError();
        }
        
        // perform safety check before generating activities
        const isSafe = await performSafetyCheck();
        if (isSafe) {
          // scroll to main content section immediately before generating (with offset above)
          setTimeout(() => {
            const mainContentSection = document.getElementById('main-content-section');
            if (mainContentSection) {
              const elementPosition = mainContentSection.offsetTop;
              const offsetPosition = elementPosition - 80; // 80px above the section
              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
          }, 100);
          // if safety check passes, generate the activity
          await generateActivity(false);
        }
        // if not safe, error will be displayed automatically via safetyCheckError
      }
    } else {
      nextStep();
    }
  };

  const handleRegenerate = async () => {
    // scroll to main content section immediately when regenerate is clicked (with offset above)
    setTimeout(() => {
      const mainContentSection = document.getElementById('main-content-section');
      if (mainContentSection) {
        const elementPosition = mainContentSection.offsetTop;
        const offsetPosition = elementPosition - 80; // 80px above the section
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 50);
    await generateActivity(true); // true indicates this is a regeneration
  };

  // update form data and clear step 1 error when selection is made
  const handleFormDataUpdate = (field: keyof typeof formData, value: any) => {
    if (field === 'planFor' && step1Error) {
      setStep1Error('');
    }
    updateFormData(field, value);
  };

  // render results screen when suggestions are ready
  if (showResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="PlayDate"
          titleGradientText="AI Planner"
          subtitle="Get personalized activities generated for yourself or to do with your kids based on your preferences"
        />
        
        <div className="max-w-4xl mx-auto px-6 py-8" id="main-content-section">
          {generatingActivity ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-full px-6 py-3 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700 font-medium">Generating activity...</span>
                </div>
                <p className="text-gray-600 text-sm">This could take up to 2 minutes. Thank you for your patience.</p>
              </div>
              <ActivitySkeleton 
                isForMyself={formData.planFor === 'myself'}
                isOutdoor={formData.preference === 'outdoor'}
              />
            </div>
          ) : currentActivity ? (
            <ActivityResults
              activity={currentActivity}
              isForMyself={formData.planFor === 'myself'}
              onRegenerate={handleRegenerate}
              onStartOver={startOver}
              onExportPDF={exportToPDF}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">We are sorry, but no activity is available at this time.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // main form wizard interface
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="PlayDate"
        titleGradientText="AI Planner"
        subtitle="Get personalized activities generated for yourself or to do with your kids based on your preferences"
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 sm:pb-32" id="main-content-section">
        {/* progress indicator */}
        <div id="step-indicator-anchor" className="mb-8 sm:mb-12">
          {generatingActivity ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-full px-6 py-3 mb-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-700 font-medium">Generating activity...</span>
                </div>
                <p className="text-gray-600 text-sm">This could take up to 2 min. Thank you for your patience.</p>
              </div>
              <ActivitySkeleton 
                isForMyself={formData.planFor === 'myself'}
                isOutdoor={formData.preference === 'outdoor'}
              />
            </div>
          ) : (
            <StepIndicator 
              steps={steps}
              currentStep={currentStep}
              showAllSteps={true}
            />
          )}
        </div>

        {/* form content wrapper */}
        <Card className="mb-6 sm:mb-8 bg-white shadow-lg border-0 mx-1 sm:mx-0" data-form-content>
          <CardContent className="p-4 sm:p-6 lg:p-8 pt-6 sm:pt-8 lg:pt-9">
            {!generatingActivity && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {getStepComponent()}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* navigation buttons */}
        {!generatingActivity && (
          <motion.div
            key={`nav-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {renderNavigationButtons()}
          </motion.div>
        )}
      </div>

      {/* safety check loading overlay */}
      {safetyCheckLoading && <SafetyCheckLoader />}
    </div>
  );
}