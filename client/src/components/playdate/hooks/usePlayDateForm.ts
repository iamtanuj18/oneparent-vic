import { useState } from 'react';
import { validatePlaydateInput, generateActivityForMyself, generateActivityWithKids, ActivityResponse } from '../../../lib/api/playdate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ChildInfo {
  id: string;
  gender: 'male' | 'female' | '';
  age: number | '';
  activityStyle: 'calm' | 'active' | 'creative' | 'social' | '';
}

export interface FormData {
  planFor: 'myself' | 'withKids' | '';
  parentType: 'mother' | 'father' | '';
  parentAge: number | '';
  activityEnergyLevel: 'low' | 'moderate' | 'high' | 'very-high' | '';
  suburb: string;
  date: string;
  time: string;
  preference: 'indoor' | 'outdoor' | '';
  timeAvailable: '15-30' | '30-60' | '1-2' | '';
  budget: 'free' | '15' | '30' | '50' | '';
  energyLevel: number[];
  interests: string[];
  goals: string[];
  customIdea: string;
  numKids: number | '';
  kids: ChildInfo[];
}

export interface ActivitySuggestion {
  id: string;
  title: string;
  description: string;
  locationType: string;
  estimatedCost: string;
  estimatedTime: string;
  image: string;
  icon: string;
  category: string;
}

const initialFormData: FormData = {
  planFor: 'myself',
  parentType: '',
  parentAge: '',
  activityEnergyLevel: '',
  suburb: '',
  date: '',
  time: '',
  preference: '',
  timeAvailable: '',
  budget: '',
  energyLevel: [50],
  interests: [],
  goals: [],
  customIdea: '',
  numKids: '',
  kids: [{ id: '1', gender: '', age: '', activityStyle: '' }]
};

