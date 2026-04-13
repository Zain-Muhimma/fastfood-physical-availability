import { Info } from '@phosphor-icons/react';
import { useGuide } from '../data/dataLoader';

export default function GuideButton() {
  const { guideOpen, setGuideOpen, currentGuide } = useGuide();

  if (!currentGuide) return null;

  return (
    <button
      onClick={() => setGuideOpen(!guideOpen)}
      className="z-50 w-14 h-14 rounded-full bg-blue-info flex items-center justify-center transition-transform duration-200 hover:scale-110"
      style={{ position: 'fixed', bottom: '96px', right: '24px', boxShadow: '0 4px 12px rgba(21,101,192,0.45)' }}
      aria-label="How to read this page"
    >
      <Info size={22} weight="fill" color="white" />
    </button>
  );
}
