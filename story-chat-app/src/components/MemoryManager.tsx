import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import type { Memory } from '../types';
import clsx from 'clsx';

const CATEGORIES = [
  { value: 'character', label: 'Personagem' },
  { value: 'world', label: 'Mundo' },
  { value: 'event', label: 'Evento' },
  { value: 'relationship', label: 'Relacionamento' },
] as const;

const IMPORTANCE_LEVELS = [
  { value: 1, label: 'Crítico', color: 'bg-red-100 text-red-800' },
  { value: 2, label: 'Importante', color: 'bg-orange-100 text-orange-800' },
  { value: 3, label: 'Útil', color: 'bg-yellow-100 text-yellow-800' },
  { value: 4, label: 'Contexto', color: 'bg-gray-100 text-gray-800' },
] as const;

export const MemoryManager: React.FC = () => {
  const { memories, addMemory, updateMemory, deleteMemory } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    text: '',
    keywords: '',
    importance: 2 as 1 | 2 | 3 | 4,
    category: 'character' as Memory['category'],
  });

  const resetForm = () => {
    setFormData({
      text: '',
      keywords: '',
      importance: 2,
      category: 'character',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const memoryData = {
      text: formData.text.trim(),
      keywords: formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0),
      importance: formData.importance,
      category: formData.category,
    };

    if (editingId !== null) {
      await updateMemory(editingId, memoryData);
    } else {
      await addMemory(memoryData);
    }

    resetForm();
  };

  const handleEdit = (memory: Memory) => {
    setFormData({
      text: memory.text,
      keywords: memory.keywords.join(', '),
      importance: memory.importance,
      category: memory.category,
    });
    setEditingId(memory.id!);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta memória?')) {
      await deleteMemory(id);
    }
  };

  const filteredMemories = memories.filter(memory => {
    const matchesSearch =
      memory.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memory.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      filterCategory === 'all' || memory.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedMemories = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filteredMemories.filter(m => m.category === cat.value);
    return acc;
  }, {} as Record<string, Memory[]>);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 safe-top">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Banco de Memórias
        </h1>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar memórias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                filterCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  filterCategory === cat.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Memória
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border-b border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Ex: Azael tem olhos verdes e cabelo preto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavras-chave (separadas por vírgula)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="Ex: Azael, aparência, olhos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Memory['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importância
                </label>
                <select
                  value={formData.importance}
                  onChange={(e) => setFormData({ ...formData, importance: parseInt(e.target.value) as 1 | 2 | 3 | 4 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {IMPORTANCE_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
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

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredMemories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || filterCategory !== 'all'
                ? 'Nenhuma memória encontrada'
                : 'Nenhuma memória ainda. Adicione sua primeira memória!'}
            </p>
          </div>
        )}

        {filterCategory === 'all' ? (
          CATEGORIES.map(cat => {
            const categoryMemories = groupedMemories[cat.value];
            if (categoryMemories.length === 0) return null;

            return (
              <div key={cat.value}>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {cat.label}
                </h2>
                <div className="space-y-3">
                  {categoryMemories.map(memory => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="space-y-3">
            {filteredMemories.map(memory => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface MemoryCardProps {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onDelete: (id: number) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onEdit, onDelete }) => {
  const importanceLevel = IMPORTANCE_LEVELS.find(l => l.value === memory.importance)!;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-gray-900 flex-1 text-[15px] leading-relaxed">
          {memory.text}
        </p>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(memory)}
            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(memory.id!)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {memory.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {memory.keywords.map((keyword, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={clsx('px-2 py-0.5 rounded-full font-medium', importanceLevel.color)}>
          {importanceLevel.label}
        </span>
        <span>
          Usado {memory.usageCount || 0}x
        </span>
      </div>
    </div>
  );
};
