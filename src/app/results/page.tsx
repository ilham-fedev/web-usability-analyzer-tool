'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Download, Share2, BarChart3, Globe, Calendar, 
  AlertTriangle, CheckCircle, Clock, TrendingUp, FileText,
  Smartphone, Monitor, Search, Navigation, Layers, ListTodo
} from 'lucide-react'
import { AnalysisResult, UsabilityCategory, ExportOptions, TodoExportOptions } from '@/types'
import { HistoryManager } from '@/lib/history'

export default function ResultsPage() {
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview')
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingTodos, setIsExportingTodos] = useState(false)

  useEffect(() => {
    const result = localStorage.getItem('analysisResult')
    if (result) {
      try {
        const parsed = JSON.parse(result)
        setAnalysisResult(parsed)
        
        // Save to history automatically when results are loaded (new analysis)
        // Check if this is a fresh analysis (not from history) by checking timestamp
        const now = new Date().getTime()
        const resultTime = new Date(parsed.timestamp).getTime()
        const timeDifference = now - resultTime
        
        // If result is recent (within 5 minutes), save to history
        if (timeDifference < 5 * 60 * 1000) {
          console.log('Saving fresh analysis to history')
          HistoryManager.saveToHistory(parsed)
        }
      } catch (error) {
        console.error('Error loading analysis result:', error)
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }, [])

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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

  const getCategoryIcon = (categoryId: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      navigation: <Navigation className="w-5 h-5" />,
      content_hierarchy: <Layers className="w-5 h-5" />,
      page_names: <FileText className="w-5 h-5" />,
      search: <Search className="w-5 h-5" />,
      forms: <CheckCircle className="w-5 h-5" />,
      mobile_usability: <Smartphone className="w-5 h-5" />,
      page_loading: <Clock className="w-5 h-5" />,
      accessibility: <Globe className="w-5 h-5" />,
      error_handling: <AlertTriangle className="w-5 h-5" />
    }
    return icons[categoryId] || <BarChart3 className="w-5 h-5" />
  }

  const handleExport = async (format: 'pdf' | 'markdown') => {
    setIsExporting(true)
    
    try {
      const exportOptions: ExportOptions = {
        format,
        includeCharts: true,
        includeRecommendations: true,
        includeDetails: true
      }

      const { ExportManager } = await import('@/lib/export')
      
      if (format === 'markdown') {
        await ExportManager.exportToMarkdown(analysisResult, exportOptions)
      } else {
        await ExportManager.exportToPDF(analysisResult, exportOptions)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleTodoExport = async (format: 'markdown' | 'json' | 'csv') => {
    setIsExportingTodos(true)
    
    try {
      const exportOptions: TodoExportOptions = {
        format,
        includePriority: true,
        includeReferences: true,
        groupByCategory: true
      }

      const response = await fetch('/api/export-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResult,
          exportOptions
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate todo export')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Export failed')
      }

      // Create and download file
      const fileExtension = format === 'markdown' ? 'md' : format
      const filename = `usability-todos-${new Date().toISOString().split('T')[0]}.${fileExtension}`
      const content = format === 'json' 
        ? JSON.stringify(result.data, null, 2)
        : result.data
      
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 
              format === 'csv' ? 'text/csv' : 'text/markdown'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Todo export error:', error)
      alert('Todo export failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsExportingTodos(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>New Analysis</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleExport('markdown')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Markdown</span>
            </button>
            
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
            
            {/* Todo Export Buttons */}
            <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
              <span className="text-sm text-gray-600">Todo Tasks:</span>
              
              <button
                onClick={() => handleTodoExport('markdown')}
                disabled={isExportingTodos}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ListTodo className="w-4 h-4" />
                <span>MD</span>
              </button>
              
              <button
                onClick={() => handleTodoExport('json')}
                disabled={isExportingTodos}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ListTodo className="w-4 h-4" />
                <span>JSON</span>
              </button>
              
              <button
                onClick={() => handleTodoExport('csv')}
                disabled={isExportingTodos}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ListTodo className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <Globe className="w-6 h-6 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Usability Analysis Results</h1>
                  <p className="text-xs text-blue-600 font-medium">
                    📚 Comprehensive analysis based on Steve Krug's "Don't Make Me Think" principles
                  </p>
                </div>
              </div>
              <p className="text-gray-600 break-all">{analysisResult.url}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(analysisResult.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Monitor className="w-4 h-4" />
                  <span>{analysisResult.settings.aiProvider === 'claude' ? 'Claude' : 'OpenAI'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="capitalize">{analysisResult.settings.analysisDepth}</span>
                </div>
              </div>
            </div>
            
            {/* Overall Score */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${getScoreColor(analysisResult.overallScore)}`}>
                  <span className="text-2xl font-bold">{analysisResult.overallScore}</span>
                </div>
                <div className="mt-2">
                  <div className="font-medium text-gray-900">{getScoreGrade(analysisResult.overallScore)}</div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysisResult.summary.highIssues}</div>
                <div className="text-sm text-gray-500">High Priority Issues</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysisResult.summary.mediumIssues}</div>
                <div className="text-sm text-gray-500">Medium Issues</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysisResult.summary.lowIssues}</div>
                <div className="text-sm text-gray-500">Low Priority Issues</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analysisResult.crawlData.metadata.totalPages}</div>
                <div className="text-sm text-gray-500">Pages Analyzed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'details', label: 'Detailed Analysis', icon: FileText },
                { id: 'recommendations', label: 'Recommendations', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Scores</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analysisResult.categories.map(category => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getCategoryIcon(category.id)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{category.name}</h4>
                            <p className="text-sm text-gray-500">{category.description}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border ${getScoreColor(category.score!)}`}>
                          <span className="font-medium">{category.score}</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${category.score}%` }}
                        ></div>
                      </div>
                      
                      {category.issues && category.issues.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {category.issues.length} issue(s) found
                          </div>
                          {category.issues.slice(0, 2).map((issue, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded border-l-4 mb-1 ${
                              issue.type === 'high' ? 'bg-red-50 border-red-500 text-red-800' :
                              issue.type === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                              'bg-blue-50 border-blue-500 text-blue-800'
                            }`}>
                              {issue.description || 'No description available'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-8">
                {analysisResult.categories.map(category => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getCategoryIcon(category.id)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-gray-600">{category.description}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full border ${getScoreColor(category.score!)}`}>
                        <span className="font-bold">{category.score}/100</span>
                      </div>
                    </div>

                    {category.details && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          📋 Analysis Details 
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            (Based on HTML structure & content analysis)
                          </span>
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-700">{category.details}</p>
                        </div>
                      </div>
                    )}

                    {category.issues && category.issues.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          🔍 Issues Found ({category.issues.length})
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            (HTML structure & usability analysis)
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {category.issues.map((issue, idx) => (
                            <div key={idx} className={`p-3 rounded border-l-4 ${
                              issue.type === 'high' ? 'bg-red-50 border-red-500' :
                              issue.type === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                              'bg-blue-50 border-blue-500'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${
                                  issue.type === 'high' ? 'text-red-800' :
                                  issue.type === 'medium' ? 'text-yellow-800' :
                                  'text-blue-800'
                                }`}>
                                  {issue.description || 'No description available'}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  issue.type === 'high' ? 'bg-red-200 text-red-800' :
                                  issue.type === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-blue-200 text-blue-800'
                                }`}>
                                  {(issue.type || 'unknown').toUpperCase()}
                                </span>
                              </div>
                              {issue.element && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Element: <code className="bg-gray-100 px-1 rounded text-xs font-mono">{issue.element}</code>
                                </div>
                              )}
                              {issue.krugPrinciple && (
                                <div className="text-xs text-blue-600 italic mt-1">
                                  💡 Principle: {issue.krugPrinciple}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {category.recommendations && category.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          🎯 Recommendations 
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            (Based on "Don't Make Me Think" principles)
                          </span>
                        </h4>
                        <div className="space-y-2">
                          {category.recommendations.map((rec, idx) => (
                            <div key={idx} className="border-l-2 border-blue-200 pl-3">
                              {typeof rec === 'string' ? (
                                <p className="text-gray-700">{rec}</p>
                              ) : (
                                <div className="space-y-1">
                                  <p className="font-medium text-gray-900">{rec.action}</p>
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Task:</span> {rec.userTask}
                                  </p>
                                  {rec.krugReference && (
                                    <p className="text-xs text-blue-600 italic">
                                      Reference: {rec.krugReference}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {category.implementationTasks && category.implementationTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Implementation Tasks</h4>
                        <div className="space-y-1">
                          {category.implementationTasks.map((task, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <input 
                                type="checkbox" 
                                className="mt-1 h-4 w-4 text-blue-600 rounded" 
                                disabled 
                              />
                              <span className="text-gray-700 text-sm">{task.replace(/^\[\s*\]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Priority Recommendations</h3>
                  <div className="space-y-4">
                    {(() => {
                      // Get all recommendations from high-scoring categories and high-priority issues
                      const allRecommendations: Array<{rec: any, category: string, priority: number}> = []
                      
                      analysisResult.categories.forEach(category => {
                        const priority = category.weight // Use weight as priority
                        if (category.recommendations) {
                          category.recommendations.forEach(rec => {
                            allRecommendations.push({ rec, category: category.name, priority })
                          })
                        }
                      })
                      
                      // Sort by priority (weight) and take top 5
                      return allRecommendations
                        .sort((a, b) => b.priority - a.priority)
                        .slice(0, 5)
                        .map(({ rec, category }, idx) => (
                          <div key={idx} className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              {typeof rec === 'string' ? (
                                <div>
                                  <p className="text-blue-900 font-medium">{rec}</p>
                                  <p className="text-blue-700 text-sm mt-1">Category: {category}</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-blue-900 font-medium">{rec.action}</p>
                                  <p className="text-blue-700 text-sm mt-1">
                                    <span className="font-medium">Task:</span> {rec.userTask}
                                  </p>
                                  <p className="text-blue-600 text-xs mt-1">
                                    <span className="font-medium">Category:</span> {category}
                                  </p>
                                  {rec.krugReference && (
                                    <p className="text-blue-600 text-xs italic mt-1">
                                      Reference: {rec.krugReference}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    })()}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-medium text-green-900 mb-2">💡 Quick Wins</h4>
                  <p className="text-green-800 text-sm">
                    Focus on fixing high-priority navigation and content hierarchy issues first. 
                    These changes typically provide the biggest improvement in user experience with minimal effort.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}