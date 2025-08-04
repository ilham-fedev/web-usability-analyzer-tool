'use client'

import React, { useState, useEffect } from 'react'
import { X, Settings, Key, Brain, Smartphone, CheckCircle, Trash2, Play, Check, AlertCircle, Shield } from 'lucide-react'
import { AnalysisSettings } from '@/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AnalysisSettings>({
    aiProvider: 'claude',
    analysisDepth: 'standard',
    includeMobile: false,
    stealthMode: true,
    firecrawlKey: '',
    aiKey: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Test states for API keys
  const [firecrawlTestState, setFirecrawlTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [aiTestState, setAiTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  
  // Validation states
  const [hasKeys, setHasKeys] = useState(false)
  const [hasValidConnections, setHasValidConnections] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('analysisSettings')
      if (saved) {
        try {
          setSettings(JSON.parse(saved))
        } catch (error) {
          console.error('Error loading settings:', error)
        }
      }
    }
  }, [isOpen])

  // Validate settings - check if keys exist
  useEffect(() => {
    const hasFirecrawlKey = (settings.firecrawlKey?.trim().length || 0) > 0
    const hasAiKey = (settings.aiKey?.trim().length || 0) > 0
    setHasKeys(hasFirecrawlKey && hasAiKey)
    
    // Check if connections are valid (both keys tested successfully)
    const connectionsValid = firecrawlTestState === 'success' && aiTestState === 'success'
    setHasValidConnections(connectionsValid)
  }, [settings, firecrawlTestState, aiTestState])

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      localStorage.setItem('analysisSettings', JSON.stringify(settings))
      setShowSuccess(true)
      
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearFirecrawl = () => {
    setSettings({ ...settings, firecrawlKey: '' })
    setFirecrawlTestState('idle')
  }

  const handleClearAiKey = () => {
    setSettings({ ...settings, aiKey: '' })
    setAiTestState('idle')
  }

  const handleTestFirecrawl = async () => {
    if (!settings.firecrawlKey?.trim()) return
    
    setFirecrawlTestState('testing')
    
    try {
      const response = await fetch('/api/test-firecrawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: settings.firecrawlKey || '',
          settings: settings
        })
      })

      if (response.ok) {
        setFirecrawlTestState('success')
      } else {
        setFirecrawlTestState('error')
      }
    } catch (error) {
      setFirecrawlTestState('error')
    }

    // Reset to idle after 10 seconds
    setTimeout(() => {
      setFirecrawlTestState('idle')
    }, 10000)
  }

  const handleTestAiKey = async () => {
    if (!settings.aiKey?.trim()) return
    
    setAiTestState('testing')
    
    try {
      if (settings.aiProvider === 'claude') {
        const response = await fetch('/api/test-claude', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: settings.aiKey || ''
          })
        })

        if (response.ok) {
          setAiTestState('success')
        } else {
          setAiTestState('error')
        }
      } else {
        const response = await fetch('/api/test-openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: settings.aiKey || ''
          })
        })

        if (response.ok) {
          setAiTestState('success')
        } else {
          setAiTestState('error')
        }
      }
    } catch (error) {
      setAiTestState('error')
    }

    // Reset to idle after 10 seconds
    setTimeout(() => {
      setAiTestState('idle')
    }, 10000)
  }

  const getTestIcon = (testState: 'idle' | 'testing' | 'success' | 'error') => {
    switch (testState) {
      case 'testing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Play className="w-4 h-4 text-gray-400" />
    }
  }

  const getTestButtonClass = (testState: 'idle' | 'testing' | 'success' | 'error') => {
    switch (testState) {
      case 'testing':
        return 'text-blue-600 hover:text-blue-700'
      case 'success':
        return 'text-green-600 hover:text-green-700'
      case 'error':
        return 'text-red-600 hover:text-red-700'
      default:
        return 'text-gray-400 hover:text-gray-600'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Analysis Settings</h2>
              <p className="text-sm text-gray-500">Configure your analysis preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* AI Provider Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">AI Provider</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ ...settings, aiProvider: 'claude' })}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  settings.aiProvider === 'claude'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Claude (Anthropic)</div>
                <div className="text-sm text-gray-500 mt-1">
                  Advanced reasoning and detailed analysis
                </div>
              </button>
              <button
                onClick={() => setSettings({ ...settings, aiProvider: 'openai' })}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  settings.aiProvider === 'openai'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">OpenAI GPT-4</div>
                <div className="text-sm text-gray-500 mt-1">
                  Versatile analysis with creative insights
                </div>
              </button>
            </div>
          </div>

          {/* Analysis Depth Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Analysis Depth</h3>
              <p className="text-sm text-gray-500 mt-1">
                Controls the thoroughness of AI usability analysis
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'quick', label: 'Quick', desc: 'Basic issues' },
                { value: 'standard', label: 'Standard', desc: 'Comprehensive' },
                { value: 'deep', label: 'Deep', desc: 'Exhaustive' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings({ ...settings, analysisDepth: option.value as any })}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    settings.analysisDepth === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Analysis Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Include Mobile Analysis</div>
                <div className="text-sm text-gray-500">
                  Analyze mobile responsiveness and touch interactions
                </div>
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, includeMobile: !settings.includeMobile })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.includeMobile ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.includeMobile ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Stealth Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Stealth Mode</div>
                <div className="text-sm text-gray-500">
                  Use stealth proxy for better scraping success rate
                </div>
              </div>
            </div>
            <button
              onClick={() => setSettings({ ...settings, stealthMode: !settings.stealthMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.stealthMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.stealthMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* API Keys Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firecrawl API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.firecrawlKey}
                    onChange={(e) => setSettings({ ...settings, firecrawlKey: e.target.value })}
                    placeholder="Enter your Firecrawl API key"
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                    <button
                      type="button"
                      onClick={handleTestFirecrawl}
                      disabled={!settings.firecrawlKey?.trim() || firecrawlTestState === 'testing'}
                      className={`p-1 rounded transition-colors ${getTestButtonClass(firecrawlTestState)} disabled:opacity-50`}
                      title="Test API key"
                    >
                      {getTestIcon(firecrawlTestState)}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFirecrawl}
                      disabled={!settings.firecrawlKey?.trim()}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Clear API key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your key from{' '}
                  <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    firecrawl.dev
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {settings.aiProvider === 'claude' ? 'Anthropic API Key' : 'OpenAI API Key'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.aiKey}
                    onChange={(e) => setSettings({ ...settings, aiKey: e.target.value })}
                    placeholder={`Enter your ${settings.aiProvider === 'claude' ? 'Anthropic' : 'OpenAI'} API key`}
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                    <button
                      type="button"
                      onClick={handleTestAiKey}
                      disabled={!settings.aiKey?.trim() || aiTestState === 'testing'}
                      className={`p-1 rounded transition-colors ${getTestButtonClass(aiTestState)} disabled:opacity-50`}
                      title="Test API key"
                    >
                      {getTestIcon(aiTestState)}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAiKey}
                      disabled={!settings.aiKey?.trim()}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Clear API key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your key from{' '}
                  <a 
                    href={settings.aiProvider === 'claude' ? 'https://console.anthropic.com' : 'https://platform.openai.com'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    {settings.aiProvider === 'claude' ? 'console.anthropic.com' : 'platform.openai.com'}
                  </a>
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <div className="text-sm text-gray-600">
            {hasValidConnections ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>API connections verified</span>
              </div>
            ) : hasKeys ? (
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>Test API connections to verify</span>
              </div>
            ) : (
              <span>Enter API keys and test connections</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}