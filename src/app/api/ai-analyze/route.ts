import { NextRequest, NextResponse } from 'next/server'
import { AnalysisResult, AnalysisSettings, CrawlResult } from '@/types'
import { AIAnalysisEngine } from '@/lib/ai-analysis'

// Using enhanced AIAnalysisEngine with balanced feedback system

export async function POST(request: NextRequest) {
  try {
    const { url, crawlData, settings }: {
      url: string
      crawlData: CrawlResult
      settings: AnalysisSettings
    } = await request.json()

    console.log('API Route - received analysis request for:', url)

    if (!url || !crawlData || !settings) {
      return NextResponse.json({
        success: false,
        error: 'URL, crawl data, and settings are required'
      }, { status: 400 })
    }

    if (!settings.aiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI API key is required'
      }, { status: 400 })
    }

    // Use the enhanced AI Analysis Engine with balanced feedback
    console.log('API Route - initializing enhanced AI Analysis Engine with balanced feedback...')
    const engine = new AIAnalysisEngine(settings)
    
    console.log('API Route - running enhanced analysis with HTML detection and strengths...')
    const result = await engine.analyzeWebsite(url, crawlData)

    console.log('API Route - enhanced analysis complete, overall score:', result.overallScore)
    console.log('API Route - overall assessment:', result.overallAssessment?.level || 'none')
    console.log('API Route - categories with strengths:', result.categories.filter(c => c.strengths && c.strengths.length > 0).length)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('AI Analysis API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 })
  }
}