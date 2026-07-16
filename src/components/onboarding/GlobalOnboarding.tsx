import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { CustomTooltip } from './CustomTooltip';
import { ONBOARDING_STEPS } from '../../lib/onboardingSteps';

interface GlobalOnboardingProps {
  activeModule: string;
}

export const GlobalOnboarding: React.FC<GlobalOnboardingProps> = ({ activeModule }) => {
  const { 
    completedModules, 
    activeTourModule, 
    markTourCompleted, 
    stopTour,
    startTour 
  } = useOnboardingStore();

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState(ONBOARDING_STEPS._fallback);

  useEffect(() => {
    // Si el usuario fuerza un tour o si entramos a un módulo nuevo no completado
    const isManualStart = activeTourModule === activeModule;
    const isAutoStart = !completedModules.includes(activeModule);
    
    // Obtener los pasos del módulo o el fallback
    const moduleSteps = ONBOARDING_STEPS[activeModule] || ONBOARDING_STEPS._fallback;
    setSteps(moduleSteps);

    if (isManualStart || isAutoStart) {
      // Pequeño timeout para permitir que la vista del módulo termine de renderizar
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [activeModule, activeTourModule, completedModules]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      markTourCompleted(activeModule);
      if (activeTourModule) {
        stopTour();
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
    />
  );
};
