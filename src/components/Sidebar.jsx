import { NavLink } from 'react-router-dom';
import { House, MapPin, Star, GridFour, ChatCircle, TrendUp, Warning } from '@phosphor-icons/react';

const navItems = [
  { path: '/', label: 'Executive Summary', icon: House },
  { path: '/presence', label: 'Presence', icon: MapPin },
  { path: '/prominence', label: 'Prominence', icon: Star },
  { path: '/portfolio', label: 'Portfolio', icon: GridFour },
  { path: '/experience', label: 'Experience vs Memory', icon: ChatCircle },
  { path: '/competitive', label: 'Competitive Gap', icon: TrendUp },
  { path: '/early-warning', label: 'Early Warning', icon: Warning, disabled: true, soon: true },
];

const Sidebar = () => {
  return (
    <aside className="w-60 bg-card border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-gray-200 flex items-center gap-3">
        <img src="/logos/muhimma.png" alt="Muhimma" className="w-12 h-12 object-contain" />
        <h1 className="font-display text-[22px] leading-tight text-text-primary tracking-wide">PHYSICAL<br/>AVAILABILITY</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg transition-colors text-[13px] ${
                    isActive
                      ? 'bg-orange-primary text-white font-semibold'
                      : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-text-primary hover:text-orange-primary hover:bg-orange-light'
                  }`
                }
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
              >
                <item.icon size={18} className="mr-3 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.soon && (
                  <span className="text-[9px] font-bold uppercase text-orange-primary animate-pulse">Soon</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 flex items-center gap-2">
        <img src="/logos/muhimma.png" alt="Muhimma" className="w-8 h-8 object-contain" />
        <div>
          <p className="text-[9px] text-text-secondary leading-tight">Powered by</p>
          <p className="text-[11px] text-text-primary font-semibold leading-tight">Muhimma Digital Platform</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
