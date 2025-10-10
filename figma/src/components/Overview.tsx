import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  TrendingUp,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface OverviewProps {
  scheduleData: any;
  courses: any[];
  onDeleteSchedule: () => void;
}

export function Overview({ scheduleData, courses, onDeleteSchedule }: OverviewProps) {
  const completedCourses = courses.filter(course => 
    course.modules?.every(module => module.completed)
  ).length;
  
  const totalFreeTime = scheduleData?.freeTime?.reduce((total, pocket) => 
    total + pocket.duration, 0
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Welcome to Time & Learn Hub</h1>
          <p className="text-gray-600">Your personal time management and learning companion</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Schedule Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {scheduleData ? 'Analyzed' : 'Not Set'}
            </div>
            <p className="text-xs text-muted-foreground">
              {scheduleData ? '7 days mapped' : 'Add your weekly schedule'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Free Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{Math.round(totalFreeTime)}h</div>
            <p className="text-xs text-muted-foreground">
              Available per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              Learning paths created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{completedCourses}</div>
            <p className="text-xs text-muted-foreground">
              Courses finished
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Schedule Summary */}
      {scheduleData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Current Schedule
                </CardTitle>
                <CardDescription>
                  Your weekly routine analysis
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDeleteSchedule}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2">Time Distribution</h4>
                <div className="space-y-2">
                  {scheduleData.timeAnalysis?.categories?.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{category.name}</span>
                      <Badge variant="secondary">{category.hours}h</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2">Free Time Pockets</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {scheduleData.freeTime?.length || 0} available slots found
                </p>
                <div className="space-y-1">
                  {scheduleData.freeTime?.slice(0, 3).map((pocket, index) => (
                    <div key={index} className="text-sm">
                      {pocket.day}: {pocket.time} ({pocket.duration}h)
                    </div>
                  ))}
                  {scheduleData.freeTime?.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{scheduleData.freeTime.length - 3} more slots
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Courses */}
      {courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Learning Progress
            </CardTitle>
            <CardDescription>
              Your active courses and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses.map((course) => {
                const completedModules = course.modules?.filter(m => m.completed).length || 0;
                const totalModules = course.modules?.length || 6;
                const progress = (completedModules / totalModules) * 100;
                
                return (
                  <div key={course.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4>{course.title}</h4>
                      <Badge variant={progress === 100 ? "default" : "secondary"}>
                        {progress === 100 ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                    <div className="flex items-center gap-4">
                      <Progress value={progress} className="flex-1" />
                      <span className="text-sm">{completedModules}/{totalModules}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!scheduleData && courses.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Get Started
            </CardTitle>
            <CardDescription>
              Set up your time management and learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="mb-2">1. Add Your Weekly Schedule</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Start by entering your typical weekly routine. This helps us understand your time patterns and find opportunities for learning.
                </p>
                <Button size="sm">Go to Schedule Input</Button>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="mb-2">2. Discover Free Time</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Once your schedule is analyzed, we'll identify free time pockets and suggest how to use them effectively.
                </p>
                <Button size="sm" variant="outline">Learn More</Button>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="mb-2">3. Create Learning Courses</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Design personalized micro-learning courses that fit into your available time slots and help you grow new skills.
                </p>
                <Button size="sm" variant="outline">Explore Courses</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}