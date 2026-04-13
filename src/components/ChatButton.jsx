import { ChatCircle } from '@phosphor-icons/react';

export default function ChatButton({ onClick, unreadCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className="z-50 w-14 h-14 rounded-full bg-orange-primary flex items-center justify-center transition-transform duration-200 hover:scale-110"
      style={{ position: 'fixed', bottom: '24px', right: '24px', boxShadow: '0 4px 12px rgba(243,107,31,0.45)' }}
      aria-label="Open chat"
    >
      <ChatCircle size={22} weight="fill" color="white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
