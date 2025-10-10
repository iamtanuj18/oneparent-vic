import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, Coffee, BookOpen, Heart, Zap, Filter, AlertCircle } from 'lucide-react';

interface FreeTimePocketsProps {
  scheduleData: any;
}

const activitySuggestions = {
  short: [
    { name: 'Quick meditation', duration: '10-15 min', icon: Heart, category: 'wellness' },
    { name: 'Read an article', duration: '15-20 min', icon: BookOpen, category: 'learning' },
    { name: 'Take a walk', duration: '15-30 min', icon: Zap, category: 'wellness' },
    { name: 'Call a friend', duration: '10-20 min', icon: Heart, category: 'social' },
    { name: 'Quick workout', duration: '15-30 min', icon: Zap, category: 'wellness' }
  ],
  medium: [
    { name: 'Complete a course module', duration: '30-60 min', icon: BookOpen, category: 'learning' },
    { name: 'Meal prep', duration: '45-60 min', icon: Coffee, category: 'productivity' },
    { name: 'Creative hobby time', duration: '30-90 min', icon: Heart, category: 'personal' },
    { name: 'Deep work session', duration: '60-90 min', icon: Zap, category: 'productivity' },
    { name: 'Exercise routine', duration: '45-60 min', icon: Zap, category: 'wellness' }
  ],
  long: [
    { name: 'Complete full course', duration: '2+ hours', icon: BookOpen, category: 'learning' },
    { name: 'Plan weekly goals', duration: '90-120 min', icon: Zap, category: 'productivity' },
    { name: 'Self-care routine', duration: '2-3 hours', icon: Heart, category: 'wellness' },
    { name: 'Skill practice session', duration: '2+ hours', icon: BookOpen, category: 'learning' },
    { name: 'Social activities', duration: '2+ hours', icon: Heart, category: 'social' }
  ]
};

export function FreeTimePockets({ scheduleData }: FreeTimePocketsProps) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');

  if (!scheduleData?.freeTime) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Free Time Pockets</h1>
          <p className="text-gray-600">Discover available time slots for learning and self-care</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg mb-2">No Schedule Analysis Available</h3>
              <p className="text-gray-600">Please add and analyze your weekly schedule first to see free time pockets.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { freeTime } = scheduleData;

  const filteredPockets = freeTime.filter(pocket => {
    if (selectedDuration === 'short' && pocket.duration >= 1.5) return false;
    if (selectedDuration === 'medium' && (pocket.duration < 1 || pocket.duration > 2)) return false;
    if (selectedDuration === 'long' && pocket.duration < 2) return false;
    return true;
  });

  const getDurationCategory = (duration: number) => {
    if (duration < 1) return 'short';
    if (duration < 2) return 'medium';
    return 'long';
  };

  const getDurationColor = (duration: number) => {
    if (duration < 1) return 'bg-yellow-100 text-yellow-800';
    if (duration < 2) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const totalFreeTime = freeTime.reduce((total, pocket) => total + pocket.duration, 0);
  const averagePocketSize = totalFreeTime / freeTime.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Free Time Pockets</h1>
          <p className="text-gray-600">
            {freeTime.length} time slots found • {Math.round(totalFreeTime)} hours per week
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={selectedDuration} onValueChange={setSelectedDuration}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All durations</SelectItem>
              <SelectItem value="short">Short (under 1h)</SelectItem>
              <SelectItem value="medium">Medium (1-2h)</SelectItem>
              <SelectItem value="long">Long (2h+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-blue-600 mb-1">{freeTime.length}</div>
              <p className="text-sm text-gray-600">Time Pockets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-green-600 mb-1">{Math.round(totalFreeTime)}h</div>
              <p className="text-sm text-gray-600">Total Free Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-purple-600 mb-1">{averagePocketSize.toFixed(1)}h</div>
              <p className="text-sm text-gray-600">Average Duration</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-orange-600 mb-1">
                {freeTime.filter(p => p.duration >= 1.5).length}
              </div>
              <p className="text-sm text-gray-600">Learning Ready</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Time Pockets Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Available Time Slots
          </CardTitle>
          <CardDescription>
            {filteredPockets.length} pockets shown • Click for activity suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPockets.map((pocket, index) => (
              <TimeSlotCard key={index} pocket={pocket} />
            ))}
          </div>
          {filteredPockets.length === 0 && selectedDuration !== 'all' && (
            <div className="text-center py-8">
              <p className="text-gray-500">No time pockets match the selected duration filter.</p>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedDuration('all')}
                className="mt-2"
              >
                Show all pockets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivitySuggestionCard 
          title="Quick Activities" 
          subtitle="10-30 minutes"
          activities={activitySuggestions.short}
          color="yellow"
        />
        <ActivitySuggestionCard 
          title="Medium Sessions" 
          subtitle="30 minutes - 2 hours"
          activities={activitySuggestions.medium}
          color="blue"
        />
        <ActivitySuggestionCard 
          title="Deep Dive Time" 
          subtitle="2+ hours"
          activities={activitySuggestions.long}
          color="green"
        />
      </div>
    </div>
  );
}

function TimeSlotCard({ pocket }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const durationCategory = getDurationCategory(pocket.duration);
  const suggestions = activitySuggestions[durationCategory];

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm">{pocket.day}</h4>
          <Badge className={getDurationColor(pocket.duration)}>
            {pocket.duration}h
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2">{pocket.time}</p>
        <p className="text-xs text-gray-500 mb-3">{pocket.activity}</p>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowSuggestions(!showSuggestions)}
        >
          {showSuggestions ? 'Hide' : 'Show'} Activities
        </Button>
        
        {showSuggestions && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {suggestions.slice(0, 3).map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Icon className="w-3 h-3 text-gray-400" />
                  <span>{activity.name}</span>
                  <span className="text-gray-400">({activity.duration})</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivitySuggestionCard({ title, subtitle, activities, color }) {
  const colorClasses = {
    yellow: 'border-yellow-200 bg-yellow-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50'
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                <Icon className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm">{activity.name}</p>
                  <p className="text-xs text-gray-500">{activity.duration}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.category}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function getDurationCategory(duration: number) {
  if (duration < 1) return 'short';
  if (duration < 2) return 'medium';
  return 'long';
}

function getDurationColor(duration: number) {
  if (duration < 1) return 'bg-yellow-100 text-yellow-800';
  if (duration < 2) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}