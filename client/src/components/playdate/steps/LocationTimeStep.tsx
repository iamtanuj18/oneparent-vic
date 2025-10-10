'use client';

import { motion } from 'framer-motion';
import { FormData } from '../hooks/usePlayDateForm';
import { useState, useRef, useEffect } from 'react';
import { fetchSuburbs, SuburbItem } from '@/lib/api/suburbs';
import Image from 'next/image';

interface LocationTimeStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  validationErrors?: Record<string, string>;
}

export function LocationTimeStep({ formData, updateFormData, validationErrors = {} }: LocationTimeStepProps) {
  const [suburbSearch, setSuburbSearch] = useState(formData.suburb || '');
  const [suburbResults, setSuburbResults] = useState<SuburbItem[]>([]);
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false);
  const [loadingSuburbs, setLoadingSuburbs] = useState(false);
  const [suburbValidated, setSuburbValidated] = useState(!!formData.suburb);
  const [timeError, setTimeError] = useState('');
  const [dateError, setDateError] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // get current date and time for validation
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // calculate max date (6 months from today)
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const times = [];
    const isToday = formData.date === today;
    
    // for today: start from 1 hour from now
    // for other days: start from 6 AM
    let startHour = 6;
    let startMinute = 0;
    
    if (isToday) {
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      startHour = oneHourFromNow.getHours();
      startMinute = oneHourFromNow.getMinutes();
      // round up to next 30-minute interval
      if (startMinute > 0 && startMinute <= 30) {
        startMinute = 30;
      } else if (startMinute > 30) {
        startHour += 1;
        startMinute = 0;
      }
    }
    
    // generate times from start time to 11:00 PM
    for (let hour = startHour; hour <= 23; hour++) {
      const minuteStart = (hour === startHour) ? startMinute : 0;
      
      for (let minute = minuteStart; minute < 60; minute += 30) {
        // stop at 11:00 PM (23:00)
        if (hour === 23 && minute > 0) break;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        times.push({
          value: timeString,
          label: formatTime12Hour(timeString)
        });
      }
    }
    
    return times;
  };

  // format time to 12-hour format
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  // helper function to check if time is valid for today
  const isTimeValidForToday = (date: string, time: string) => {
    if (date !== today) return true;
    const selectedDateTime = new Date(`${date}T${time}`);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    return selectedDateTime >= oneHourFromNow;
  };

  // fetch suburb suggestions
  const searchSuburbs = async (query: string) => {
    if (query.length < 3) {
      setSuburbResults([]);
      setShowSuburbDropdown(false);
      return;
    }

    setLoadingSuburbs(true);
    setShowSuburbDropdown(true); // show dropdown immediately when searching
    
    try {
      const data = await fetchSuburbs(query);
      setSuburbResults(data.items || []);
      
      // keep dropdown open if we have results or if still loading
      if (data.items && data.items.length > 0) {
        setShowSuburbDropdown(true);
      }
    } catch (error) {
      // silently handle error - suburbs will remain empty
      setSuburbResults([]);
    } finally {
      setLoadingSuburbs(false);
    }
  };

  // handle suburb search with debouncing
  const handleSuburbSearch = (value: string) => {
    setSuburbSearch(value);
    setSuburbValidated(false); // mark as not validated when typing
    
    // don't clear form data immediately - let user continue typing
    // only clear if they had a previous valid selection and are now changing it
    if (formData.suburb && suburbValidated) {
      updateFormData('suburb', '');
    }
    
    // clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchSuburbs(value);
    }, 500); // increased delay to 500ms for better UX
  };

  // handle suburb selection from dropdown
  const handleSuburbSelect = (suburb: SuburbItem) => {
    setSuburbSearch(suburb.suburb);
    setSuburbValidated(true); // mark as validated
    updateFormData('suburb', suburb.suburb);
    setShowSuburbDropdown(false);
  };

  // handle suburb input blur - validate selection
  const handleSuburbBlur = () => {
    // don't immediately validate - give user time to click dropdown
    setTimeout(() => {
      setShowSuburbDropdown(false);
      
      // only show error if user has stopped typing and didn't select anything
      // don't clear their typing - let them continue
      if (suburbSearch && !suburbValidated && !loadingSuburbs && suburbResults.length === 0) {
        // user typed something but no results found - that's ok, don't clear
        // the validation will catch this when they try to proceed
      }
    }, 300); // longer delay to allow dropdown clicks
  };

  // validate selected date is not in past
  const handleDateChange = (date: string) => {
    setTimeError(''); // clear time error when date changes
    setDateError(''); // clear date error when date changes
    setShowTimePicker(false); // close time picker when date changes
    
    // always update the form data to allow smooth typing
    updateFormData('date', date);
    
    // only validate if we have a complete date and it's not empty
    if (date && date.length >= 8) { // allow both YYYY-MM-DD and partial dates
      // try to parse the date
      const selectedDate = new Date(date + 'T00:00:00');
      
      // only show errors for properly formatted but invalid dates
      if (date.length === 10) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          setDateError('Please enter a valid date format');
          return;
        }
        
        if (isNaN(selectedDate.getTime())) {
          setDateError('Please enter a valid date');
          return;
        }
        
        // check if date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          setDateError('Date cannot be in the past');
          return;
        }
        
        // check if date is not too far in the future (6 months max)
        const maxAllowedDate = new Date();
        maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 6);
        maxAllowedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate > maxAllowedDate) {
          setDateError('Please choose a date within 6 months from now');
          return;
        }
      }
    }
    
    // clear time if the selected time would be invalid for the new date
    if (formData.time && date && !isTimeValidForToday(date, formData.time)) {
      updateFormData('time', '');
    }
  };

  // validate on blur (when user finishes typing and clicks away)
  const handleDateBlur = () => {
    if (formData.date && formData.date.length > 0 && formData.date.length < 10) {
      setDateError('Please enter a complete date');
    }
  };

  // validate time is at least 1 hour from now for today's date
  const handleTimeChange = (time: string) => {
    setTimeError(''); // clear any previous error
    
    // if it's today's date, validate the time is at least 1 hour from now
    if (formData.date && !isTimeValidForToday(formData.date, time)) {
      setTimeError('Please select a time at least 1 hour from now');
      return;
    }
    updateFormData('time', time);
  };

  // clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // handle click outside to close time picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };

    if (showTimePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimePicker]);

  // clear date/time and suburb when switching from outdoor to indoor
  useEffect(() => {
    setTimeError(''); // clear any time errors when preference changes
    setShowTimePicker(false); // close time picker when preference changes
    if (formData.preference === 'indoor') {
      // clear date and time for indoor activities
      if (formData.date) updateFormData('date', '');
      if (formData.time) updateFormData('time', '');
      // clear suburb for indoor activities
      if (formData.suburb) {
        updateFormData('suburb', '');
        setSuburbSearch('');
        setSuburbValidated(false);
      }
    }
  }, [formData.preference]);

  // get validation state to simplify complex conditionals
  const hasValidationError = validationErrors.locationTime;
  const isOutdoorMode = formData.preference === 'outdoor';

  return (
    <div className="space-y-6" data-form-content>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Let's personalise your activity setting</h2>
        <p className="text-base text-gray-600">Tell us about your preferences for location, timing and budget</p>
      </div>

      <div className="space-y-6">
        {/* indoor/outdoor preference */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Where should the activity happen? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'indoor', label: 'Indoor', imageSrc: '/images/indoor-activity.png' },
              { value: 'outdoor', label: 'Outdoor', imageSrc: '/images/outdoor-activity.png' }
            ].map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData('preference', option.value)}
                className={`rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  formData.preference === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* image section */}
                <div className="w-full h-48 relative">
                  <Image
                    src={option.imageSrc}
                    alt={`${option.label} activity`}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* text section */}
                <div className="p-4 text-center">
                  <h3 className={`text-lg font-semibold ${
                    formData.preference === option.value ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </h3>
                </div>
              </motion.button>
            ))}
          </div>
          {hasValidationError && !formData.preference && (
            <p className="text-red-500 text-sm mt-2">Please select indoor or outdoor preference</p>
          )}
        </div>

        {/* suburb selection - only show for outdoor activities */}
        {isOutdoorMode && (
          <div className="relative">
            <label htmlFor="suburb" className="block text-base font-semibold text-gray-900 mb-3">
              Your suburb or town <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="suburb"
                value={suburbSearch}
                onChange={(e) => handleSuburbSearch(e.target.value)}
                onFocus={() => {
                  if (suburbResults.length > 0 || loadingSuburbs) {
                    setShowSuburbDropdown(true);
                  }
                }}
                onBlur={handleSuburbBlur}
                placeholder="e.g., Brunswick, VIC"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  hasValidationError && !formData.suburb 
                    ? 'border-red-300' 
                    : 'border-gray-300'
                }`}
              />
              {loadingSuburbs && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}

              {/* suburb dropdown */}
              {(showSuburbDropdown || loadingSuburbs) && suburbSearch.length >= 3 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {loadingSuburbs ? (
                    <div className="px-4 py-3 text-gray-500 text-sm flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                      Searching suburbs...
                    </div>
                  ) : suburbResults.length > 0 ? (
                    <>
                      {suburbResults.map((suburb) => (
                        <button
                          key={suburb.id}
                          type="button"
                          onMouseDown={(e) => {
                            // Prevent blur event from firing before click
                            e.preventDefault();
                            handleSuburbSelect(suburb);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          {suburb.suburb}
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      No suburbs found for "{suburbSearch}". Try a different search term.
                    </div>
                  )}
                </div>
              )}
            </div>
            {hasValidationError && isOutdoorMode && !formData.suburb && (
              <p className="text-red-500 text-sm mt-2">Please select a valid suburb or town</p>
            )}
          </div>
        )}

        {/* time available */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Time available for activity <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '15 to 30 minutes', label: '15–30 mins' },
              { value: '30 to 60 minutes', label: '30–60 mins' },
              { value: '1 to 2 hours', label: '1–2 hrs' }
            ].map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData('timeAvailable', option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  formData.timeAvailable === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
              </motion.button>
            ))}
          </div>
          {hasValidationError && !formData.timeAvailable && (
            <p className="text-red-500 text-sm mt-2">Please select time availability</p>
          )}
        </div>

        {/* budget */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Your activity budget <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'free', label: 'Free' },
              { value: '15', label: '< $15' },
              { value: '30', label: '< $30' },
              { value: '50', label: '< $50' }
            ].map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData('budget', option.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  formData.budget === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
              </motion.button>
            ))}
          </div>
          {hasValidationError && !formData.budget && (
            <p className="text-red-500 text-sm mt-2">Please select budget range</p>
          )}
        </div>

        {/* date and time selection - only for outdoor activities */}
        {formData.preference === 'outdoor' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="planned-date" className="block text-base font-semibold text-gray-900 mb-3">
                Planned date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="planned-date"
                value={formData.date}
                min={today}
                max={maxDateString}
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={handleDateBlur}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  (hasValidationError && isOutdoorMode && !formData.date) || dateError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {dateError && (
                <p className="text-red-500 text-sm mt-2">{dateError}</p>
              )}
              {hasValidationError && isOutdoorMode && !formData.date && !dateError && (
                <p className="text-red-500 text-sm mt-2">Please select a date</p>
              )}
            </div>

            <div>
              <label htmlFor="start-time" className="block text-base font-semibold text-gray-900 mb-3">
                Start time <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={timePickerRef}>
                <button
                  type="button"
                  onClick={() => formData.date ? setShowTimePicker(!showTimePicker) : null}
                  disabled={!formData.date}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between transition-colors ${
                    !formData.date 
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : (hasValidationError && isOutdoorMode && !formData.time) || timeError
                        ? 'border-red-300 bg-white hover:border-gray-400' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <span className={formData.time ? 'text-gray-900' : 'text-gray-500'}>
                    {!formData.date 
                      ? 'Select date first' 
                      : formData.time 
                        ? formatTime12Hour(formData.time) 
                        : 'Select time'
                    }
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* custom time picker dropdown */}
                {showTimePicker && formData.date && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs text-gray-600 font-medium">Select a time</p>
                    </div>
                    {generateTimeOptions().map((timeOption) => (
                      <button
                        key={timeOption.value}
                        type="button"
                        onClick={() => {
                          handleTimeChange(timeOption.value);
                          setShowTimePicker(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0 ${
                          formData.time === timeOption.value 
                            ? 'bg-blue-50 text-blue-700 font-medium border-blue-100' 
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{timeOption.label}</span>
                          {formData.time === timeOption.value && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                    {generateTimeOptions().length === 0 && (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        No available times for selected date
                      </div>
                    )}
                  </div>
                )}

                {timeError && (
                  <p className="text-red-500 text-sm mt-2">{timeError}</p>
                )}
                {hasValidationError && isOutdoorMode && !formData.time && !timeError && formData.date && (
                  <p className="text-red-500 text-sm mt-2">Please select a time</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}