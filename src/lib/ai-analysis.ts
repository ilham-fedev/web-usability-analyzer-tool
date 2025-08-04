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
    const pages = crawlData.pages.slice(0, 3) // Limit to first 3 pages for detailed analysis
    
    return `
COMPREHENSIVE USABILITY ANALYSIS based on Steve Krug's "Don't Make Me Think" - Complete Implementation Guide

You are analyzing website usability using the complete 13-chapter framework from Steve Krug's book. Analyze BOTH the HTML structure AND markdown content for each page.

Website: ${url}
Analysis Depth: ${this.settings.analysisDepth}
Include Mobile: ${this.settings.includeMobile}

PAGES TO ANALYZE:
${pages.map(page => {
  const htmlContent = page.metadata?.htmlContent || '';
  const markdownContent = page.metadata?.markdownContent || '';
  
  return `
=== PAGE: ${page.url} ===
TITLE: ${page.title}

HTML STRUCTURE (first 1500 chars):
${htmlContent.slice(0, 1500)}...

MARKDOWN CONTENT (first 1000 chars):
${markdownContent.slice(0, 1000)}...

METADATA:
- Description: ${page.metadata?.description || 'None'}
- OG Title: ${page.metadata?.ogTitle || 'None'}
- Status Code: ${page.metadata?.statusCode || 'Unknown'}
`;
}).join('\n')}

ANALYSIS FRAMEWORK - Apply these specific principles to the HTML and content:

1. NAVIGATION CLARITY (20% weight) - Chapter 6 Principles
HTML Analysis: Look for <nav>, <header>, navigation <ul>, menu structure, breadcrumbs
Implementation Checks:
- Persistent navigation elements present?
- Site ID/logo in top-left linking to home?
- Primary sections clearly identified?
- Current page indicators ("you are here")?
- Navigation hierarchy clear from HTML structure?

2. CONTENT HIERARCHY (18% weight) - Chapter 3 Billboard Design
HTML Analysis: Examine heading structure (h1-h6), semantic elements, visual organization
Implementation Checks:
- Proper heading hierarchy (h1 → h2 → h3)?
- Important elements use larger/bold styling?
- Clear visual hierarchy in HTML structure?
- Related items grouped in containers?
- Scannable text formatting (lists, short paragraphs)?

3. PAGE NAMES & BREADCRUMBS (15% weight) - Chapter 6 Navigation
HTML Analysis: Check for page titles, breadcrumb elements, heading structure
Implementation Checks:
- Every page has prominent name/title?
- Page name matches what user clicked?
- Breadcrumb navigation present?
- Clear path from home to current location?

4. SEARCH FUNCTIONALITY (12% weight) - Chapter 6
HTML Analysis: Look for search forms, input elements, search placement
Implementation Checks:
- Search box in expected location (top-right/center)?
- Search form properly structured?
- Search functionality obvious and accessible?

5. FORMS & USER INPUT (10% weight) - Chapter 11 Courtesy
HTML Analysis: Examine form elements, labels, input types, validation
Implementation Checks:
- Form labels properly associated with inputs?
- Required fields clearly marked?
- Input types appropriate (email, tel, etc.)?
- Error handling visible in HTML structure?
- Forms ask only for necessary information?

${this.settings.includeMobile ? `6. MOBILE USABILITY (10% weight) - Chapter 10
HTML Analysis: Check for responsive elements, viewport meta, touch-friendly design
Implementation Checks:
- Viewport meta tag present?
- Touch-friendly navigation (44px+ targets)?
- Responsive design patterns in HTML?
- Mobile-specific elements or adaptations?
- Content prioritized for mobile?` : ''}

7. PAGE LOADING & PERFORMANCE (8% weight) - Chapter 10
HTML Analysis: Assess HTML structure efficiency, resource loading
Implementation Checks:
- Clean, efficient HTML structure?
- Minimal unnecessary elements?
- Images with proper attributes?
- Performance-oriented HTML patterns?

8. ACCESSIBILITY (5% weight) - Chapter 12
HTML Analysis: Examine semantic HTML, ARIA attributes, accessibility features
Implementation Checks:
- Semantic HTML elements used (nav, main, article, etc.)?
- Images have alt attributes?
- Headings used correctly for structure?
- Form labels properly associated?
- Skip navigation links present?
- Color not sole means of conveying information?

9. ERROR HANDLING (2% weight) - Chapter 11
HTML Analysis: Look for error messages, validation, user feedback
Implementation Checks:
- Error messages clear and helpful?
- Recovery paths provided?
- User feedback mechanisms present?

STEVE KRUG'S CORE PRINCIPLES TO EVALUATE:
✓ Chapter 1: Self-evident design - Is everything obvious at a glance?
✓ Chapter 2: Scanning behavior - Is content optimized for scanning?
✓ Chapter 3: Visual hierarchy - Clear importance levels?
✓ Chapter 4: Mindless choices - Are options clear and unambiguous?
✓ Chapter 5: Conciseness - Eliminate unnecessary words/elements?
✓ Chapter 7: Homepage clarity - Purpose immediately clear?

For each category, analyze the HTML structure AND content, then provide:
- Score (0-100) based on implementation task completion
- Specific HTML elements or content issues found
- Priority level (high/medium/low) for each issue
- Actionable recommendations tied to Krug's principles
- Reference to specific implementation tasks from the guide

RESPOND ONLY WITH VALID JSON:
{
  "categories": [
    {
      "id": "navigation",
      "score": 85,
      "issues": [
        {
          "type": "medium", 
          "description": "Navigation lacks 'you are here' indicators", 
          "element": "nav ul.main-menu",
          "krugPrinciple": "Chapter 6: Users need to know where they are"
        }
      ],
      "recommendations": [
        {
          "action": "Add current page highlighting to navigation menu",
          "userTask": "Implement active state styling for current page in navigation",
          "krugReference": "Chapter 6: Persistent navigation with location awareness"
        }
      ],
      "details": "Navigation structure analysis based on HTML nav elements..."
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
        max_tokens: 8000,  // Increased for comprehensive analysis
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
            content: 'You are a UX expert specializing in Steve Krug\'s "Don\'t Make Me Think" principles with deep knowledge of HTML structure analysis and web usability patterns. Analyze both HTML structure and content thoroughly, providing specific technical recommendations based on Krug\'s implementation guide. Respond in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000,  // Increased for comprehensive analysis
        temperature: 0.2  // Lower temperature for more consistent technical analysis
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
        page: issue.page || undefined,
        krugPrinciple: issue.krugPrinciple || undefined
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