import { X, DotsSixVertical, ArrowsOutCardinal, PushPin } from '@phosphor-icons/react';
import { useGuide } from '../data/dataLoader';
import useDraggable from '../hooks/useDraggable';

function DefinitionsSection({ section }) {
  return (
    <div>
      <h4 className="font-semibold text-[12px] text-text-primary mb-2">{section.title}</h4>
      {section.items.map((item) => (
        <div key={item.term} className="mb-2">
          <span className="font-semibold text-[11px] text-text-primary">{item.term}</span>
          <p className="text-[10px] text-text-secondary">{item.def}</p>
        </div>
      ))}
    </div>
  );
}

function LegendSection({ section }) {
  return (
    <div>
      <h4 className="font-semibold text-[12px] text-text-primary mb-2">{section.title}</h4>
      {section.items.map((item) => (
        <div key={item.label} className="flex items-start gap-2 mb-1.5">
          <span className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
          <div>
            <span className="font-semibold text-[11px]">{item.label}</span>
            <span className="text-[10px] text-text-secondary ml-1">{item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorsSection({ section }) {
  return (
    <div>
      <h4 className="font-semibold text-[12px] text-text-primary mb-2">{section.title}</h4>
      <div className="flex flex-wrap gap-3">
        {section.items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionRenderers = { definitions: DefinitionsSection, legend: LegendSection, colors: ColorsSection };

export default function GuidePanel() {
  const { guideOpen, setGuideOpen, currentGuide } = useGuide();
  const { pos, onMouseDown, dragging, docked, toggleDock } = useDraggable({
    x: typeof window !== 'undefined' ? window.innerWidth - 444 : 400,
    y: typeof window !== 'undefined' ? Math.max(window.innerHeight - 700, 60) : 100,
  });

  if (!guideOpen || !currentGuide) return null;

  return (
    <div
      className="fixed z-50 w-[min(380px,90vw)] max-h-[min(500px,70vh)] bg-white rounded-card flex flex-col overflow-hidden"
      style={docked
        ? { bottom: '164px', right: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }
        : { left: pos.x, top: pos.y, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', userSelect: dragging ? 'none' : undefined }
      }
    >
      {/* Header — drag handle */}
      <div
        className={`px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between select-none ${docked ? '' : 'cursor-move'}`}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          {!docked && <DotsSixVertical size={14} weight="bold" className="text-gray-400" />}
          <span className="text-[13px] font-bold text-text-primary">How to Read This Page</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDock}
            title={docked ? 'Undock to move freely' : 'Dock to default position'}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              docked
                ? 'text-gray-400 hover:text-orange-primary hover:bg-orange-light'
                : 'text-orange-primary bg-orange-light hover:bg-orange-200'
            }`}
            onMouseDown={e => e.stopPropagation()}
          >
            {docked ? <ArrowsOutCardinal size={14} weight="bold" /> : <PushPin size={14} weight="bold" />}
          </button>
          <button
            onClick={() => setGuideOpen(false)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-gray-100 transition-colors"
            onMouseDown={e => e.stopPropagation()}
          >
            <X size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {currentGuide.sections.map((section, idx) => {
          const Renderer = sectionRenderers[section.type];
          return Renderer ? <Renderer key={idx} section={section} /> : null;
        })}
      </div>
    </div>
  );
}
