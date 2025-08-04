import { AnalysisResult, HistoryItem } from '@/types'

const HISTORY_KEY = 'analysisHistory'
const MAX_HISTORY_ITEMS = 50

export class HistoryManager {
  /**
   * Save an analysis result to history
   */
  static saveToHistory(analysisResult: AnalysisResult): void {
    try {
      const existingHistory = this.getHistory()
      
      // Create new history item
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        url: analysisResult.url,
        timestamp: new Date(analysisResult.timestamp),
        overallScore: analysisResult.overallScore,
        summary: {
          highIssues: analysisResult.summary.highIssues,
          mediumIssues: analysisResult.summary.mediumIssues,
          lowIssues: analysisResult.summary.lowIssues
        },
        resultData: analysisResult,
        settings: {
          aiProvider: analysisResult.settings.aiProvider,
          analysisDepth: analysisResult.settings.analysisDepth
        }
      }

      // Check if URL already exists in history (to avoid duplicates)
      const existingIndex = existingHistory.findIndex(item => 
        item.url === analysisResult.url && 
        Math.abs(new Date(item.timestamp).getTime() - new Date(analysisResult.timestamp).getTime()) < 60000 // Within 1 minute
      )

      let newHistory: HistoryItem[]
      if (existingIndex !== -1) {
        // Replace existing item (update)
        newHistory = [...existingHistory]
        newHistory[existingIndex] = historyItem
      } else {
        // Add new item to beginning
        newHistory = [historyItem, ...existingHistory]
      }

      // Limit history size
      if (newHistory.length > MAX_HISTORY_ITEMS) {
        newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS)
      }

      // Save to localStorage
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      
      console.log('History saved:', { url: analysisResult.url, totalItems: newHistory.length })
    } catch (error) {
      console.error('Error saving to history:', error)
    }
  }

  /**
   * Get all history items
   */
  static getHistory(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored) as HistoryItem[]
      
      // Ensure dates are properly parsed and sort by timestamp
      return parsed
        .map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.error('Error loading history:', error)
      return []
    }
  }

  /**
   * Get a specific history item by ID
   */
  static getHistoryItem(id: string): HistoryItem | null {
    try {
      const history = this.getHistory()
      return history.find(item => item.id === id) || null
    } catch (error) {
      console.error('Error getting history item:', error)
      return null
    }
  }

  /**
   * Delete a specific history item
   */
  static deleteFromHistory(id: string): boolean {
    try {
      const history = this.getHistory()
      const newHistory = history.filter(item => item.id !== id)
      
      if (newHistory.length === history.length) {
        return false // Item not found
      }

      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      console.log('History item deleted:', { id, remainingItems: newHistory.length })
      return true
    } catch (error) {
      console.error('Error deleting from history:', error)
      return false
    }
  }

  /**
   * Clear all history
   */
  static clearAllHistory(): boolean {
    try {
      localStorage.removeItem(HISTORY_KEY)
      console.log('All history cleared')
      return true
    } catch (error) {
      console.error('Error clearing history:', error)
      return false
    }
  }

  /**
   * Get history stats
   */
  static getHistoryStats(): {
    totalItems: number
    totalUrls: number
    averageScore: number
    scoreDistribution: { excellent: number, good: number, fair: number, poor: number, critical: number }
  } {
    try {
      const history = this.getHistory()
      
      if (history.length === 0) {
        return {
          totalItems: 0,
          totalUrls: 0,
          averageScore: 0,
          scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 }
        }
      }

      // Get unique URLs
      const uniqueUrls = new Set(history.map(item => item.url))
      
      // Calculate average score
      const totalScore = history.reduce((sum, item) => sum + item.overallScore, 0)
      const averageScore = Math.round(totalScore / history.length)
      
      // Calculate score distribution
      const scoreDistribution = history.reduce((dist, item) => {
        const score = item.overallScore
        if (score >= 90) dist.excellent++
        else if (score >= 80) dist.good++
        else if (score >= 70) dist.fair++
        else if (score >= 60) dist.poor++
        else dist.critical++
        return dist
      }, { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 })

      return {
        totalItems: history.length,
        totalUrls: uniqueUrls.size,
        averageScore,
        scoreDistribution
      }
    } catch (error) {
      console.error('Error getting history stats:', error)
      return {
        totalItems: 0,
        totalUrls: 0,
        averageScore: 0,
        scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 }
      }
    }
  }

  /**
   * Search history by URL
   */
  static searchHistory(query: string): HistoryItem[] {
    try {
      const history = this.getHistory()
      const lowerQuery = query.toLowerCase()
      
      return history.filter(item => 
        item.url.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Error searching history:', error)
      return []
    }
  }

  /**
   * Export history as JSON
   */
  static exportHistory(): string {
    try {
      const history = this.getHistory()
      return JSON.stringify(history, null, 2)
    } catch (error) {
      console.error('Error exporting history:', error)
      return '[]'
    }
  }

  /**
   * Import history from JSON
   */
  static importHistory(jsonData: string): boolean {
    try {
      const importedHistory = JSON.parse(jsonData) as HistoryItem[]
      
      // Validate structure
      if (!Array.isArray(importedHistory)) {
        throw new Error('Invalid history format')
      }

      // Merge with existing history (avoid duplicates)
      const existingHistory = this.getHistory()
      const existingUrls = new Set(existingHistory.map(item => `${item.url}_${item.timestamp.getTime()}`))
      
      const newItems = importedHistory.filter(item => 
        !existingUrls.has(`${item.url}_${new Date(item.timestamp).getTime()}`)
      )

      const mergedHistory = [...existingHistory, ...newItems]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_HISTORY_ITEMS)

      localStorage.setItem(HISTORY_KEY, JSON.stringify(mergedHistory))
      console.log('History imported:', { newItems: newItems.length, totalItems: mergedHistory.length })
      return true
    } catch (error) {
      console.error('Error importing history:', error)
      return false
    }
  }
}