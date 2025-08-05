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

  private parseHtmlElements(html: string): Record<string, number> {
    if (!html) return {};
    
    const elements = {
      'Forms': (html.match(/<form/gi) || []).length,
      'Navigation elements': (html.match(/<nav/gi) || []).length,
      'H1 headings': (html.match(/<h1/gi) || []).length,
      'H2 headings': (html.match(/<h2/gi) || []).length,
      'H3 headings': (html.match(/<h3/gi) || []).length,
      'Input fields': (html.match(/<input/gi) || []).length,
      'Buttons': (html.match(/<button/gi) || []).length,
      'Links': (html.match(/<a\s/gi) || []).length,
      'Images': (html.match(/<img/gi) || []).length,
      'Lists (ul/ol)': ((html.match(/<ul/gi) || []).length + (html.match(/<ol/gi) || []).length),
      'Tables': (html.match(/<table/gi) || []).length,
      'Main content areas': (html.match(/<main/gi) || []).length,
      'Article elements': (html.match(/<article/gi) || []).length,
      'Section elements': (html.match(/<section/gi) || []).length,
      'Header elements': (html.match(/<header/gi) || []).length,
      'Footer elements': (html.match(/<footer/gi) || []).length,
      'Search inputs': (html.match(/<input[^>]*type=["\']search["\'][^>]*>/gi) || []).length,
      'Email inputs': (html.match(/<input[^>]*type=["\']email["\'][^>]*>/gi) || []).length,
      'Text inputs': (html.match(/<input[^>]*type=["\']text["\'][^>]*>/gi) || []).length,
      'Textareas': (html.match(/<textarea/gi) || []).length,
      'Select dropdowns': (html.match(/<select/gi) || []).length,
      'Meta viewport': (html.match(/<meta[^>]*name=["\']viewport["\'][^>]*>/gi) || []).length,
      'Alt attributes': (html.match(/alt=["\'][^"\']*["\']>/gi) || []).length,
      'ARIA labels': (html.match(/aria-label=["\'][^"\']*["\']>/gi) || []).length,
      'Skip links': (html.match(/skip[^>]*>/gi) || []).length
    };
    
    return elements;
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
    
    // Process overall assessment from AI response
    const overallAssessment = aiAnalysis.overallAssessment ? {
      level: ['excellent', 'good', 'moderate', 'poor'].includes(aiAnalysis.overallAssessment.level) 
        ? aiAnalysis.overallAssessment.level 
        : 'moderate',
      message: aiAnalysis.overallAssessment.message || 'Website analysis completed',
      strengths: Array.isArray(aiAnalysis.overallAssessment.strengths) 
        ? aiAnalysis.overallAssessment.strengths.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        : []
    } : undefined
    
    // Generate summary
    const summary = this.generateSummary(categories)
    
    return {
      url,
      timestamp: new Date(),
      settings: this.settings,
      overallScore,
      overallAssessment,
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
  
  // Parse HTML elements for accurate detection
  const elementCounts = this.parseHtmlElements(htmlContent);
  
  return `
=== PAGE: ${page.url} ===
TITLE: ${page.title}

DETECTED HTML ELEMENTS:
${Object.entries(elementCounts).map(([element, count]) => `- ${element}: ${count} found`).join('\n')}

FULL HTML STRUCTURE (first 8000 chars):
${htmlContent.slice(0, 8000)}...

MARKDOWN CONTENT (first 2000 chars):
${markdownContent.slice(0, 2000)}...

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

IMPORTANT: For each category, provide BALANCED feedback - both strengths AND areas for improvement.

For each category, analyze the HTML structure AND content, then provide:
- Score (0-100) based on implementation task completion
- STRENGTHS: What is working well (list positive aspects found)
- ISSUES: What needs improvement (with priority levels)
- ASSESSMENT: Overall category health (excellent/good/moderate/poor)
- Actionable recommendations tied to Krug's principles
- Reference to specific implementation tasks from the guide

DO NOT claim elements are missing if they are listed in DETECTED HTML ELEMENTS above.
If forms are detected (Forms: 1 found), do not say "no forms present".
Base your analysis on the ACTUAL HTML elements detected, not assumptions.

RESPOND ONLY WITH VALID JSON:
{
  "overallAssessment": {
    "level": "good",
    "message": "The website shows good usability foundations with several strengths and some areas for improvement",
    "strengths": ["Clear navigation structure", "Good HTML semantics", "Mobile viewport present"]
  },
  "categories": [
    {
      "id": "navigation",
      "score": 85,
      "assessment": "good",
      "strengths": [
        "Navigation elements properly structured with semantic HTML",
        "Clear menu hierarchy visible in HTML structure"
      ],
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
      "details": "Navigation analysis based on detected nav elements and HTML structure..."
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
    // Try different Claude models in order of preference
    const models = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
    
    let lastError: Error | null = null
    
    for (const model of models) {
      try {
        console.log(`Trying Claude model: ${model}`)
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.settings.aiKey!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
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
          console.error(`Claude API error for model ${model}:`, errorData)
          
          // If it's a 404 (model not found), try next model
          if (response.status === 404) {
            lastError = new Error(`Model ${model} not found`)
            continue
          }
          
          // For other errors, throw immediately
          throw new Error(`Claude API error: ${response.status} - ${errorData}`)
        }

        const data = await response.json()
        console.log(`Claude API response received for model: ${model}`)
        
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
        
      } catch (error) {
        console.error(`Error with model ${model}:`, error)
        lastError = error as Error
        
        // If it's not a model-not-found error, break the loop
        if (!(error as Error).message.includes('not found') && !(error as Error).message.includes('404')) {
          throw error
        }
      }
    }
    
    // If we've tried all models and none worked
    throw new Error(`All Claude models failed. Last error: ${lastError?.message}`)
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
        max_tokens: 4000,  // Reduced to fit within OpenAI context limits
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
        // Provide comprehensive Krug-based analysis for missing categories
        return this.getKrugBasedRecommendations(template)
      }

      // Get Krug-based fallback data for this category
      const krugFallback = this.getKrugBasedRecommendations(template)

      // Validate and sanitize issues
      const validatedIssues = (aiCategory.issues || []).map((issue: any) => ({
        type: ['high', 'medium', 'low'].includes(issue.type) ? issue.type : 'medium',
        description: issue.description || 'No description provided',
        element: issue.element || undefined,
        page: issue.page || undefined,
        krugPrinciple: issue.krugPrinciple || undefined
      }))

      // Validate and sanitize strengths
      const validatedStrengths = Array.isArray(aiCategory.strengths) 
        ? aiCategory.strengths.filter((strength: any) => typeof strength === 'string' && strength.trim().length > 0)
        : []

      // Validate assessment level
      const validAssessment = ['excellent', 'good', 'moderate', 'poor'].includes(aiCategory.assessment) 
        ? aiCategory.assessment 
        : 'moderate'

      // Generate contextual implementation tasks based on actual issues found
      const contextualTasks = this.generateContextualTasks(template.id, validatedIssues, aiCategory)

      // Use AI data where available, fall back to Krug-based data for missing fields
      return {
        ...template,
        score: Math.max(0, Math.min(100, aiCategory.score || 50)),
        issues: validatedIssues,
        strengths: validatedStrengths.length > 0 ? validatedStrengths : krugFallback.strengths || [],
        recommendations: aiCategory.recommendations && aiCategory.recommendations.length > 0 
          ? aiCategory.recommendations 
          : krugFallback.recommendations || [],
        implementationTasks: contextualTasks.length > 0 
          ? contextualTasks 
          : [],
        details: aiCategory.details || krugFallback.details || '',
        assessment: validAssessment
      }
    })

    // Filter out mobile category if not included
    if (!this.settings.includeMobile) {
      return categories.filter(cat => cat.id !== 'mobile_usability')
    }

    return categories
  }

  private generateContextualTasks(categoryId: string, issues: any[], aiCategory: any): string[] {
    const tasks: string[] = []
    
    // Generate tasks based on specific issues found
    issues.forEach(issue => {
      const taskMapping = this.getTaskMappingForIssue(categoryId, issue)
      if (taskMapping) {
        tasks.push(taskMapping)
      }
    })

    // Only add general review task if score is very low and no specific tasks found
    const score = aiCategory?.score || 50
    if (tasks.length === 0 && score < 60) {
      const additionalTasks = this.getAdditionalTasksForCategory(categoryId, score)
      tasks.push(...additionalTasks)
    }

    // Remove duplicates and limit to most relevant tasks
    return Array.from(new Set(tasks)).slice(0, 3)
  }

  private getTaskMappingForIssue(categoryId: string, issue: any): string | null {
    const taskMappings: { [key: string]: { [key: string]: string } } = {
      navigation: {
        'indicators': '[ ] Implement current page indicators in navigation menu',
        'location': '[ ] Add "you are here" indicators to show current location',
        'breadcrumb': '[ ] Add breadcrumb navigation showing path from home',
        'persistent': '[ ] Ensure navigation appears consistently on all pages',
        'primary': '[ ] Clearly identify primary navigation sections',
        'identification': '[ ] Add prominent site logo/ID linking to homepage',
        'sections': '[ ] Organize navigation into clear primary sections'
      },
      content_hierarchy: {
        'scanning': '[ ] Format content with headings and bullet points for scanning',
        'hierarchy': '[ ] Make important elements larger and more prominent',
        'visual': '[ ] Strengthen visual hierarchy with better contrast and spacing',
        'noise': '[ ] Reduce visual clutter and unnecessary elements'
      },
      page_names: {
        'match': '[ ] Ensure page titles match navigation link text exactly',
        'prominent': '[ ] Make page names more prominent and visible',
        'breadcrumb': '[ ] Implement breadcrumb trail for page location'
      },
      search: {
        'location': '[ ] Move search box to expected location (top right)',
        'prominent': '[ ] Make search box more visible and obviously searchable',
        'conventions': '[ ] Follow standard web search conventions'
      },
      forms: {
        'thinking': '[ ] Simplify form choices to require less user thinking',
        'required': '[ ] Reduce number of required form fields',
        'labels': '[ ] Improve form label clarity and association',
        'help': '[ ] Add contextual help for complex form fields'
      },
      mobile_usability: {
        'touch': '[ ] Increase touch target sizes to 44px minimum',
        'thumb': '[ ] Optimize interface for thumb-friendly navigation',
        'responsive': '[ ] Improve responsive design for mobile devices',
        'content': '[ ] Prioritize most important content for mobile'
      },
      page_loading: {
        'speed': '[ ] Optimize images and minimize HTTP requests',
        'performance': '[ ] Implement performance optimizations',
        'loading': '[ ] Add progressive loading for better perceived speed'
      },
      accessibility: {
        'alt': '[ ] Add alt text to all images',
        'headings': '[ ] Use proper heading structure (H1, H2, H3)',
        'labels': '[ ] Associate form labels with input fields',
        'keyboard': '[ ] Ensure full keyboard accessibility',
        'skip': '[ ] Add skip navigation links'
      },
      error_handling: {
        'messages': '[ ] Write clearer, more helpful error messages',
        'recovery': '[ ] Provide specific recovery steps for errors',
        'graceful': '[ ] Implement graceful error handling'
      }
    }

    const categoryMappings = taskMappings[categoryId]
    if (!categoryMappings) return null

    const description = issue.description.toLowerCase()
    
    // Find matching task based on issue description keywords
    for (const [keyword, task] of Object.entries(categoryMappings)) {
      if (description.includes(keyword)) {
        return task
      }
    }

    return null
  }

  private getAdditionalTasksForCategory(categoryId: string, _score: number): string[] {
    // Add essential tasks for categories with lower scores
    const essentialTasks: { [key: string]: string[] } = {
      navigation: [
        '[ ] Review navigation structure for clarity and consistency'
      ],
      content_hierarchy: [
        '[ ] Audit content for scannability and visual hierarchy'
      ],
      page_names: [
        '[ ] Review all page titles for consistency'
      ],
      search: [
        '[ ] Test search functionality and placement'
      ],
      forms: [
        '[ ] Conduct form usability review'
      ],
      mobile_usability: [
        '[ ] Test mobile experience on actual devices'
      ],
      page_loading: [
        '[ ] Measure and optimize page loading times'
      ],
      accessibility: [
        '[ ] Conduct basic accessibility audit'
      ],
      error_handling: [
        '[ ] Review and improve error handling workflows'
      ]
    }

    return essentialTasks[categoryId] || []
  }

  private getKrugBasedRecommendations(template: Omit<UsabilityCategory, 'score' | 'issues' | 'recommendations' | 'details'>): UsabilityCategory {
    const krugRecommendations: { [key: string]: any } = {
      navigation: {
        score: 70,
        assessment: 'moderate',
        strengths: [
          'Basic navigation structure appears to be present',
          'Navigation elements seem to be positioned conventionally'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Navigation may lack "you are here" indicators for location awareness',
            element: 'site navigation',
            krugPrinciple: 'Users must always know where they are (Chapter 6)'
          },
          {
            type: 'medium',
            description: 'Breadcrumb navigation may be missing',
            element: 'navigation breadcrumbs',
            krugPrinciple: 'Show path from home to current location (Chapter 6)'
          }
        ],
        recommendations: [
          {
            action: 'Implement persistent navigation on every page',
            userTask: 'Ensure site ID/logo, primary sections, and utilities appear consistently',
            krugReference: 'Chapter 6: Street Signs and Breadcrumbs'
          },
          {
            action: 'Add "you are here" indicators',
            userTask: 'Highlight current page/section in navigation menu',
            krugReference: 'Chapter 6: Persistent Navigation'
          }
        ],
        implementationTasks: [
          '[ ] Design persistent navigation with site ID/logo linking to home',
          '[ ] Add primary sections and utilities (search, login, help)',
          '[ ] Implement current page indicators with visual styling',
          '[ ] Create breadcrumb trail showing path from home',
          '[ ] Test with "trunk test" - can users identify current location?'
        ],
        details: 'Navigation should follow Krug\'s principles of persistent, clear wayfinding that tells users where they are and where they can go.'
      },

      content_hierarchy: {
        score: 65,
        assessment: 'moderate',
        strengths: [
          'Content appears to have basic heading structure',
          'Visual separation between different content areas seems present'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Content may not be optimized for scanning behavior',
            element: 'page content',
            krugPrinciple: 'Users scan, they don\'t read (Chapter 2)'
          },
          {
            type: 'low',
            description: 'Visual hierarchy could be strengthened for better information prioritization',
            element: 'content layout',
            krugPrinciple: 'Make important things more prominent (Chapter 3)'
          }
        ],
        recommendations: [
          {
            action: 'Implement clear visual hierarchy with prominent headings',
            userTask: 'Make important elements larger, bolder, or more prominent',
            krugReference: 'Chapter 3: Billboard Design 101'
          },
          {
            action: 'Format text for scanning with bullet points and short paragraphs',
            userTask: 'Use descriptive headings and highlight key terms',
            krugReference: 'Chapter 3: Scannable Text'
          }
        ],
        implementationTasks: [
          '[ ] Implement visual hierarchy with important elements more prominent',
          '[ ] Use plenty of headings and subheadings for scanning',
          '[ ] Keep paragraphs short and use bulleted lists',
          '[ ] Highlight key terms and phrases',
          '[ ] Reduce visual noise and use white space effectively'
        ],
        details: 'Content should be designed like a billboard - clear, scannable, and immediately understandable.'
      },

      page_names: {
        score: 70,
        assessment: 'moderate',
        strengths: [
          'Pages appear to have titles or headings',
          'Basic page identification seems to be in place'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Page names may not match navigation link text',
            element: 'page titles',
            krugPrinciple: 'Page name should match what user clicked (Chapter 6)'
          }
        ],
        recommendations: [
          {
            action: 'Ensure page names match navigation links exactly',
            userTask: 'Review all page titles for consistency with navigation text',
            krugReference: 'Chapter 6: Page Names'
          }
        ],
        implementationTasks: [
          '[ ] Create prominent page names matching navigation links',
          '[ ] Position page names as headings for unique content',
          '[ ] Implement breadcrumb trail for location awareness',
          '[ ] Test "trunk test" - can users identify where they are?'
        ],
        details: 'Clear page identification is essential for user orientation and confidence.'
      },

      search: {
        score: 60,
        assessment: 'moderate',
        strengths: [
          'Site may have search functionality available'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Search functionality may not follow web conventions',
            element: 'search interface',
            krugPrinciple: 'Follow established web conventions (Chapter 3)'
          },
          {
            type: 'low',
            description: 'Search box may not be in expected location (top right)',
            element: 'search placement',
            krugPrinciple: 'Put things where users expect to find them (Chapter 3)'
          }
        ],
        recommendations: [
          {
            action: 'Position search box in conventional location (top right)',
            userTask: 'Place search where users expect to find it',
            krugReference: 'Chapter 3: Web Conventions'
          }
        ],
        implementationTasks: [
          '[ ] Position search box in expected location (top right)',
          '[ ] Make search box prominent and obviously searchable',
          '[ ] Include search on every page for persistence',
          '[ ] Provide effective search results and suggestions'
        ],
        details: 'Search should follow web conventions and be self-evident to users.'
      },

      forms: {
        score: 65,
        assessment: 'moderate',
        strengths: [
          'Forms appear to have proper labels and structure',
          'Basic form usability seems to be considered'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Forms may require too much thinking from users',
            element: 'form interfaces',
            krugPrinciple: 'Eliminate question marks and make choices mindless (Chapter 4)'
          }
        ],
        recommendations: [
          {
            action: 'Simplify form choices and reduce required fields',
            userTask: 'Audit forms for unnecessary complexity',
            krugReference: 'Chapter 4: Mindless Choices'
          }
        ],
        implementationTasks: [
          '[ ] Audit forms for unnecessary fields and complexity',
          '[ ] Make form choices obvious and mindless',
          '[ ] Associate form labels clearly with fields',
          '[ ] Provide clear, immediate help when needed',
          '[ ] Accept data in multiple formats where possible'
        ],
        details: 'Forms should require minimal thinking and provide clear, obvious choices.'
      },

      mobile_usability: {
        score: 65,
        assessment: 'moderate',
        strengths: [
          'Site has mobile viewport configuration',
          'Basic responsive design appears to be implemented'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Touch targets may not be optimized for thumb-friendly interaction',
            element: 'mobile interface',
            krugPrinciple: 'Mobile requires different interaction patterns (Chapter 10)'
          }
        ],
        recommendations: [
          {
            action: 'Ensure touch targets are thumb-friendly (44px minimum)',
            userTask: 'Review and resize all clickable elements for mobile',
            krugReference: 'Chapter 10: Mobile Design'
          }
        ],
        implementationTasks: [
          '[ ] Ensure touch targets are thumb-friendly (44px minimum)',
          '[ ] Prioritize most important content first on mobile',
          '[ ] Remove hover-dependent features for touch interfaces',
          '[ ] Test with actual devices, not just simulators',
          '[ ] Optimize images and minimize load times for mobile'
        ],
        details: 'Mobile design should accommodate touch interactions and content prioritization.'
      },

      page_loading: {
        score: 75,
        assessment: 'good',
        strengths: [
          'Page appears to load reasonably well',
          'Basic performance optimization seems to be in place'
        ],
        issues: [
          {
            type: 'low',
            description: 'Loading speed optimization could preserve more user goodwill',
            element: 'site performance',
            krugPrinciple: 'Preserve user goodwill reservoir (Chapter 11)'
          }
        ],
        recommendations: [
          {
            action: 'Optimize loading speed to preserve goodwill',
            userTask: 'Implement performance optimizations for faster perceived loading',
            krugReference: 'Chapter 11: Goodwill Reservoir'
          }
        ],
        implementationTasks: [
          '[ ] Optimize images and minimize HTTP requests',
          '[ ] Implement progressive loading for better perceived performance',
          '[ ] Minimize page load times across different connection types',
          '[ ] Use compression and caching strategies'
        ],
        details: 'Fast loading preserves user goodwill and supports seamless user experience.'
      },

      accessibility: {
        score: 60,
        assessment: 'moderate',
        strengths: [
          'Basic HTML structure appears to use semantic elements',
          'Forms seem to have associated labels'
        ],
        issues: [
          {
            type: 'high',
            description: 'May be missing basic accessibility features that help everyone',
            element: 'site accessibility',
            krugPrinciple: 'Accessibility improvements help everyone (Chapter 12)'
          }
        ],
        recommendations: [
          {
            action: 'Implement basic accessibility features first',
            userTask: 'Add alt text, proper headings, and keyboard navigation',
            krugReference: 'Chapter 12: Accessibility and You'
          }
        ],
        implementationTasks: [
          '[ ] Add alt text to all images',
          '[ ] Use heading tags correctly (H1, H2, H3)',
          '[ ] Associate form labels with fields',
          '[ ] Ensure keyboard accessibility for all interactive elements',
          '[ ] Test with screen reader software'
        ],
        details: 'Basic accessibility improvements often improve usability for everyone.'
      },

      error_handling: {
        score: 70,
        assessment: 'moderate',
        strengths: [
          'Site appears to have basic error handling in place'
        ],
        issues: [
          {
            type: 'medium',
            description: 'Error messages may not provide clear recovery paths',
            element: 'error handling',
            krugPrinciple: 'Help users recover gracefully and preserve goodwill (Chapter 11)'
          }
        ],
        recommendations: [
          {
            action: 'Create helpful error messages with recovery steps',
            userTask: 'Write clear, specific error messages with actionable solutions',
            krugReference: 'Chapter 11: Common Courtesy'
          }
        ],
        implementationTasks: [
          '[ ] Write clear, helpful error messages',
          '[ ] Provide specific recovery suggestions',
          '[ ] Test error scenarios for user-friendliness',
          '[ ] Ensure errors don\'t break user workflow'
        ],
        details: 'Error handling should be courteous and helpful, preserving user goodwill.'
      }
    }
    
    const categoryData = krugRecommendations[template.id]
    if (!categoryData) {
      // Fallback for unknown categories
      return {
        ...template,
        score: 50,
        assessment: 'moderate',
        strengths: ['Basic functionality appears to be present'],
        issues: [
          {
            type: 'medium',
            description: 'This area needs review for Krug\'s usability principles',
            element: 'general',
            krugPrinciple: 'Don\'t make users think (Chapter 1)'
          }
        ],
        recommendations: [
          {
            action: 'Review this area for Krug\'s usability principles',
            userTask: 'Apply self-evident design and user-centered thinking',
            krugReference: 'Chapter 1: Don\'t Make Me Think'
          }
        ],
        implementationTasks: [
          '[ ] Audit this area for clarity and user-friendliness',
          '[ ] Apply Krug\'s principle of self-evident design',
          '[ ] Test with real users for usability issues'
        ],
        details: 'This area should follow Krug\'s fundamental principles of clear, user-friendly design.'
      }
    }
    
    return {
      ...template,
      ...categoryData
    }
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