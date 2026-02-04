import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { formatTokens, formatCost, getBudgetPercentage } from '../lib/tokenCounter';
import clsx from 'clsx';

export const ChatScreen: React.FC = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    error,
    tokenUsage,
    sendMessage,
    clearError,
  } = useAppStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);

    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const budgetPercentage = getBudgetPercentage(tokenUsage.current, tokenUsage.budget);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Bem-vindo ao Story Chat
              </h2>
              <p className="text-gray-600 mb-6">
                Comece a escrever sua história. A IA vai te ajudar a desenvolver
                personagens, manter consistência e criar narrativas envolventes.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Dicas:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Configure memórias para lembrar detalhes importantes</li>
                  <li>• Use travas para evitar inconsistências</li>
                  <li>• Ajuste a temperatura nas configurações</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={clsx(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={clsx(
                'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm',
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              )}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>

              {/* Metadata for assistant messages */}
              {msg.role === 'assistant' && msg.metadata?.violations && msg.metadata.violations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">
                    ⚠️ Avisos:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {msg.metadata.violations.map((v, i) => (
                      <li key={i}>• {v}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className={clsx(
                  'mt-2 text-xs',
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                )}
              >
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Token Usage Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Tokens: {formatTokens(tokenUsage.current)} / {formatTokens(tokenUsage.budget)}</span>
          <span>Custo: {formatCost(tokenUsage.cost)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-300',
              budgetPercentage < 50 ? 'bg-green-500' :
              budgetPercentage < 80 ? 'bg-yellow-500' :
              'bg-red-500'
            )}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4 safe-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva sua história..."
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 text-[15px]"
            rows={1}
            disabled={isLoading}
            style={{
              minHeight: '44px',
              maxHeight: '128px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={clsx(
              'rounded-full p-3 transition-colors flex-shrink-0',
              input.trim() && !isLoading
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
