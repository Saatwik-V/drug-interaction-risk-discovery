'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepperStep {
  key: string;
  label: string;
}

export type StepState = 'pending' | 'active' | 'done';

interface StepperProps {
  steps: StepperStep[];
  /** Index of the step currently in progress. Steps before it are 'done'. */
  activeIndex: number;
}

export default function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <div className="stepper" role="list" aria-label="Pipeline progress">
      {steps.map((step, i) => {
        const state: StepState = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
        return (
          <React.Fragment key={step.key}>
            <div className="stepper-step" role="listitem">
              <span className={`stepper-dot ${state}`}>
                {state === 'done' ? <Check size={14} /> : i + 1}
              </span>
              <span className={`stepper-label ${state}`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className={`stepper-connector ${i < activeIndex ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
