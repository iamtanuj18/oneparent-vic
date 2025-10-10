import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Copy, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ScheduleInputProps {
  onScheduleUpdate: (data: any) => void;
  existingData: any;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WORD_LIMIT = 200;

export function ScheduleInput({ onScheduleUpdate, existingData }: ScheduleInputProps) {
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (existingData?.schedules) {
      setSchedules(existingData.schedules);
      // Calculate word counts for existing data
      const counts = {};
      Object.entries(existingData.schedules).forEach(([day, schedule]) => {
        counts[day] = (schedule as string).split(/\s+/).filter(word => word.length > 0).length;
      });
      setWordCounts(counts);
    }
  }, [existingData]);

  const handleScheduleChange = (day: string, value: string) => {
    const words = value.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    if (wordCount <= WORD_LIMIT) {
      setSchedules(prev => ({ ...prev, [day]: value }));
      setWordCounts(prev => ({ ...prev, [day]: wordCount }));
    } else {
      toast.error(`Word limit exceeded for ${day}. Maximum ${WORD_LIMIT} words allowed.`);
    }
  };

  const handleCopyFromDay = (targetDay: string, sourceDay: string) => {
    if (schedules[sourceDay]) {
      setSchedules(prev => ({ ...prev, [targetDay]: schedules[sourceDay] }));
      setWordCounts(prev => ({ ...prev, [targetDay]: wordCounts[sourceDay] }));
      toast.success(`Copied schedule from ${sourceDay} to ${targetDay}`);
    }
  };

  const analyzeSchedule = () => {
    // Mock AI analysis - in real implementation, this would call Gemini API
    const mockAnalysis = generateMockAnalysis(schedules);
    onScheduleUpdate({
      schedules,
      timeAnalysis: mockAnalysis.timeAnalysis,
      freeTime: mockAnalysis.freeTime,
      suggestions: mockAnalysis.suggestions
    });
    toast.success('Schedule analyzed successfully!');
  };

  const generateMockAnalysis = (schedules: Record<string, string>) => {
    // Mock time pattern analysis
    const categories = [
      { name: 'Work', hours: 40, color: '#3B82F6' },
      { name: 'Childcare', hours: 35, color: '#EF4444' },
      { name: 'Personal', hours: 15, color: '#10B981' },
      { name: 'Sleep', hours: 56, color: '#8B5CF6' },
      { name: 'Free Time', hours: 12, color: '#F59E0B' }
    ];

    // Mock free time pockets
    const freeTime = [
      { day: 'Monday', time: '9:00 PM - 10:30 PM', duration: 1.5, activity: 'Personal time' },
      { day: 'Tuesday', time: '7:00 AM - 8:00 AM', duration: 1, activity: 'Morning routine' },
      { day: 'Wednesday', time: '12:00 PM - 1:00 PM', duration: 1, activity: 'Lunch break' },
      { day: 'Thursday', time: '8:30 PM - 10:00 PM', duration: 1.5, activity: 'Evening wind down' },
      { day: 'Friday', time: '2:00 PM - 3:30 PM', duration: 1.5, activity: 'Afternoon break' },
      { day: 'Saturday', time: '10:00 AM - 12:00 PM', duration: 2, activity: 'Weekend morning' },
      { day: 'Saturday', time: '7:00 PM - 9:00 PM', duration: 2, activity: 'Weekend evening' },
      { day: 'Sunday', time: '11:00 AM - 1:00 PM', duration: 2, activity: 'Sunday leisure' },
      { day: 'Sunday', time: '3:00 PM - 4:30 PM', duration: 1.5, activity: 'Sunday afternoon' },
      { day: 'Sunday', time: '8:00 PM - 9:30 PM', duration: 1.5, activity: 'Sunday evening' }
    ];

    const suggestions = [
      'Consider batching similar tasks together for better efficiency',
      'Your Wednesday lunch break could be used for a quick learning session',
      'Weekend mornings show consistent free time - perfect for longer courses',
      'Evening wind-down time could include relaxation or mindfulness practices'
    ];

    return { timeAnalysis: { categories }, freeTime, suggestions };
  };

  const clearAllSchedules = () => {
    setSchedules({});
    setWordCounts({});
    toast.success('All schedules cleared');
  };

  const hasAnySchedule = Object.values(schedules).some(schedule => schedule.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Weekly Schedule Input</h1>
          <p className="text-gray-600">Enter your typical weekly routine to discover time patterns and opportunities</p>
        </div>
        {hasAnySchedule && (
          <Button variant="outline" onClick={clearAllSchedules}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {days.map((day) => (
          <Card key={day}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{day}</CardTitle>
                  <CardDescription>
                    Describe your typical {day.toLowerCase()} routine
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={wordCounts[day] > WORD_LIMIT * 0.8 ? "destructive" : "secondary"}>
                    {wordCounts[day] || 0}/{WORD_LIMIT}
                  </Badge>
                  <Select onValueChange={(sourceDay) => sourceDay !== 'placeholder' && handleCopyFromDay(day, sourceDay)}>
                    <SelectTrigger className="w-auto">
                      <Copy className="w-4 h-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Copy from...</SelectItem>
                      {days.filter(d => d !== day && schedules[d]).map(sourceDay => (
                        <SelectItem key={sourceDay} value={sourceDay}>
                          {sourceDay}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={`e.g., 8am wake up, 9am breakfast with kids, 10am work, 4pm end work, 5pm pick up kids, 6pm dinner...`}
                value={schedules[day] || ''}
                onChange={(e) => handleScheduleChange(day, e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Use simple time format and activities. Maximum {WORD_LIMIT} words.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasAnySchedule && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Button onClick={analyzeSchedule} size="lg" className="px-8">
                <Save className="w-4 h-4 mr-2" />
                Analyze My Schedule
              </Button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              AI will analyze your routine to find time patterns and free pockets
            </p>
          </CardContent>
        </Card>
      )}

      {/* Helper Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Tips for Better Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include specific times (e.g., "8am wake up", "10am-4pm work")</li>
            <li>• Mention regular activities like meals, commute, childcare</li>
            <li>• Note any flexible or variable time slots</li>
            <li>• Use the copy feature to duplicate similar days</li>
            <li>• Be honest about your actual routine, not your ideal one</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}