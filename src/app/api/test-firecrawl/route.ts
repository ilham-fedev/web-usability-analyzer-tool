import { NextRequest, NextResponse } from 'next/server'
import { FirecrawlClient } from '@/lib/firecrawl'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, settings } = await request.json()

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key is required'
      }, { status: 400 })
    }

    // Test Firecrawl API using the SDK
    const firecrawlClient = new FirecrawlClient(apiKey)
    const isValid = await firecrawlClient.testApiKey(settings)

    if (isValid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Firecrawl API key test failed'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Firecrawl test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test Firecrawl API'
    }, { status: 500 })
  }
}