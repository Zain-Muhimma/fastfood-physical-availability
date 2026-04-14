import { useState, useRef, useEffect, cloneElement, Children } from 'react';
import { createPortal } from 'react-dom';
import { ArrowsOutSimple, X } from '@phosphor-icons/react';

const ExpandableCard = ({ children, title }) => {
  const [expanded, setExpanded] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!expanded) return;
    const measure = () => {
      if (bodyRef.current) {
        setBodyHeight(bodyRef.current.clientHeight);
      }
    };
    // Measure after render
    const t = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener('resize', measure);
    };
  }, [expanded]);

  return (
    <>
      <div className="relative group">
        {children}
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-gray-50 z-10"
          title="Expand to fullscreen"
        >
          <ArrowsOutSimple size={14} className="text-text-secondary" />
        </button>
      </div>

      {expanded && createPortal(
        <div
          className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <div
            className="bg-white rounded-card shadow-2xl flex flex-col"
            style={{ width: '96vw', height: '94vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50 rounded-t-card">
              <h3 className="font-display text-lg text-text-primary tracking-wide">{title || 'Expanded View'}</h3>
              <button
                onClick={() => setExpanded(false)}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} weight="bold" className="text-text-secondary" />
              </button>
            </div>
            <div
              ref={bodyRef}
              className="flex-1 p-6 overflow-auto expanded-card-body"
            >
              {children}
            </div>
          </div>

          <style>{`
            .expanded-card-body .recharts-responsive-container {
              height: ${Math.max(bodyHeight - 100, 400)}px !important;
            }
            .expanded-card-body > div {
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .expanded-card-body > div > .recharts-responsive-container,
            .expanded-card-body > div > div > .recharts-responsive-container {
              flex: 1;
              min-height: 0;
            }
            .expanded-card-body table { font-size: 13px; }
            .expanded-card-body table th, .expanded-card-body table td { padding: 10px 14px; }
            .expanded-card-body .space-y-1\\.5 > *,
            .expanded-card-body .space-y-2 > *,
            .expanded-card-body .space-y-2\\.5 > * { margin-top: 8px; }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
};

export default ExpandableCard;
