import React, { useState, useRef, useEffect } from 'react';
import { X, Trash, PaperPlaneTilt, DotsSixVertical, ArrowsOutCardinal, PushPin } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import { useFilters } from '../data/dataLoader';
import useChatbot from '../hooks/useChatbot';
import ChatButton from './ChatButton';
import useDraggable from '../hooks/useDraggable';

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm bg-orange-primary text-white text-[13px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-50 text-text-primary text-[13px] leading-relaxed prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { allMetrics, brandNames, focusedBrand, activeSegment } = useFilters();
  const { messages, loading, sendMessage, clearMessages } = useChatbot();
  const { pos, onMouseDown, dragging, docked, toggleDock } = useDraggable({
    x: typeof window !== 'undefined' ? window.innerWidth - 444 : 400,
    y: typeof window !== 'undefined' ? Math.max(window.innerHeight - 700, 60) : 100,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text, allMetrics, brandNames, focusedBrand, activeSegment);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const unreadCount = open ? 0 : messages.length - 1;

  return (
    <>
      {!open && <ChatButton onClick={() => setOpen(true)} unreadCount={unreadCount} />}

      {open && (
        <div
          className="fixed z-50 w-[min(400px,90vw)] h-[min(560px,75vh)] bg-white rounded-card flex flex-col overflow-hidden"
          style={docked
            ? { bottom: '96px', right: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }
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
              <span className="text-[13px] font-bold text-text-primary">PA Analyst</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearMessages} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-gray-100 transition-colors" onMouseDown={e => e.stopPropagation()}>
                <Trash size={14} />
              </button>
              <button
                onClick={toggleDock}
                title={docked ? 'Undock to move freely' : 'Dock to default position'}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                  docked ? 'text-gray-400 hover:text-orange-primary hover:bg-orange-light' : 'text-orange-primary bg-orange-light hover:bg-orange-200'
                }`}
                onMouseDown={e => e.stopPropagation()}
              >
                {docked ? <ArrowsOutCardinal size={14} weight="bold" /> : <PushPin size={14} weight="bold" />}
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-text-primary hover:bg-gray-100 transition-colors" onMouseDown={e => e.stopPropagation()}>
                <X size={15} weight="bold" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            {loading && <LoadingDots />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about brand metrics..."
              className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-primary transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-orange-primary text-white hover:bg-orange-hover disabled:opacity-40 transition-all"
            >
              <PaperPlaneTilt size={18} weight="fill" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
