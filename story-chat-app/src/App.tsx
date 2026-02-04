import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import { ChatScreen } from './components/ChatScreen';
import { MemoryManager } from './components/MemoryManager';
import { LockEditor } from './components/LockEditor';
import { Settings } from './components/Settings';
import { BottomNav } from './components/BottomNav';

function App() {
  const { currentView, initialize, isLoading } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading && !useAppStore.getState().currentSession) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'chat' && <ChatScreen />}
        {currentView === 'memories' && <MemoryManager />}
        {currentView === 'locks' && <LockEditor />}
        {currentView === 'settings' && <Settings />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default App;
