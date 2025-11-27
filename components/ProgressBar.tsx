import React from 'react';
import { PageStep } from '../types';

interface ProgressBarProps {
  currentStep: PageStep;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  if (currentStep === PageStep.HOME) return null;

  const steps = [
    { num: 1, label: 'Start' },
    { num: 2, label: 'Assess' },
    { num: 3, label: 'Reflect' },
    { num: 4, label: 'Results' }
  ];

  // We map the Enum values (2,3,4) to progress percentages
  // Home is 1, so if we are at 2, we are 33% through the active flow roughly
  const progressPercentage = Math.min(100, Math.max(0, ((currentStep - 1) / 3) * 100));

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          {steps.map((s) => (
            <div key={s.num} className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${currentStep >= s.num ? 'text-teal-600 bg-teal-100' : 'text-slate-400'}`}>
              {s.label}
            </div>
          ))}
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-200">
          <div 
            style={{ width: `${progressPercentage}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500 ease-out"
          ></div>
        </div>
      </div>
    </div>
  );
};