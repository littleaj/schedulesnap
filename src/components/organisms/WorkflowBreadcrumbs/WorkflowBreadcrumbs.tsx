import React from 'react';
import { useLocation } from 'react-router';
import './WorkflowBreadcrumbs.css';

const WORKFLOW_STEPS = [
  'Connect Google',
  'Snap Photo',
  'Analyze',
  'Confirm',
  'Create',
] as const;

const ROUTE_TO_ACTIVE_STEP_INDEX: Record<string, number> = {
  '/capture': 1,
  '/analyze': 2,
  '/confirm': 3,
  '/creating': 4,
  '/create': 4,
};

const WorkflowBreadcrumbs = () => {
  const { pathname } = useLocation();
  const activeStepIndex = ROUTE_TO_ACTIVE_STEP_INDEX[pathname];

  if (activeStepIndex === undefined) {
    return null;
  }

  return (
    <nav className="workflow-breadcrumbs" aria-label="Workflow progress">
      <ol className="workflow-breadcrumbs__list">
        {WORKFLOW_STEPS.map((label, index) => {
          const state = index < activeStepIndex ? 'completed' : index === activeStepIndex ? 'active' : 'upcoming';

          return (
            <li className="workflow-breadcrumbs__item" key={label}>
              <span
                className={`workflow-breadcrumbs__label workflow-breadcrumbs__label--${state}`}
                data-state={state}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default WorkflowBreadcrumbs;
