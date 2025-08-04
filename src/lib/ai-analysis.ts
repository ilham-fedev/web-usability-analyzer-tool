import { AnalysisResult, AnalysisSettings, UsabilityCategory, CrawlResult } from '@/types'

// Steve Krug's usability categories from "Don't Make Me Think"
const USABILITY_CATEGORIES: Omit<UsabilityCategory, 'score' | 'issues' | 'recommendations' | 'details'>[] = [
  {
    id: 'navigation',
    name: 'Navigation Clarity',
    description: 'How easy it is to find and use navigation elements',
    weight: 20
  },
  {
    id: 'content_hierarchy',
    name: 'Content Hierarchy',
    description: 'Clear visual hierarchy and content organization',
    weight: 18
  },
  {
    id: 'page_names',
    name: 'Page Names & Breadcrumbs',
    description: 'Clear page identification and location awareness',
    weight: 15
  },
  {
    id: 'search',
    name: 'Search Functionality',
    description: 'Effective search features and results',
    weight: 12
  },
  {
    id: 'forms',
    name: 'Forms & User Input',
    description: 'User-friendly forms and input validation',
    weight: 10
  },
  {
    id: 'mobile_usability',
    name: 'Mobile Usability',
    description: 'Mobile responsiveness and touch interactions',
    weight: 10
  },
  {
    id: 'page_loading',
    name: 'Page Loading & Performance',
    description: 'Fast loading times and performance optimization',
    weight: 8
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    description: 'Accessible design for all users',
    weight: 5
  },
  {
    id: 'error_handling',
    name: 'Error Handling',
    description: 'Clear error messages and recovery paths',
    weight: 2
  }
]

export class AIAnalysisEngine {
  private settings: AnalysisSettings

  constructor(settings: AnalysisSettings) {
    this.settings = settings
  }

  async analyzeWebsite(url: string, crawlData: CrawlResult): Promise<AnalysisResult> {
    if (!this.settings.aiKey) {
      throw new Error('AI API key is required')
    }

    // Prepare content for AI analysis
    const analysisPrompt = this.createAnalysisPrompt(url, crawlData)
    
    // Get AI analysis
    const aiAnalysis = await this.getAIAnalysis(analysisPrompt)
    
    // Process AI response and calculate scores
    const categories = this.processAnalysisResult(aiAnalysis)
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(categories)
    
    // Generate summary
    const summary = this.generateSummary(categories)
    
    return {
      url,
      timestamp: new Date(),
      settings: this.settings,
      overallScore,
      categories,
      crawlData,
      summary
    }
  }

  private createAnalysisPrompt(url: string, crawlData: CrawlResult): string {
    const pages = crawlData.pages.slice(0, 5) // Limit to first 5 pages for analysis
    
    return `
Analyze this website for usability based on Steve Krug's "Don't Make Me Think" principles.

Website: ${url}
Analysis Depth: ${this.settings.analysisDepth}
Include Mobile: ${this.settings.includeMobile}

Pages analyzed:
${pages.map(page => `
URL: ${page.url}
Title: ${page.title}
Content: ${page.content.slice(0, 2000)}...
`).join('\n')}

Please analyze the website for each of these usability categories and provide a score (0-100) and detailed feedback:

1. Navigation Clarity (20% weight) - How easy is it to find and use navigation?
2. Content Hierarchy (18% weight) - Is there clear visual hierarchy and organization?
3. Page Names & Breadcrumbs (15% weight) - Can users tell where they are?
4. Search Functionality (12% weight) - Is search effective and accessible?
5. Forms & User Input (10% weight) - Are forms user-friendly?
${this.settings.includeMobile ? '6. Mobile Usability (10% weight) - Is it mobile-responsive?' : ''}
7. Page Loading & Performance (8% weight) - Does it load quickly?
8. Accessibility (5% weight) - Is it accessible to all users?
9. Error Handling (2% weight) - Are errors handled well?

For each category, provide:
- Score (0-100)
- 2-3 specific issues found (if any) with priority level (high/medium/low)
- 2-3 actionable recommendations
- Brief explanation of the score

IMPORTANT: Respond ONLY with valid JSON in this exact structure:
{
  "categories": [
    {
      "id": "navigation",
      "score": 85,
      "issues": [
        {"type": "medium", "description": "Navigation menu not sticky on scroll", "element": "header nav"}
      ],
      "recommendations": [
        "Make navigation sticky for better accessibility",
        "Add visual indicators for current page"
      ],
      "details": "Navigation is generally clear but could be improved..."
    }
  ]
}
`
  }

