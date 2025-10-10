import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { BookOpen, Clock, Zap, Brain, Users, Heart, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CourseCreationProps {
  onCourseCreate: (course: any) => void;
  freeTimePockets: any[];
}

const courseCategories = [
  {
    id: 'technology',
    name: 'Technology & Digital Skills',
    icon: Zap,
    description: 'Stay current with digital tools and tech trends',
    topics: ['Social Media Management', 'Basic Coding', 'Digital Photography', 'Online Safety', 'Productivity Apps']
  },
  {
    id: 'habits',
    name: 'Habits & Wellness',
    icon: Heart,
    description: 'Build healthy routines and self-care practices',
    topics: ['Mindfulness', 'Time Management', 'Healthy Eating', 'Exercise Routines', 'Sleep Hygiene']
  },
  {
    id: 'parenting',
    name: 'Parenting & Family',
    icon: Users,
    description: 'Enhance parenting skills and family dynamics',
    topics: ['Child Development', 'Communication Skills', 'Behavior Management', 'Educational Support', 'Family Activities']
  },
  {
    id: 'personal',
    name: 'Personal Growth',
    icon: Brain,
    description: 'Develop skills for personal and professional growth',
    topics: ['Financial Literacy', 'Career Development', 'Creative Writing', 'Public Speaking', 'Goal Setting']
  }
];

const difficultyLevels = [
  { id: 'beginner', name: 'Beginner', description: 'No prior experience needed' },
  { id: 'intermediate', name: 'Intermediate', description: 'Some basic knowledge helpful' },
  { id: 'advanced', name: 'Advanced', description: 'Strong foundation required' }
];

export function CourseCreation({ onCourseCreate, freeTimePockets }: CourseCreationProps) {
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState({
    category: '',
    title: '',
    description: '',
    difficulty: 'beginner',
    topics: [],
    timeCommitment: '',
    personalGoals: '',
    learningStyle: 'mixed'
  });

  const handleCategorySelect = (categoryId: string) => {
    setCourseData(prev => ({ ...prev, category: categoryId }));
    setStep(2);
  };

  const handleTopicToggle = (topic: string) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const generateCourse = () => {
    const selectedCategory = courseCategories.find(c => c.id === courseData.category);
    
    // Mock AI-generated course structure
    const generatedCourse = {
      title: courseData.title || `${selectedCategory?.name} Fundamentals`,
      description: courseData.description || `A personalized course designed for busy single parents`,
      category: selectedCategory?.name,
      difficulty: courseData.difficulty,
      estimatedTime: calculateEstimatedTime(),
      modules: generateModules(),
      createdAt: new Date().toISOString(),
      progress: 0
    };

    onCourseCreate(generatedCourse);
    toast.success('Course created successfully!');
    resetForm();
  };

  const calculateEstimatedTime = () => {
    const baseTime = courseData.difficulty === 'beginner' ? 6 : courseData.difficulty === 'intermediate' ? 8 : 10;
    return `${baseTime}-${baseTime + 2} hours total`;
  };

  const generateModules = () => {
    const selectedCategory = courseCategories.find(c => c.id === courseData.category);
    const moduleTopics = courseData.topics.length > 0 ? courseData.topics : selectedCategory?.topics.slice(0, 6) || [];
    
    return moduleTopics.slice(0, 6).map((topic, index) => ({
      id: index + 1,
      title: `Module ${index + 1}: ${topic}`,
      description: `Learn the fundamentals of ${topic.toLowerCase()} with practical examples and exercises.`,
      duration: `${30 + (index * 5)} minutes`,
      content: generateModuleContent(topic),
      quiz: generateQuiz(topic),
      completed: false,
      score: null
    }));
  };

  const generateModuleContent = (topic: string) => ({
    introduction: `Welcome to the ${topic} module. In this section, you'll discover...`,
    lessons: [
      `Understanding ${topic} basics`,
      `Practical applications in daily life`,
      `Common challenges and solutions`,
      `Real-world examples and case studies`
    ],
    examples: [
      `Example 1: Simple ${topic} scenario`,
      `Example 2: Advanced ${topic} application`,
      `Example 3: Problem-solving with ${topic}`
    ],
    exercises: [
      `Practice exercise 1: Basic ${topic} task`,
      `Practice exercise 2: Applied ${topic} challenge`
    ]
  });

  const generateQuiz = (topic: string) => ({
    questions: [
      {
        question: `What is the most important aspect of ${topic}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: 0
      },
      {
        question: `How can you apply ${topic} in your daily routine?`,
        options: ['Method 1', 'Method 2', 'Method 3', 'Method 4'],
        correct: 1
      },
      {
        question: `What are the benefits of ${topic}?`,
        options: ['Benefit A', 'Benefit B', 'Benefit C', 'Benefit D'],
        correct: 2
      }
    ]
  });

  const resetForm = () => {
    setCourseData({
      category: '',
      title: '',
      description: '',
      difficulty: 'beginner',
      topics: [],
      timeCommitment: '',
      personalGoals: '',
      learningStyle: 'mixed'
    });
    setStep(1);
  };

  const availableTime = freeTimePockets.reduce((total, pocket) => total + pocket.duration, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 mb-2">Create Learning Course</h1>
        <p className="text-gray-600">Design a personalized micro-learning course that fits your schedule</p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-8 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            Step {step} of 4: {
              step === 1 ? 'Choose Category' :
              step === 2 ? 'Select Topics' :
              step === 3 ? 'Customize Course' :
              'Generate Course'
            }
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courseCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCategorySelect(category.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">Sample topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.topics.slice(0, 3).map(topic => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        +{category.topics.length - 3} more
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Step 2: Topic Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Learning Topics</CardTitle>
            <CardDescription>
              Select the topics you'd like to focus on (choose 3-6 for optimal learning)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courseCategories.find(c => c.id === courseData.category)?.topics.map(topic => (
                <div key={topic} className="flex items-center space-x-2">
                  <Checkbox
                    id={topic}
                    checked={courseData.topics.includes(topic)}
                    onCheckedChange={() => handleTopicToggle(topic)}
                  />
                  <Label htmlFor={topic} className="text-sm">{topic}</Label>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {courseData.topics.length} topics selected
                </span>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={courseData.topics.length === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Course Customization */}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Course</CardTitle>
              <CardDescription>
                Personalize the course to match your learning style and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Course Title (optional)</Label>
                    <Input
                      id="title"
                      placeholder="My Personal Learning Journey"
                      value={courseData.title}
                      onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Course Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What do you hope to achieve with this course?"
                      value={courseData.description}
                      onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Difficulty Level</Label>
                    <RadioGroup 
                      value={courseData.difficulty} 
                      onValueChange={(value) => setCourseData(prev => ({ ...prev, difficulty: value }))}
                      className="mt-2"
                    >
                      {difficultyLevels.map(level => (
                        <div key={level.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={level.id} id={level.id} />
                          <Label htmlFor={level.id} className="flex-1">
                            <div className="text-sm">{level.name}</div>
                            <div className="text-xs text-gray-500">{level.description}</div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="goals">Personal Learning Goals</Label>
                    <Textarea
                      id="goals"
                      placeholder="What specific outcomes are you hoping for?"
                      value={courseData.personalGoals}
                      onChange={(e) => setCourseData(prev => ({ ...prev, personalGoals: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)}>
                  Preview Course
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Time Availability */}
          {freeTimePockets.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Clock className="w-5 h-5" />
                  Perfect Timing!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-sm mb-2">
                  Based on your schedule, you have {Math.round(availableTime)} hours of free time per week.
                  This course will fit perfectly into your available slots.
                </p>
                <div className="flex flex-wrap gap-1">
                  {freeTimePockets.slice(0, 4).map((pocket, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-300 text-green-700">
                      {pocket.day}: {pocket.duration}h
                    </Badge>
                  ))}
                  {freeTimePockets.length > 4 && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      +{freeTimePockets.length - 4} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 4: Course Preview & Generation */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Course Preview
            </CardTitle>
            <CardDescription>
              Review your personalized course before generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="mb-3">Course Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Category:</strong> {courseCategories.find(c => c.id === courseData.category)?.name}</div>
                  <div><strong>Difficulty:</strong> {difficultyLevels.find(l => l.id === courseData.difficulty)?.name}</div>
                  <div><strong>Modules:</strong> 6 interactive modules</div>
                  <div><strong>Estimated Time:</strong> {calculateEstimatedTime()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="mb-3">Selected Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {courseData.topics.map(topic => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3">What You'll Get</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 6 comprehensive modules with interactive content</li>
                <li>• Real-world examples and practical exercises</li>
                <li>• Knowledge-check quizzes for each module</li>
                <li>• Progress tracking and completion certificates</li>
                <li>• Personalized recommendations based on your goals</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back to Edit
              </Button>
              <Button onClick={generateCourse} className="px-8">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate My Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Free Time Warning */}
      {freeTimePockets.length === 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-orange-800 text-sm">
                No free time slots detected. Consider analyzing your schedule first to find optimal learning times.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}