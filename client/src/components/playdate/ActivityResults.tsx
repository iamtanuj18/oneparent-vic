import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, Users, Shield, Lightbulb, Download, RotateCcw, Home, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { ActivityResponse } from '../../lib/api/playdate';

interface ActivityResultsProps {
  activity: ActivityResponse;
  isForMyself: boolean;
  onRegenerate: () => void;
  onStartOver: () => void;
  onExportPDF: () => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({ isOpen, onClose, onConfirm }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-white rounded-2xl p-8 max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <h3 className="text-2xl font-bold text-gray-900">Are You Sure?</h3>
        </div>
        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
          This will delete the currently generated activity and all your input data. 
          <span className="font-bold text-blue-600"> We suggest you export this as PDF before proceeding ahead.</span>
        </p>
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={onClose} size="lg" className="px-8 py-4 text-lg font-semibold">
            Return to Export
          </Button>
          <Button 
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold" 
            onClick={onConfirm}
            size="lg"
          >
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ActivityResults({ activity, isForMyself, onRegenerate, onStartOver, onExportPDF }: ActivityResultsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleStartOver = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmStartOver = () => {
    setShowConfirmDialog(false);
    onStartOver();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
        id="activity-results"
      >
        {/* title banner with gradient background */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 p-8 text-white">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
              {activity.title}
            </h1>
            
            {/* activity badges */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full px-4 py-2">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">{activity.isOutdoor ? 'Outdoor' : 'Indoor'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full px-4 py-2">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">{activity.duration}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full px-4 py-2">
                <DollarSign className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Budget: {activity.budget}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full px-4 py-2">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Location: {activity.location}</span>
              </div>
            </div>
            
            {/* activity description */}
            <p className="text-base text-white opacity-90">
              {activity.description}
            </p>
          </div>
          
          {/* decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white rounded-full"></div>
          </div>
        </div>

        {/* weather insight - only for outdoor activities */}
        {activity.isOutdoor && activity.weatherInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.4 4.4 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Weather Insight</h3>
            </div>
            <p className="text-gray-700 text-base leading-relaxed">{activity.weatherInsight}</p>
          </motion.div>
        )}

        {/* activity outcomes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Outcomes</h3>
          <div className="flex flex-wrap gap-3">
            {activity.outcomes.map((outcome, index) => (
              <span
                key={index}
                className="bg-white shadow-sm text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200"
              >
                {outcome}
              </span>
            ))}
          </div>
        </motion.div>

        {/* materials needed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Things Needed</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity.materials.map((material, index) => (
              <div key={index} className="flex items-center space-x-3 py-3 px-4 bg-white rounded-xl shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  ✓
                </div>
                <span className="text-gray-800 font-medium">{material}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* activity steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Steps</h3>
          <div className="space-y-6">
            {activity.steps.map((step, index) => (
              <div key={index} className="flex space-x-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-2">
                    {step.title} ({step.duration})
                  </h4>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* tips section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* safety tips */}
          {activity.safetyTips && activity.safetyTips.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-red-900">Safety Notes</h3>
              </div>
              <ul className="space-y-3">
                {activity.safetyTips.map((tip, index) => (
                  <li key={index} className="text-red-800 text-base font-medium flex items-start space-x-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* bonding tips for myself vs parent power-ups for with kids */}
          {activity.bondingTips && activity.bondingTips.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  {isForMyself ? <Lightbulb className="w-5 h-5 text-white" /> : <Users className="w-5 h-5 text-white" />}
                </div>
                <h3 className="text-lg font-bold text-blue-900">
                  {isForMyself ? 'Tips for You' : 'Parent Power-Ups'}
                </h3>
              </div>
              <ul className="space-y-3">
                {activity.bondingTips.map((tip, index) => (
                  <li key={index} className="text-blue-800 text-base font-medium flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* budget notes */}
        {activity.budgetNotes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-green-50 border-l-4 border-green-400 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-green-900">Budget Notes</h3>
            </div>
            <p className="text-green-800 text-base font-medium">{activity.budgetNotes}</p>
          </motion.div>
        )}

        {/* action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 pt-6"
          data-action-buttons
        >
          <Button
            onClick={onRegenerate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold"
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Generate New Activity
          </Button>
          
          <Button
            onClick={onExportPDF}
            variant="outline"
            className="flex-1 px-6 py-3 text-base font-semibold"
            size="lg"
            data-export-btn
          >
            <Download className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
          
          <Button
            onClick={handleStartOver}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-base font-semibold"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </motion.div>
      </motion.div>

      {/* confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmStartOver}
      />
    </>
  );
}