'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, BookOpen, Clock, Target, Lightbulb, Save } from 'lucide-react'

interface CourseModule {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  resources: string[]
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  totalModules: number
  estimatedHours: number
  modules: CourseModule[]
  createdAt: string
}

interface CourseCreationProps {
  courses: Course[]
  onCourseUpdate: (courses: Course[]) => void
}

const COURSE_CATEGORIES = [
  'Parenting Skills', 'Personal Development', 'Health & Wellness', 
  'Career Growth', 'Financial Literacy', 'Creative Skills', 'Other'
]

export function CourseCreation({ courses, onCourseUpdate }: CourseCreationProps) {
  const [showForm, setShowForm] = useState(false)
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'Personal Development'
  })
  const [modules, setModules] = useState<Omit<CourseModule, 'id'>[]>([])
  const [currentModule, setCurrentModule] = useState({
    title: '',
    description: '',
    estimatedMinutes: 15,
    resources: ['']
  })

  const handleAddModule = () => {
    if (!currentModule.title.trim()) return
    
    const newModule = {
      ...currentModule,
      resources: currentModule.resources.filter(r => r.trim())
    }
    
    setModules([...modules, newModule])
    setCurrentModule({
      title: '',
      description: '',
      estimatedMinutes: 15,
      resources: ['']
    })
  }

  const handleRemoveModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const handleAddResource = () => {
    setCurrentModule({
      ...currentModule,
      resources: [...currentModule.resources, '']
    })
  }

  const handleResourceChange = (index: number, value: string) => {
    const newResources = [...currentModule.resources]
    newResources[index] = value
    setCurrentModule({ ...currentModule, resources: newResources })
  }

  const handleRemoveResource = (index: number) => {
    setCurrentModule({
      ...currentModule,
      resources: currentModule.resources.filter((_, i) => i !== index)
    })
  }

  const handleCreateCourse = () => {
    if (!courseData.title.trim() || modules.length === 0) return

    const totalHours = modules.reduce((acc, module) => acc + module.estimatedMinutes, 0) / 60

    const newCourse: Course = {
      id: Date.now().toString(),
      ...courseData,
      totalModules: modules.length,
      estimatedHours: Math.round(totalHours * 10) / 10,
      modules: modules.map((module, index) => ({
        ...module,
        id: `${Date.now()}-${index}`
      })),
      createdAt: new Date().toISOString()
    }

    onCourseUpdate([...courses, newCourse])
    
    setCourseData({
      title: '',
      description: '',
      category: 'Personal Development'
    })
    setModules([])
    setShowForm(false)
  }

  const handleDeleteCourse = (courseId: string) => {
    onCourseUpdate(courses.filter(course => course.id !== courseId))
  }

  const totalEstimatedTime = modules.reduce((acc, module) => acc + module.estimatedMinutes, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Creation</h2>
          <p className="text-gray-600">Design personalized micro-learning courses for your free time</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create New Course
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
              New Learning Course
            </h3>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mindful Parenting Techniques"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={courseData.category}
                  onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COURSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Description
              </label>
              <textarea
                value={courseData.description}
                onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what learners will gain from this course..."
              />
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Course Modules ({modules.length})
              </h4>

              <div className="space-y-4">
                <Card className="p-4 bg-gray-50 border-dashed border-2 border-gray-300">
                  <h5 className="font-medium text-gray-900 mb-3">Add New Module</h5>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={currentModule.title}
                        onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Module title"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          value={currentModule.estimatedMinutes}
                          onChange={(e) => setCurrentModule({...currentModule, estimatedMinutes: parseInt(e.target.value) || 15})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="5"
                          max="120"
                        />
                        <span className="text-sm text-gray-500">min</span>
                      </div>
                      
                      <Button onClick={handleAddModule} className="flex items-center">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    <textarea
                      value={currentModule.description}
                      onChange={(e) => setCurrentModule({...currentModule, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Module description..."
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Learning Resources
                      </label>
                      {currentModule.resources.map((resource, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={resource}
                            onChange={(e) => handleResourceChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Resource URL or description"
                          />
                          {currentModule.resources.length > 1 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveResource(index)}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={handleAddResource}
                        className="text-sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Resource
                      </Button>
                    </div>
                  </div>
                </Card>

                {modules.map((module, index) => (
                  <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-900">{module.title}</h6>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {module.estimatedMinutes} minutes
                          {module.resources.length > 0 && (
                            <span className="ml-4">
                              • {module.resources.length} resource{module.resources.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveModule(index)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                <p><strong>{modules.length}</strong> modules • <strong>{Math.round(totalEstimatedTime / 60 * 10) / 10}</strong> hours total</p>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCourse}
                  disabled={!courseData.title.trim() || modules.length === 0}
                  className="flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
          Your Courses ({courses.length})
        </h3>

        {courses.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Courses Created</h4>
            <p className="text-gray-600 mb-4">Design your first personalized learning course</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{course.title}</h4>
                    <p className="text-sm text-blue-600 font-medium">{course.category}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{course.totalModules} modules</span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.estimatedHours}h total
                  </span>
                </div>
                
                <Button variant="outline" className="w-full">
                  Start Learning
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}