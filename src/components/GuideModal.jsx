import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Users, Trophy, Calendar, CheckCircle } from 'lucide-react';

const GuideModal = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to DreamSpace',
      icon: <CheckCircle className="w-12 h-12 text-netsurit-red" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-professional-gray-700">
            DreamSpace helps you document, track, and achieve your personal and professional dreams while connecting with colleagues.
          </p>
          <p className="text-base text-professional-gray-600">
            This quick guide will walk you through the key features and workflow.
          </p>
        </div>
      )
    },
    {
      title: 'Create Your Dream Book',
      icon: <BookOpen className="w-12 h-12 text-netsurit-red" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-professional-gray-700 font-semibold">
            Step 1: Document Your Dreams
          </p>
          <ul className="space-y-3 text-base text-professional-gray-600">
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Navigate to <strong>Dream Book</strong> to create up to 10 dreams</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Choose categories like Health, Travel, Career, Learning, and more</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Add descriptions, images, and track progress (0-100%)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Update dreams anytime as you make progress</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Set Weekly Goals',
      icon: <Calendar className="w-12 h-12 text-netsurit-red" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-professional-gray-700 font-semibold">
            Step 2: Plan Your Week
          </p>
          <ul className="space-y-3 text-base text-professional-gray-600">
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>From the <strong>Dashboard</strong>, add weekly goals linked to your dreams</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Track progress throughout the week by checking off completed goals</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Visit <strong>Week Ahead</strong> for a detailed planning view</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-red">•</span>
              <span>Break big dreams into manageable weekly actions</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Connect with Colleagues',
      icon: <Users className="w-12 h-12 text-netsurit-coral" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-professional-gray-700 font-semibold">
            Step 3: Dream Connect
          </p>
          <ul className="space-y-3 text-base text-professional-gray-600">
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-coral">•</span>
              <span>Find colleagues with shared dream categories</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-coral">•</span>
              <span>Request a Dream Connect to share experiences and advice</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-coral">•</span>
              <span>Meet virtually or in-person to discuss your dreams</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-coral">•</span>
              <span>Build meaningful connections across the organization</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Earn Points & Track Progress',
      icon: <Trophy className="w-12 h-12 text-netsurit-orange" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-professional-gray-700 font-semibold">
            Step 4: Scorecard
          </p>
          <ul className="space-y-3 text-base text-professional-gray-600">
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-orange">•</span>
              <span><strong>+10 points</strong> for completing dreams</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-orange">•</span>
              <span><strong>+5 points</strong> for each Dream Connect</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-orange">•</span>
              <span><strong>+3 points</strong> for group attendance</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 text-netsurit-orange">•</span>
              <span>Track your progress and unlock achievement levels</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'You\'re Ready!',
      icon: <CheckCircle className="w-12 h-12 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-professional-gray-700 font-semibold">
            Start Your Journey
          </p>
          <p className="text-base text-professional-gray-600">
            You now know how to use DreamSpace! Here's the recommended workflow:
          </p>
          <ol className="space-y-3 text-base text-professional-gray-600">
            <li className="flex items-start">
              <span className="mr-3 font-bold text-netsurit-red">1.</span>
              <span>Create your Dream Book with personal and professional goals</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold text-netsurit-red">2.</span>
              <span>Set weekly goals to make consistent progress</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold text-netsurit-red">3.</span>
              <span>Connect with colleagues who share similar dreams</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold text-netsurit-red">4.</span>
              <span>Track your progress and earn points</span>
            </li>
          </ol>
          <div className="mt-6 p-4 bg-netsurit-light-coral/20 rounded-xl border border-netsurit-coral/30">
            <p className="text-sm text-professional-gray-700 font-medium">
              💡 Tip: Start by adding at least 3 dreams to your Dream Book, then set weekly goals to build momentum!
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDotClick = (index) => {
    setCurrentStep(index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-professional-gray-200">
          <div className="flex items-center space-x-4">
            {currentStepData.icon}
            <div>
              <h2 className="text-2xl font-bold text-professional-gray-900">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-professional-gray-500">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-professional-gray-400 hover:text-professional-gray-600 transition-colors p-2 rounded-full hover:bg-professional-gray-100"
            aria-label="Close guide"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStepData.content}
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 border-t border-professional-gray-200 bg-professional-gray-50">
          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-netsurit-red w-8'
                    : 'bg-professional-gray-300 hover:bg-professional-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                isFirstStep
                  ? 'text-professional-gray-300 cursor-not-allowed'
                  : 'text-professional-gray-700 hover:bg-professional-gray-200'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {isLastStep ? (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-netsurit-red to-netsurit-coral text-white rounded-xl hover:from-netsurit-coral hover:to-netsurit-orange font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
