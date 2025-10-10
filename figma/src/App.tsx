import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ScheduleInput } from './components/ScheduleInput';
import { ScheduleVisualization } from './components/ScheduleVisualization';
import { FreeTimePockets } from './components/FreeTimePockets';
import { CourseCreation } from './components/CourseCreation';
import { CourseProgress } from './components/CourseProgress';
import { Overview } from './components/Overview';

export default function App() {
  const [activeView, setActiveView] = useState('overview');
  const [scheduleData, setScheduleData] = useState(null);
  const [courses, setCourses] = useState([]);

  const handleScheduleUpdate = (data) => {
    setScheduleData(data);
  };

  const handleCourseCreate = (course) => {
    setCourses(prev => [...prev, { ...course, id: Date.now() }]);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(prev => prev.filter(course => course.id !== courseId));
  };

  const handleDeleteSchedule = () => {
    setScheduleData(null);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <Overview 
            scheduleData={scheduleData}
            courses={courses}
            onDeleteSchedule={handleDeleteSchedule}
          />
        );
      case 'schedule':
        return (
          <ScheduleInput 
            onScheduleUpdate={handleScheduleUpdate}
            existingData={scheduleData}
          />
        );
      case 'visualization':
        return <ScheduleVisualization scheduleData={scheduleData} />;
      case 'free-time':
        return <FreeTimePockets scheduleData={scheduleData} />;
      case 'courses':
        return (
          <CourseCreation 
            onCourseCreate={handleCourseCreate}
            freeTimePockets={scheduleData?.freeTime || []}
          />
        );
      case 'progress':
        return (
          <CourseProgress 
            courses={courses}
            onDeleteCourse={handleDeleteCourse}
          />
        );
      default:
        return <Overview scheduleData={scheduleData} courses={courses} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}