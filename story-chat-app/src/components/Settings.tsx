import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, Eye, EyeOff, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import clsx from 'clsx';

const API_PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'local', label: 'Local (Experimental)' },
] as const;

const MODELS = {
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recomendado)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Rápido)' },
  ],
  openrouter: [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
  ],
  local: [
    { value: 'local-model', label: 'Modelo Local' },
  ],
};

export const Settings: React.FC = () => {
  const { settings, updateSettings, testConnection } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    tokenBudget: 5000,
    apiKey: '',
    apiProvider: 'anthropic' as 'anthropic' | 'openrouter' | 'local',
    apiBaseUrl: 'https://api.anthropic.com',
    modelName: 'claude-3-5-sonnet-20241022',
    enableSemanticSearch: true,
    enableAutoCorrection: true,
    enableDuplicationCheck: true,
    embeddingModel: 'transformers.js',
    systemPrompt: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        tokenBudget: settings.tokenBudget,
        apiKey: settings.apiKey,
        apiProvider: settings.apiProvider,
        apiBaseUrl: settings.apiBaseUrl || 'https://api.anthropic.com',
        modelName: settings.modelName,
        enableSemanticSearch: settings.enableSemanticSearch,
        enableAutoCorrection: settings.enableAutoCorrection,
        enableDuplicationCheck: settings.enableDuplicationCheck,
        embeddingModel: settings.embeddingModel,
        systemPrompt: settings.systemPrompt || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    console.log('[Settings] Testing connection with config:', {
      provider: formData.apiProvider,
      baseUrl: formData.apiBaseUrl,
      model: formData.modelName,
      hasApiKey: !!formData.apiKey,
    });

    try {
      // Salvar as configurações primeiro para garantir que o aiService usa os valores corretos
      console.log('[Settings] Saving settings before test...');
      await updateSettings(formData);

      // Aguardar um pouco para o aiService ser atualizado
      await new Promise(resolve => setTimeout(resolve, 200));

      // Testar a conexão
      console.log('[Settings] Calling testConnection...');
      const result = await testConnection();
      console.log('[Settings] Test result:', result);
      setTestResult(result);

      setTimeout(() => {
        setTestResult(null);
      }, 5000);
    } catch (error) {
      console.error('[Settings] Test error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao testar conexão',
      });
    } finally {
      setTesting(false);
    }
  };

  const isUsingCustomProxy = () => {
    const baseUrl = formData.apiBaseUrl || '';
    return !baseUrl.includes('anthropic.com') &&
           !baseUrl.includes('openrouter') &&
           (baseUrl.includes('localhost') ||
            baseUrl.includes('127.0.0.1') ||
            baseUrl.startsWith('http://'));
  };

  const currentModels = MODELS[formData.apiProvider];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-gray-700" />
            <h1 className="text-xl font-bold text-gray-900">
              Configurações
            </h1>
          </div>
          {isUsingCustomProxy() && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                Proxy Local
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* API Configuration */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configuração de API
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provedor
              </label>
              <select
                value={formData.apiProvider}
                onChange={(e) => {
                  const provider = e.target.value as typeof formData.apiProvider;

                  // Set default API Base URL for each provider
                  let defaultBaseUrl = 'https://api.anthropic.com';
                  if (provider === 'openrouter') {
                    defaultBaseUrl = 'https://openrouter.ai/api/v1';
                  } else if (provider === 'local') {
                    defaultBaseUrl = 'http://localhost:8000';
                  }

                  setFormData({
                    ...formData,
                    apiProvider: provider,
                    modelName: MODELS[provider][0].value,
                    apiBaseUrl: defaultBaseUrl,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {API_PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <select
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentModels.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!formData.apiKey && (
                <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Sem API key, o app funcionará em modo demonstração com respostas simuladas.
                    Para usar a IA de verdade, adicione sua chave da API.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Base URL
              </label>
              <input
                type="text"
                value={formData.apiBaseUrl}
                onChange={(e) => setFormData({ ...formData, apiBaseUrl: e.target.value })}
                placeholder="https://api.anthropic.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.apiProvider === 'anthropic' && 'Padrão: https://api.anthropic.com'}
                {formData.apiProvider === 'openrouter' && 'Padrão: https://openrouter.ai/api/v1'}
                {formData.apiProvider === 'local' && 'Exemplo: http://localhost:8000 ou http://127.0.0.1:porta'}
              </p>
            </div>

            {/* Test Connection Button */}
            <div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className={clsx(
                  'w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
                  testing
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : testResult?.success
                    ? 'bg-green-500 text-white'
                    : testResult?.success === false
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                )}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : testResult?.success ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {testResult.message}
                  </>
                ) : testResult?.success === false ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Falhou
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Testar Conexão
                  </>
                )}
              </button>
              {testResult && !testResult.success && (
                <p className="text-xs text-red-600 mt-1">
                  {testResult.message}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Generation Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Parâmetros de Geração
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Temperatura
                </label>
                <span className="text-sm text-gray-600">
                  {formData.temperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Preciso</span>
                <span>Criativo</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  Tokens Máximos por Resposta
                </label>
                <span className="text-sm text-gray-600">
                  {formData.maxTokens}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={formData.maxTokens}
                onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Curto</span>
                <span>Longo</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orçamento de Tokens (Contexto)
              </label>
              <input
                type="number"
                min="1000"
                max="100000"
                step="1000"
                value={formData.tokenBudget}
                onChange={(e) => setFormData({ ...formData, tokenBudget: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantos tokens podem ser usados para memórias e contexto
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt do Sistema (Opcional)
              </label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="Instruções personalizadas para a IA... (deixe vazio para usar o padrão)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Define como a IA deve se comportar. Deixe vazio para usar as instruções padrão.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Toggles */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recursos
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableSemanticSearch}
                onChange={(e) => setFormData({ ...formData, enableSemanticSearch: e.target.checked })}
                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Busca Semântica
                </p>
                <p className="text-xs text-gray-500">
                  Encontra memórias relevantes automaticamente
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableAutoCorrection}
                onChange={(e) => setFormData({ ...formData, enableAutoCorrection: e.target.checked })}
                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Auto-Correção
                </p>
                <p className="text-xs text-gray-500">
                  Corrige violações automaticamente quando possível
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.enableDuplicationCheck}
                onChange={(e) => setFormData({ ...formData, enableDuplicationCheck: e.target.checked })}
                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Detecção de Repetição
                </p>
                <p className="text-xs text-gray-500">
                  Avisa quando informações são repetidas demais
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Save Button */}
        <div className="safe-bottom">
          <button
            type="submit"
            className={clsx(
              'w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            )}
          >
            <Save className="w-5 h-5" />
            {saved ? 'Salvo!' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};
