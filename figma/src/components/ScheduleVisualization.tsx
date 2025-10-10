import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface ScheduleVisualizationProps {
  scheduleData: any;
}

export function ScheduleVisualization({ scheduleData }: ScheduleVisualizationProps) {
  if (!scheduleData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Time Analysis</h1>
          <p className="text-gray-600">Visual insights into your weekly schedule</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg mb-2">No Schedule Data</h3>
              <p className="text-gray-600">Please add your weekly schedule first to see visualizations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { timeAnalysis, freeTime, suggestions } = scheduleData;

  // Data for daily time distribution chart
  const dailyData = [
    { day: 'Mon', work: 8, childcare: 6, personal: 2, sleep: 8 },
    { day: 'Tue', work: 8, childcare: 5, personal: 3, sleep: 8 },
    { day: 'Wed', work: 8, childcare: 6, personal: 2, sleep: 8 },
    { day: 'Thu', work: 8, childcare: 5, personal: 3, sleep: 8 },
    { day: 'Fri', work: 6, childcare: 4, personal: 4, sleep: 8 },
    { day: 'Sat', work: 2, childcare: 8, personal: 6, sleep: 8 },
    { day: 'Sun', work: 0, childcare: 6, personal: 8, sleep: 10 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Time Analysis & Visualization</h1>
        <p className="text-gray-600">AI-powered insights into your weekly time patterns</p>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Weekly Time Distribution
            </CardTitle>
            <CardDescription>
              How your 168 hours are allocated across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeAnalysis.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, hours }) => `${name}: ${hours}h`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {timeAnalysis.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Detailed time allocation with percentages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeAnalysis.categories.map((category, index) => {
                const percentage = (category.hours / 168) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{category.hours}h</span>
                        <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Time Patterns</CardTitle>
          <CardDescription>
            Hour-by-hour breakdown showing patterns across the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="work" stackId="a" fill="#3B82F6" name="Work" />
              <Bar dataKey="childcare" stackId="a" fill="#EF4444" name="Childcare" />
              <Bar dataKey="personal" stackId="a" fill="#10B981" name="Personal" />
              <Bar dataKey="sleep" stackId="a" fill="#8B5CF6" name="Sleep" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Free Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Free Time Opportunities</CardTitle>
          <CardDescription>
            Available time slots perfect for learning or relaxation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeTime.slice(0, 6).map((pocket, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{pocket.day}</span>
                  <Badge variant="outline">{pocket.duration}h</Badge>
                </div>
                <p className="text-sm mb-1">{pocket.time}</p>
                <p className="text-xs text-gray-500">{pocket.activity}</p>
              </div>
            ))}
          </div>
          {freeTime.length > 6 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              +{freeTime.length - 6} more time slots available
            </p>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Suggestions</CardTitle>
          <CardDescription>
            Personalized recommendations to optimize your routine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-blue-900">{suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Efficiency Score */}
      <Card>
        <CardHeader>
          <CardTitle>Time Efficiency Insights</CardTitle>
          <CardDescription>
            Analysis of your current time management patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl text-blue-600 mb-2">85%</div>
              <p className="text-sm text-gray-600">Overall Efficiency</p>
              <Progress value={85} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl text-green-600 mb-2">12h</div>
              <p className="text-sm text-gray-600">Weekly Free Time</p>
              <Progress value={70} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl text-purple-600 mb-2">4.2</div>
              <p className="text-sm text-gray-600">Balance Score</p>
              <Progress value={84} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}