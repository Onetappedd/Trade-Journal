import React, { useState, Children, useRef, useLayoutEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: any) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
    else onStepChange(newStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-4" {...rest}>
      <div className={`mx-auto w-full max-w-md rounded-4xl shadow-xl bg-white ${stepCircleContainerClassName}`} style={{ border: "1px solid #222" }}>
        <div className={`${stepContainerClassName} flex w-full items-center p-8`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked: number) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    },
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked: number) => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>
        <div className={`w-full space-y-2 px-8 py-6 ${contentClassName}`}>
          <StepContentWrapper
            isCompleted={isCompleted}
            currentStep={currentStep}
            direction={direction}
          >
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>
        </div>
        {!isCompleted && (
          <div className={`px-8 pb-8 ${footerClassName}`}>
            <div className={`mt-10 flex ${currentStep !== 1 ? "justify-between" : "justify-end"}`}>
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className={`duration-350 rounded px-2 py-1 transition ${currentStep === 1 ? "pointer-events-none opacity-50 text-neutral-400" : "text-neutral-400 hover:text-neutral-700"}`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="btn btn-primary px-4 py-2 rounded font-medium bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition"
                {...nextButtonProps}
              >
                {isLastStep ? "Complete" : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepContentWrapper({ isCompleted, children, className }: any) {
  // Always render content, no animation/overflow
  return (
    <div className={className} style={{ position: "relative", width: "100%" }}>
      {!isCompleted && children}
    </div>
  );
}

function SlideTransition({ children }: any) {
  // No animation, just render children
  return <div style={{ width: "100%" }}>{children}</div>;
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? "-100%" : "100%",
    opacity: 0,
  }),
  center: {
    x: "0%",
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? "50%" : "-50%",
    opacity: 0,
  }),
};

export function Step({ children }: { children: ReactNode }) {
  return <div className="px-8">{children}</div>;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }: any) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";
  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step);
  };
  return (
    <motion.div
      onClick={handleClick}
      className="relative cursor-pointer outline-none focus:outline-none"
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: "#222", color: "#a3a3a3" },
          active: { scale: 1, backgroundColor: "#5227FF", color: "#5227FF" },
          complete: { scale: 1, backgroundColor: "#5227FF", color: "#3b82f6" },
        }}
        transition={{ duration: 0.3 }}
        className="flex h-8 w-8 items-center justify-center rounded-full font-semibold"
      >
        {status === "complete" ? (
          <CheckIcon className="h-4 w-4 text-black" />
        ) : status === "active" ? (
          <div className="h-3 w-3 rounded-full bg-[#060010]" />
        ) : (
          <span className="text-sm">{step}</span>
        )}
      </motion.div>
    </motion.div>
  );
}

function StepConnector({ isComplete }: any) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: "transparent" },
    complete: { width: "100%", backgroundColor: "#5227FF" },
  };
  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-neutral-600">
      <motion.div
        className="absolute left-0 top-0 h-full"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? "complete" : "incomplete"}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: "tween", ease: "easeOut", duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