  private async getAIAnalysis(prompt: string): Promise<any> {
    if (this.settings.aiProvider === 'claude') {
      return await this.getClaudeAnalysis(prompt)
    } else {
      return await this.getOpenAIAnalysis(prompt)
    }
  }

  private async getClaudeAnalysis(prompt: string): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.aiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Claude API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    
    try {
      const content = data.content[0].text
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('No valid JSON found in response')
    } catch (error) {
      console.error('Claude response parsing error:', error)
      throw new Error('Failed to parse Claude response')
    }
  }

  private async getOpenAIAnalysis(prompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.aiKey!}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a UX expert specializing in Steve Krug\'s "Don\'t Make Me Think" principles. Analyze websites and provide detailed usability feedback in JSON format only. Do not include any explanatory text outside the JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    
    try {
      const content = data.choices[0].message.content
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('No valid JSON found in response')
    } catch (error) {
      console.error('OpenAI response parsing error:', error)
      throw new Error('Failed to parse OpenAI response')
    }
  }

  private processAnalysisResult(aiAnalysis: any): UsabilityCategory[] {
    const categories: UsabilityCategory[] = USABILITY_CATEGORIES.map(template => {
      const aiCategory = aiAnalysis.categories?.find((cat: any) => cat.id === template.id)
      
      if (!aiCategory) {
        return {
          ...template,
          score: 50,
          issues: [],
          recommendations: ['No specific analysis available'],
          details: 'Unable to analyze this category'
        }
      }

      // Validate and sanitize issues
      const validatedIssues = (aiCategory.issues || []).map((issue: any) => ({
        type: ['high', 'medium', 'low'].includes(issue.type) ? issue.type : 'medium',
        description: issue.description || 'No description provided',
        element: issue.element || undefined,
        page: issue.page || undefined
      }))

      return {
        ...template,
        score: Math.max(0, Math.min(100, aiCategory.score || 50)),
        issues: validatedIssues,
        recommendations: aiCategory.recommendations || [],
        details: aiCategory.details || ''
      }
    })

    // Filter out mobile category if not included
    if (!this.settings.includeMobile) {
      return categories.filter(cat => cat.id !== 'mobile_usability')
    }

    return categories
  }

  private calculateOverallScore(categories: UsabilityCategory[]): number {
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0)
    const weightedScore = categories.reduce((sum, cat) => sum + (cat.score! * cat.weight), 0)
    
    return Math.round(weightedScore / totalWeight)
  }

  private generateSummary(categories: UsabilityCategory[]) {
    const allIssues = categories.flatMap(cat => cat.issues || [])
    const highIssues = allIssues.filter(issue => issue.type === 'high').length
    const mediumIssues = allIssues.filter(issue => issue.type === 'medium').length
    const lowIssues = allIssues.filter(issue => issue.type === 'low').length

    const allRecommendations = categories.flatMap(cat => cat.recommendations || [])
    // Convert recommendations to strings for summary
    const topRecommendations = allRecommendations.slice(0, 5).map(rec => {
      if (typeof rec === 'string') {
        return rec
      }
      // For Recommendation objects, use the action as the summary text
      return rec.action
    })

    return {
      highIssues,
      mediumIssues,
      lowIssues,
      recommendations: topRecommendations
    }
  }
}