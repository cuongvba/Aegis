import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LandingAiConciergeOrb } from './LandingAiConciergeOrb';
import { LandingAiConciergeModal } from './LandingAiConciergeModal';

export const LandingAiConcierge: React.FC = () => {
  const { i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi') ?? true;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <LandingAiConciergeOrb
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        isVi={isVi}
      />
      <LandingAiConciergeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isVi={isVi}
      />
    </>
  );
};

