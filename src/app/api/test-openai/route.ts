import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key is required'
      }, { status: 400 })
    }

    // Test OpenAI API with a simple request
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorData = await response.text()
      return NextResponse.json({
        success: false,
        error: `OpenAI API error: ${response.status}`
      }, { status: response.status })
    }

  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test OpenAI API'
    }, { status: 500 })
  }
}