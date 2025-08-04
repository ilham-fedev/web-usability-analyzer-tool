'use client'

import React, { useState, useEffect } from 'react'
import { X, History, Play, Trash2, Calendar, Globe, BarChart3, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { HistoryItem } from '@/types'

interface RecentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RecentModal({ isOpen, onClose }: RecentModalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const router = useRouter()

  // Load history from localStorage
  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('analysisHistory')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Sort by timestamp, most recent first
        const sortedHistory = parsed
          .map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
          .sort((a: HistoryItem, b: HistoryItem) => b.timestamp.getTime() - a.timestamp.getTime())
        setHistory(sortedHistory)
      } else {
        setHistory([])
      }
    } catch (error) {
      console.error('Error loading history:', error)
      setHistory([])
    }
  }

  const handlePlayResult = (item: HistoryItem) => {
    setIsLoading(true)
    try {
      // Store the historical result data for the results page
      localStorage.setItem('analysisResult', JSON.stringify(item.resultData))
      
      // Navigate to results page
      router.push('/results')
      onClose()
    } catch (error) {
      console.error('Error loading historical result:', error)
      alert('Failed to load historical result')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = (id: string) => {
    try {
      const newHistory = history.filter(item => item.id !== id)
      setHistory(newHistory)
      localStorage.setItem('analysisHistory', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Error deleting history item:', error)
      alert('Failed to delete item')
    }
  }

  const handleClearAll = () => {
    try {
      setHistory([])
      localStorage.removeItem('analysisHistory')
      setShowConfirmClear(false)
    } catch (error) {
      console.error('Error clearing history:', error)
      alert('Failed to clear history')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Poor'
    return 'Critical'
  }

  const formatUrl = (url: string) => {
    if (url.length > 50) {
      return url.substring(0, 47) + '...'
    }
    return url
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Analysis</h2>
              <p className="text-sm text-gray-500">
                {history.length} {history.length === 1 ? 'analysis' : 'analyses'} saved
              </p>
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
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis History</h3>
              <p className="text-gray-500 text-center max-w-md">
                Your analyzed websites will appear here. Start by analyzing a website to build your history.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* URL and Score */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium truncate" title={item.url}>
                            {formatUrl(item.url)}
                          </span>
                        </div>
                        <div className={`ml-3 px-3 py-1 rounded-full border text-sm font-medium flex-shrink-0 ${getScoreColor(item.overallScore)}`}>
                          {item.overallScore} - {getScoreGrade(item.overallScore)}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{item.timestamp.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-4 h-4" />
                          <span className="capitalize">{item.settings.analysisDepth}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            {item.settings.aiProvider === 'claude' ? 'Claude' : 'OpenAI'}
                          </span>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">{item.summary.highIssues} high</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">{item.summary.mediumIssues} medium</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">{item.summary.lowIssues} low</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handlePlayResult(item)}
                        disabled={isLoading}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        title="View results"
                      >
                        <Play className="w-4 h-4" />
                        <span className="text-sm">View</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        {history.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <div className="text-sm text-gray-600">
              {history.length} {history.length === 1 ? 'item' : 'items'} in history
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmClear && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear All History?</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete all {history.length} analysis results from your history. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}