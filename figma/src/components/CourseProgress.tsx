import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Circle, 
  Play, 
  Award,
  Trash2,
  BarChart3,
  AlertCircle,
  Star
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CourseProgressProps {
  courses: any[];
  onDeleteCourse: (courseId: number) => void;
}

export function CourseProgress({ courses, onDeleteCourse }: CourseProgressProps) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Learning Progress</h1>
          <p className="text-gray-600">Track your course completion and achievements</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg mb-2">No Courses Created Yet</h3>
              <p className="text-gray-600 mb-4">Create your first learning course to start tracking progress.</p>
              <Button>Create a Course</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCourses = courses.filter(course => 
    course.modules?.every(module => module.completed)
  ).length;
  
  const totalModules = courses.reduce((total, course) => 
    total + (course.modules?.length || 0), 0
  );
  
  const completedModules = courses.reduce((total, course) => 
    total + (course.modules?.filter(m => m.completed).length || 0), 0
  );

  const handleModuleComplete = (courseId: number, moduleId: number) => {
    // In a real app, this would update the backend
    toast.success('Module completed!');
  };

  const handleQuizSubmit = (moduleId: number) => {
    // Mock quiz scoring
    const score = Math.floor(Math.random() * 40) + 60; // 60-100%
    toast.success(`Quiz completed! Score: ${score}%`);
    setShowQuiz(false);
    setQuizAnswers({});
  };

  const handleDeleteCourse = (courseId: number) => {
    onDeleteCourse(courseId);
    toast.success('Course deleted successfully');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Learning Progress</h1>
        <p className="text-gray-600">Track your course completion and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-blue-600 mb-1">{courses.length}</div>
              <p className="text-sm text-gray-600">Active Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-green-600 mb-1">{completedCourses}</div>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-purple-600 mb-1">{completedModules}</div>
              <p className="text-sm text-gray-600">Modules Done</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl text-orange-600 mb-1">
                {totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">Overall Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 gap-6">
        {courses.map((course) => {
          const completedCount = course.modules?.filter(m => m.completed).length || 0;
          const totalCount = course.modules?.length || 0;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {course.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {course.description}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary">{course.category}</Badge>
                      <Badge variant="outline">{course.difficulty}</Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {course.estimatedTime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {progress === 100 && (
                      <Badge className="bg-green-600">
                        <Award className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Course</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{course.title}"? This action cannot be undone and all progress will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Course
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Progress</span>
                      <span className="text-sm">{completedCount}/{totalCount} modules</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <Tabs defaultValue="modules">
                    <TabsList>
                      <TabsTrigger value="modules">Modules</TabsTrigger>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="modules">
                      <Accordion type="single" collapsible>
                        {course.modules?.map((module, index) => (
                          <AccordionItem key={module.id} value={`module-${module.id}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 w-full">
                                {module.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                                <div className="flex-1 text-left">
                                  <div className="text-sm">{module.title}</div>
                                  <div className="text-xs text-gray-500">{module.duration}</div>
                                </div>
                                {module.score && (
                                  <Badge variant="outline" className="mr-2">
                                    {module.score}%
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <ModuleContent 
                                module={module}
                                onComplete={() => handleModuleComplete(course.id, module.id)}
                                onQuizSubmit={(score) => handleQuizSubmit(module.id)}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="overview">
                      <CourseOverview course={course} />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ModuleContent({ module, onComplete, onQuizSubmit }) {
  const [currentTab, setCurrentTab] = useState('content');
  const [quizAnswers, setQuizAnswers] = useState({});

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const submitQuiz = () => {
    const score = Math.floor(Math.random() * 40) + 60; // Mock scoring
    onQuizSubmit(score);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Learn</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          <div>
            <h4 className="mb-2">Introduction</h4>
            <p className="text-sm text-gray-700">{module.content?.introduction}</p>
          </div>
          
          <div>
            <h4 className="mb-2">Learning Objectives</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {module.content?.lessons?.map((lesson, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="mb-2">Practice Exercises</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {module.content?.exercises?.map((exercise, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                  {exercise}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="examples" className="space-y-4">
          <div>
            <h4 className="mb-2">Real-World Examples</h4>
            <div className="space-y-3">
              {module.content?.examples?.map((example, index) => (
                <div key={index} className="p-3 bg-white rounded border">
                  <p className="text-sm">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="quiz" className="space-y-4">
          <div>
            <h4 className="mb-4">Knowledge Check</h4>
            <div className="space-y-4">
              {module.quiz?.questions?.map((question, qIndex) => (
                <div key={qIndex} className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Q{qIndex + 1}:</span> {question.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2 ml-4">
                    {question.options.map((option, oIndex) => (
                      <label 
                        key={oIndex}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          onChange={() => handleQuizAnswer(qIndex, oIndex)}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                onClick={submitQuiz}
                disabled={Object.keys(quizAnswers).length < (module.quiz?.questions?.length || 0)}
              >
                Submit Quiz
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {!module.completed && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onComplete} size="sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      )}
    </div>
  );
}

function CourseOverview({ course }) {
  const completedModules = course.modules?.filter(m => m.completed).length || 0;
  const totalModules = course.modules?.length || 0;
  const averageScore = course.modules?.filter(m => m.score)
    .reduce((sum, m) => sum + (m.score || 0), 0) / Math.max(1, course.modules?.filter(m => m.score).length);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl text-blue-600 mb-1">{completedModules}</div>
            <p className="text-sm text-gray-600">Modules Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl text-green-600 mb-1">
              {isNaN(averageScore) ? '-' : Math.round(averageScore)}%
            </div>
            <p className="text-sm text-gray-600">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl text-purple-600 mb-1">
              {Math.round((completedModules / totalModules) * 100) || 0}%
            </div>
            <p className="text-sm text-gray-600">Course Progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Module Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {course.modules?.map((module, index) => (
              <div key={module.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  {module.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm">Module {index + 1}</p>
                    <p className="text-xs text-gray-500">{module.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {module.score && (
                    <>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${
                              i < Math.floor((module.score || 0) / 20) 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <Badge variant="outline">{module.score}%</Badge>
                    </>
                  )}
                  {module.completed && !module.score && (
                    <Badge variant="secondary">Completed</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}