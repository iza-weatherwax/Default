import React from 'react';
import { MessageSquare, Database, Lock, Settings } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import clsx from 'clsx';

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'memories', label: 'Memórias', icon: Database },
  { id: 'locks', label: 'Travas', icon: Lock },
  { id: 'settings', label: 'Config', icon: Settings },
] as const;

export const BottomNav: React.FC = () => {
  const { currentView, setView } = useAppStore();

  return (
    <nav className="bg-white border-t border-gray-200 safe-bottom">
      <div className="grid grid-cols-4 h-16">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={clsx('w-6 h-6', isActive && 'scale-110')} />
              <span className={clsx('text-xs font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
