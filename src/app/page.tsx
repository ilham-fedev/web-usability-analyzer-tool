'use client'

import React, { useState } from 'react'
import { Search, Settings, History, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SettingsModal from '@/components/SettingsModal'
import { AnalysisSettings } from '@/types'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Listen for custom event to open settings
  React.useEffect(() => {
    const handleOpenSettings = () => {
      setIsSettingsOpen(true)
    }
    
    window.addEventListener('openSettings', handleOpenSettings)
    return () => window.removeEventListener('openSettings', handleOpenSettings)
  }, [])

  const handleAnalyze = async () => {
    if (!url || !isValidUrl(url)) {
      alert('Please enter a valid URL')
      return
    }

    // Check if settings are configured
    const savedSettings = localStorage.getItem('analysisSettings')
    if (!savedSettings) {
      alert('Please configure your API keys in Settings first')
      setIsSettingsOpen(true)
      return
    }

    try {
      const settings = JSON.parse(savedSettings)
      console.log('Homepage - validating settings:', { 
        hasFirecrawl: !!settings.firecrawlKey, 
        hasAI: !!settings.aiKey,
        provider: settings.aiProvider 
      })
      
      if (!settings.firecrawlKey || !settings.aiKey) {
        alert('Please configure your API keys in Settings first')
        setIsSettingsOpen(true)
        return
      }
    } catch (error) {
      console.error('Homepage - settings parsing error:', error)
      alert('Invalid settings configuration. Please reconfigure your settings.')
      setIsSettingsOpen(true)
      return
    }

    setIsLoading(true)
    
    try {
      // Store the URL in localStorage for the analysis page
      localStorage.setItem('analysisUrl', url)
      console.log('Homepage - stored analysis URL:', url)
      
      // Navigate to analysis page
      console.log('Homepage - navigating to analysis page')
      router.push('/analysis')
    } catch (error) {
      console.error('Analysis error:', error)
      setIsLoading(false)
    }
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Navigation */}
      <header className="w-full px-6 py-4">
        <nav className="flex justify-end items-center space-x-6 text-sm">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
            <History size={16} />
            <span>Recent</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors">
            <HelpCircle size={16} />
            <span>Help</span>
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-6xl lg:text-7xl font-light text-gray-900 mb-2 tracking-tight">
            <span className="text-blue-600">🔍</span> Web Usability
          </h1>
          <p className="text-2xl lg:text-3xl text-gray-600 font-light">
            Analyzer
          </p>
          <p className="text-base text-gray-500 mt-3 max-w-md mx-auto">
            Analyze your website using Steve Krug's "Don't Make Me Think" principles
          </p>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-2xl mb-8 animate-slide-up">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter website URL to analyze (e.g., https://example.com)"
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-full 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         hover:shadow-md transition-all duration-200 google-focus"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !url}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium 
                       hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-sm hover:shadow-md
                       flex items-center justify-center space-x-2 min-w-[200px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Analyze Website</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setUrl('https://example.com')}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium 
                       hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Try Demo
          </button>
        </div>

        {/* Quick Stats/Features */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>✨ AI-powered analysis using Claude & OpenAI</p>
          <p>📊 Based on Steve Krug's usability principles</p>
          <p>📄 Download reports in PDF or Markdown</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 space-y-2 sm:space-y-0">
          <div className="flex space-x-6">
            <a href="#" className="hover:text-gray-700 transition-colors">About</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
          </div>
          <div>
            <p>&copy; 2024 Web Usability Analyzer. Built with Next.js & AI.</p>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  )
}