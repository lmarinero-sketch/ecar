import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
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
    globalDisabled
  } = useOnboardingStore();

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState(ONBOARDING_STEPS._fallback);

  useEffect(() => {
    if (globalDisabled && activeTourModule !== activeModule) {
      setRun(false);
      return;
    }

    const isManualStart = activeTourModule === activeModule;
    const isAutoStart = !completedModules.includes(activeModule);

    const moduleSteps = ONBOARDING_STEPS[activeModule] || ONBOARDING_STEPS._fallback;
    setSteps(moduleSteps);

    if (isManualStart || isAutoStart) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [activeModule, activeTourModule, completedModules]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEvent = (data: any) => {
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(data?.status)) {
      setRun(false);
      markTourCompleted(activeModule);
      if (activeTourModule) stopTour();
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      tooltipComponent={CustomTooltip}
      onEvent={handleEvent}
      locale={{ back: 'Anterior', close: 'Cerrar', last: '¡Listo!', next: 'Siguiente', open: 'Abrir', skip: 'Saltar' }}
    />
  );
};