export function usePlayDateForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [safetyCheckLoading, setSafetyCheckLoading] = useState(false);
  const [safetyCheckError, setSafetyCheckError] = useState<{
    message: string;
    issues?: string[];
    flaggedItems?: string[];
  } | null>(null);
  const [generatingActivity, setGeneratingActivity] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<ActivityResponse | null>(null);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // auto-adjust kids array when numKids changes
      if (field === 'numKids') {
        const numKidsValue = typeof value === 'string' ? parseInt(value) : value;
        if (!isNaN(numKidsValue) && numKidsValue > 0) {
          const currentKids = prev.kids || [];
          const newKids: ChildInfo[] = [];
          
          for (let i = 0; i < numKidsValue; i++) {
            newKids.push(currentKids[i] || { 
              id: `${i + 1}`, 
              gender: '', 
              age: '', 
              activityStyle: '' 
            });
          }
          
          newData.kids = newKids;
        }
      }
      
      return newData;
    });
    
    // clear validation error when user updates field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: 
        if (!formData.planFor) errors.planFor = 'Please select who you are planning for';
        break;
      case 1: {
        if (!formData.parentType) errors.parentType = 'Please select if you are a mother or father';
        if (!formData.parentAge) errors.parentAge = 'Please enter your age';
        if (!formData.activityEnergyLevel) errors.activityEnergyLevel = 'Please select your activity energy level';
        if (formData.planFor === 'withKids') {
          if (!formData.numKids) {
            errors.numKids = 'Please enter number of kids';
          } else {
            const numKids = parseInt(String(formData.numKids));
            if (isNaN(numKids) || numKids < 1 || numKids > 4) {
              errors.numKids = 'Number of kids must be between 1 and 4';
            }
          }
        }
        break;
      }
      case 2: {
        // kids step validation (only if withKids)
        if (formData.planFor === 'withKids') {
          // check if all kids have complete data and collect all incomplete ones
          const incompleteChildren: number[] = [];
          
          formData.kids.forEach((child, index) => {
            const childIncomplete = !child.gender || !child.age || !child.activityStyle;
            if (childIncomplete) {
              incompleteChildren.push(index + 1);
            }
          });
          
          if (incompleteChildren.length > 0) {
            if (incompleteChildren.length === 1) {
              errors.incompleteChildren = `Please complete information for Child ${incompleteChildren[0]}.`;
            } else if (incompleteChildren.length === formData.numKids) {
              errors.incompleteChildren = `Please complete information for all children.`;
            } else {
              const childList = incompleteChildren.join(', ').replace(/,([^,]*)$/, ' and$1');
              errors.incompleteChildren = `Please complete information for Child ${childList}.`;
            }
          }
          break;
        }
        // if not withKids, fall through to location/time validation
      }
      case (formData.planFor === 'withKids' ? 3 : 2): {
        // location/time step validation
        const locationTimeErrors: string[] = [];
        
        if (!formData.preference) {
          locationTimeErrors.push('activity preference (indoor/outdoor)');
        }
        
        // only require suburb for outdoor activities
        if (formData.preference === 'outdoor' && !formData.suburb) {
          locationTimeErrors.push('suburb location');
        }
        
        if (!formData.timeAvailable) {
          locationTimeErrors.push('time availability');
        }
        
        if (!formData.budget) {
          locationTimeErrors.push('budget range');
        }
        
        // date and time validation only for outdoor activities
        if (formData.preference === 'outdoor') {
          if (!formData.date) {
            locationTimeErrors.push('planned date');
          } else {
            // validate date is not in past
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
              locationTimeErrors.push('date must be today or future');
            }
          }
          
          if (!formData.time) {
            locationTimeErrors.push('start time');
          } else if (formData.date) {
            // validate time is at least 1 hour from now if date is today
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate.getTime() === today.getTime()) {
              const now = new Date();
              const selectedTime = new Date(`${formData.date}T${formData.time}`);
              const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
              
              if (selectedTime < oneHourFromNow) {
                locationTimeErrors.push('time must be at least 1 hour from now');
              }
            }
          }
        }
        
        if (locationTimeErrors.length > 0) {
          if (locationTimeErrors.length === 1) {
            errors.locationTime = `Please provide ${locationTimeErrors[0]}.`;
          } else {
            const lastError = locationTimeErrors.pop();
            errors.locationTime = `Please provide ${locationTimeErrors.join(', ')} and ${lastError}.`;
          }
        }
        break;
      }
        break;
      case (formData.planFor === 'withKids' ? 4 : 3): {
        // interests & goals step validation
        const totalInterests = (formData.interests || []).length;
        const totalGoals = (formData.goals || []).length;
        
        if (totalInterests < 2) {
          errors.interests = `Please add at least 2 interests. You currently have ${totalInterests} selected.`;
        }
        
        if (totalGoals < 2) {
          errors.goals = `Please add at least 2 goals. You currently have ${totalGoals} selected.`;
        }
        break;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
        // fallback: scroll to default position
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }, 50); // small delay to ensure DOM is ready
  };

  const scrollToErrorMessage = () => {
    // scroll to show error message when validation fails
    setTimeout(() => {
      const errorMessage = document.querySelector('[data-error-message]');
      if (errorMessage) {
        const rect = errorMessage.getBoundingClientRect();
        const offsetTop = window.pageYOffset + rect.top;
        // position error message with padding from top
        window.scrollTo({ 
          top: offsetTop - 80, 
          behavior: 'smooth' 
        });
      } else {
        // fallback: scroll to show the form with error
        const formContent = document.querySelector('[data-form-content]');
        if (formContent) {
          const rect = formContent.getBoundingClientRect();
          const offsetTop = window.pageYOffset + rect.top;
          window.scrollTo({ 
            top: offsetTop - 60, 
            behavior: 'smooth' 
          });
        } else {
          // Final fallback - position to show error area
          window.scrollTo({ top: 150, behavior: 'smooth' });
        }
      }
    }, 100); // Delay to ensure error message is rendered
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      const maxSteps = formData.planFor === 'withKids' ? 4 : 3;
      if (currentStep < maxSteps) {
        setCurrentStep(prev => prev + 1);
        // Scroll to top after state update
        setTimeout(scrollToStepIndicator, 100);
      }
    } else {
      // Validation failed - scroll to show error message properly
      setTimeout(scrollToErrorMessage, 100);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // Scroll to top after state update
      setTimeout(scrollToStepIndicator, 100);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setShowResults(false);
    setSuggestions([]);
  };

  const performSafetyCheck = async (): Promise<boolean> => {
    setSafetyCheckLoading(true);
    setSafetyCheckError(null);
    
    try {
      // Use actual API call to validate user inputs
      const response = await validatePlaydateInput(formData);
      
      if (response.safe) {
        setSafetyCheckLoading(false);
        return true;
      } else {
        setSafetyCheckError({
          message: '', // Will use generic message in component
          issues: response.issues || [],
          flaggedItems: response.flaggedItems || []
        });
        setSafetyCheckLoading(false);
        return false;
      }
    } catch (error) {
      setSafetyCheckError({
        message: '', // Will use generic message in component
        issues: [],
        flaggedItems: []
      });
      setSafetyCheckLoading(false);
      return false;
    }
  };

  const clearSafetyError = () => {
    setSafetyCheckError(null);
  };

  const generateActivity = async (isRegenerate: boolean = false): Promise<boolean> => {
    setGeneratingActivity(true);
    
    try {
      let response: ActivityResponse;
      const currentActivityTitle = isRegenerate ? currentActivity?.title : undefined;
      
      if (formData.planFor === 'myself') {
        response = await generateActivityForMyself(formData, currentActivityTitle);
      } else if (formData.planFor === 'withKids') {
        response = await generateActivityWithKids(formData, currentActivityTitle);
      } else {
        throw new Error('Invalid planFor value');
      }
      
      setCurrentActivity(response);
      setGeneratingActivity(false);
      setShowResults(true);
      return true;
    } catch (error) {
      console.error('Failed to generate activity:', error);
      setGeneratingActivity(false);
      return false;
    }
  };

  const startOver = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    setSuggestions([]);
    setLoading(false);
    setShowResults(false);
    setValidationErrors({});
    setSafetyCheckError(null);
    setCurrentActivity(null);
    setGeneratingActivity(false);
  };

  const exportToPDF = async () => {
    if (!currentActivity) return;
    
    try {
      // find the activity results container
      const activityElement = document.getElementById('activity-results');
      if (!activityElement) {
        console.error('Activity results element not found');
        return;
      }

      // show loading state only in export button
      const exportBtn = document.querySelector('[data-export-btn]') as HTMLElement;
      const downloadIcon = exportBtn?.querySelector('svg');
      const originalText = exportBtn?.textContent || 'Export as PDF';
      
      if (exportBtn) {
        exportBtn.innerHTML = `
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Downloading PDF...
        `;
        exportBtn.style.pointerEvents = 'none';
        exportBtn.style.opacity = '0.8';
      }

      // wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // create high-quality canvas
      const canvas = await html2canvas(activityElement, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        logging: false,
        onclone: (clonedDoc: Document) => {
          // Hide action buttons ONLY in the cloned document for PDF (not in the actual DOM)
          const clonedActionButtons = clonedDoc.querySelector('[data-action-buttons]') as HTMLElement;
          if (clonedActionButtons) {
            clonedActionButtons.style.display = 'none';
          }
          
          // Apply basic style fixes for better PDF rendering
          const clonedElement = clonedDoc.getElementById('activity-results');
          if (clonedElement) {
            // Set consistent font rendering
            clonedElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            clonedElement.style.lineHeight = '1.5';
            clonedElement.style.color = '#000000';
            
            // Fix all flex and grid layouts
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              const element = el as HTMLElement;
              try {
                const computedStyle = window.getComputedStyle(element);
                
                // Preserve essential layout styles
                if (computedStyle.display === 'flex') {
                  element.style.display = 'flex';
                  element.style.alignItems = 'center'; // Force center alignment for all flex items
                  element.style.justifyContent = computedStyle.justifyContent || 'flex-start';
                  element.style.gap = computedStyle.gap;
                  element.style.flexWrap = computedStyle.flexWrap;
                }
                
                if (computedStyle.display === 'grid') {
                  element.style.display = 'grid';
                  element.style.gridTemplateColumns = computedStyle.gridTemplateColumns;
                  element.style.gap = computedStyle.gap;
                  element.style.alignItems = 'center'; // Force center alignment for grid items
                }
                
                // Force consistent text baseline for all text elements
                if (element.tagName === 'SPAN' || element.tagName === 'P' || element.tagName === 'DIV' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
                  element.style.lineHeight = computedStyle.lineHeight;
                  element.style.verticalAlign = 'baseline';
                  element.style.display = computedStyle.display;
                }
                
                // Preserve colors and backgrounds
                element.style.backgroundColor = computedStyle.backgroundColor;
                element.style.color = computedStyle.color;
                element.style.borderRadius = computedStyle.borderRadius;
                element.style.padding = computedStyle.padding;
                element.style.margin = computedStyle.margin;
                
                // Fix step circle alignment
                if (element.textContent && /^[1-4]$/.test(element.textContent.trim())) {
                  const classStr = element.className ? element.className.toString() : '';
                  if (classStr.includes('rounded-full')) {
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.textAlign = 'center';
                    element.style.lineHeight = '1';
                    element.style.fontSize = computedStyle.fontSize;
                    element.style.fontWeight = computedStyle.fontWeight;
                  }
                }
                
                // Fix badge text alignment (Indoor, Budget, etc.)
                const classStr = element.className ? element.className.toString() : '';
                if (classStr.includes('inline-flex') && classStr.includes('items-center')) {
                  element.style.display = 'inline-flex';
                  element.style.alignItems = 'center';
                  element.style.justifyContent = 'center';
                  element.style.lineHeight = '1';
                  element.style.verticalAlign = 'middle';
                  element.style.fontSize = computedStyle.fontSize;
                  element.style.fontWeight = computedStyle.fontWeight;
                }
                
                // Fix checkmark icons alignment
                if (element.tagName === 'svg') {
                  element.style.display = 'inline-block';
                  element.style.verticalAlign = 'middle';
                  element.style.flexShrink = '0';
                  // Reset any problematic transforms or positioning
                  element.style.transform = 'none';
                  element.style.position = 'static';
                }
                
                // Fix emoji and icon alignment in text
                if (element.tagName === 'SPAN' && (classStr.includes('emoji') || element.textContent?.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u))) {
                  element.style.verticalAlign = 'baseline';
                  element.style.lineHeight = '1';
                  element.style.display = 'inline';
                }
              } catch (error) {
                // Skip any problematic elements
                console.warn('Style application failed for element:', error);
              }
            });
          }
        }
      } as any);

      // calculate PDF dimensions (A4 format with margins)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const margin = 15; // 15mm margins
      const headerHeight = 25; // space for watermark header
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2) - headerHeight;
      
      // calculate scaling to fit content width
      const scale = contentWidth / canvas.width;
      const scaledHeight = canvas.height * scale;
      
      // create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // add watermark header to first page
      const addWatermarkHeader = (pdf: jsPDF) => {
        // OneParent VIC logo (styled to match the brand)
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60); // dark gray
        pdf.text('oneparent', margin, margin + 10);
        
        // "vic" part in blue
        pdf.setTextColor(59, 130, 246); // blue-600 equivalent
        pdf.text(' vic', margin + 32, margin + 10);
        
        // Playdate Planner title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('- Playdate Planner', margin + 55, margin + 10);
        
        // Website link with underline
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold'); // make it bold
        pdf.setTextColor(59, 130, 246); // blue color
        const linkText = 'Try Now!';
        const linkWidth = pdf.getTextWidth(linkText);
        pdf.textWithLink(linkText, margin + 120, margin + 10, {
          url: 'https://oneparentvic.me/playdate'
        });
        // add underline to the link
        pdf.setLineWidth(0.2);
        pdf.line(margin + 120, margin + 11, margin + 120 + linkWidth, margin + 11);
        
        // separator line below header
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.5);
        pdf.line(margin, margin + 18, pdfWidth - margin, margin + 18);
      };
      
      // add header to first page
      addWatermarkHeader(pdf);
      
      const contentStartY = margin + headerHeight;
      
      if (scaledHeight <= contentHeight) {
        // content fits on single page
        pdf.addImage(
          canvas.toDataURL('image/png', 1.0), 
          'PNG', 
          margin, 
          contentStartY, 
          contentWidth, 
          scaledHeight
        );
      } else {
        // content needs multiple pages
        const totalPages = Math.ceil(scaledHeight / contentHeight);
        let remainingHeight = scaledHeight;
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
            // don't add header to subsequent pages - only first page gets watermark
          }
          
          const pageContentHeight = Math.min(contentHeight, remainingHeight);
          const sourceY = page * contentHeight / scale;
          const sourceHeight = Math.min(contentHeight / scale, canvas.height - sourceY);
          
          // create canvas section for this page
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          
          if (pageCtx) {
            // fill with white background
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            
            // draw the section of the main canvas
            pageCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, pageCanvas.width, pageCanvas.height
            );
            
            // for first page, use contentStartY (below header), for others use margin (top of page)
            const yPosition = page === 0 ? contentStartY : margin;
            
            pdf.addImage(
              pageCanvas.toDataURL('image/png', 1.0), 
              'PNG', 
              margin, 
              yPosition, 
              contentWidth, 
              pageContentHeight
            );
          }
          
          remainingHeight -= contentHeight;
        }
      }

      // generate filename with activity title and timestamp
      const sanitizedTitle = currentActivity.title
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 25);
      
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      const filename = `OneParent_${sanitizedTitle}_${timestamp}.pdf`;
      
      // save PDF
      pdf.save(filename);
      
      // show success feedback briefly
      if (exportBtn) {
        exportBtn.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Downloaded!
        `;
        exportBtn.style.backgroundColor = '#10b981';
        exportBtn.style.color = 'white';
        exportBtn.style.borderColor = '#10b981';
        
        setTimeout(() => {
          // restore original button
          if (downloadIcon) {
            exportBtn.innerHTML = '';
            exportBtn.appendChild(downloadIcon.cloneNode(true));
            exportBtn.appendChild(document.createTextNode(' Export as PDF'));
          } else {
            exportBtn.textContent = originalText;
          }
          exportBtn.style.pointerEvents = 'auto';
          exportBtn.style.opacity = '1';
          exportBtn.style.backgroundColor = '';
          exportBtn.style.color = '';
          exportBtn.style.borderColor = '';
        }, 2000);
      }
      
    } catch (error) {
      console.error('PDF export failed:', error);
      
      // Show more specific error message
      let errorMessage = 'Failed to export PDF. ';
      if (error instanceof Error) {
        if (error.message.includes('NetworkError')) {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('className')) {
          errorMessage += 'Content rendering issue. Please refresh the page and try again.';
        } else {
          errorMessage += 'Please try again or refresh the page.';
        }
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
      
      // restore button if error occurs
      const exportBtn = document.querySelector('[data-export-btn]') as HTMLElement;
      if (exportBtn) {
        exportBtn.innerHTML = `
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Export as PDF
        `;
        exportBtn.style.pointerEvents = 'auto';
        exportBtn.style.opacity = '1';
        exportBtn.style.backgroundColor = '';
        exportBtn.style.color = '';
        exportBtn.style.borderColor = '';
      }
    }
  };

  return {
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
  };
}