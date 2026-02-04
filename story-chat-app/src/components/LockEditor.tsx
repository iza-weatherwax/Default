import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Lock } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { CharacterLock } from '../types';
import clsx from 'clsx';

const VIOLATION_ACTIONS = [
  { value: 'regenerate', label: 'Regenerar', icon: '🔄' },
  { value: 'warn', label: 'Avisar', icon: '⚠️' },
  { value: 'auto-fix', label: 'Auto-corrigir', icon: '🔧' },
] as const;

export const LockEditor: React.FC = () => {
  const { locks, addLock, updateLock, deleteLock } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    characterName: '',
    rule: '',
    detectionPattern: '',
    prohibitedWords: '',
    autoCorrect: false,
    violationAction: 'warn' as CharacterLock['violationAction'],
  });

  const resetForm = () => {
    setFormData({
      characterName: '',
      rule: '',
      detectionPattern: '',
      prohibitedWords: '',
      autoCorrect: false,
      violationAction: 'warn',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lockData = {
      characterName: formData.characterName.trim(),
      rule: formData.rule.trim(),
      detectionPattern: formData.detectionPattern.trim(),
      prohibitedWords: formData.prohibitedWords
        .split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0),
      autoCorrect: formData.autoCorrect,
      violationAction: formData.violationAction,
    };

    if (editingId !== null) {
      await updateLock(editingId, lockData);
    } else {
      await addLock(lockData);
    }

    resetForm();
  };

  const handleEdit = (lock: CharacterLock) => {
    setFormData({
      characterName: lock.characterName,
      rule: lock.rule,
      detectionPattern: lock.detectionPattern,
      prohibitedWords: lock.prohibitedWords.join(', '),
      autoCorrect: lock.autoCorrect,
      violationAction: lock.violationAction,
    });
    setEditingId(lock.id!);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta trava?')) {
      await deleteLock(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 safe-top">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-6 h-6 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">
            Travas de Personagem
          </h1>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Defina regras obrigatórias que nunca podem ser violadas
        </p>

        {/* Add Button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Trava
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border-b border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Personagem
              </label>
              <input
                type="text"
                value={formData.characterName}
                onChange={(e) => setFormData({ ...formData, characterName: e.target.value })}
                placeholder="Ex: Azael"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regra
              </label>
              <input
                type="text"
                value={formData.rule}
                onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
                placeholder="Ex: Azael NUNCA pode ter olhos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavras Proibidas (separadas por vírgula)
              </label>
              <input
                type="text"
                value={formData.prohibitedWords}
                onChange={(e) => setFormData({ ...formData, prohibitedWords: e.target.value })}
                placeholder="Ex: olhos, olhar, visão"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Se qualquer dessas palavras aparecer com o personagem, a trava será violada
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Padrão de Detecção (Regex - Opcional)
              </label>
              <input
                type="text"
                value={formData.detectionPattern}
                onChange={(e) => setFormData({ ...formData, detectionPattern: e.target.value })}
                placeholder="Ex: azael.*(olho|visão)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Expressão regular para detecção mais precisa
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ação em Caso de Violação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VIOLATION_ACTIONS.map(action => (
                  <button
                    key={action.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, violationAction: action.value })}
                    className={clsx(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                      formData.violationAction === action.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="text-lg mb-1">{action.icon}</div>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCorrect"
                checked={formData.autoCorrect}
                onChange={(e) => setFormData({ ...formData, autoCorrect: e.target.checked })}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoCorrect" className="text-sm text-gray-700">
                Tentar correção automática quando possível
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Salvar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {locks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma trava configurada
              </h3>
              <p className="text-gray-600 mb-6">
                Travas garantem que características importantes dos personagens
                nunca sejam violadas pela IA.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Exemplo:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Personagem: Azael</li>
                  <li>• Regra: Não tem olhos</li>
                  <li>• Proibido: olhos, olhar, visão</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {locks.map(lock => (
          <LockCard
            key={lock.id}
            lock={lock}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

interface LockCardProps {
  lock: CharacterLock;
  onEdit: (lock: CharacterLock) => void;
  onDelete: (id: number) => void;
}

const LockCard: React.FC<LockCardProps> = ({ lock, onEdit, onDelete }) => {
  const action = VIOLATION_ACTIONS.find(a => a.value === lock.violationAction)!;

  return (
    <div className="bg-white rounded-lg border border-red-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900">
              {lock.characterName}
            </h3>
          </div>
          <p className="text-gray-700 text-sm">
            {lock.rule}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(lock)}
            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(lock.id!)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {lock.prohibitedWords.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1">
            Palavras Proibidas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lock.prohibitedWords.map((word, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full border border-red-200"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <span>{action.icon}</span>
          <span>{action.label}</span>
          {lock.autoCorrect && (
            <>
              <span>•</span>
              <span>Auto-correção ativa</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
