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

    // Test Claude API with a simple message
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      })
    })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorData = await response.text()
      return NextResponse.json({
        success: false,
        error: `Claude API error: ${response.status}`
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Claude test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test Claude API'
    }, { status: 500 })
  }
}