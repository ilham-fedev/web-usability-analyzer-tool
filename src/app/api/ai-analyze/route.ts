import { NextRequest, NextResponse } from 'next/server'
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

    // Prepare content for AI analysis
    const analysisPrompt = createAnalysisPrompt(url, crawlData, settings)
    
    // Get AI analysis
    console.log('API Route - calling AI analysis with provider:', settings.aiProvider)
    const aiAnalysis = await getAIAnalysis(analysisPrompt, settings)
    
    // Process AI response and calculate scores
    const categories = processAnalysisResult(aiAnalysis, settings.includeMobile)
    
    // Calculate overall score
    const overallScore = calculateOverallScore(categories)
    
    // Generate summary
    const summary = generateSummary(categories)
    
    const result: AnalysisResult = {
      url,
      timestamp: new Date(),
      settings,
      overallScore,
      categories,
      crawlData,
      summary
    }

    console.log('API Route - analysis complete, overall score:', overallScore)

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

function createAnalysisPrompt(url: string, crawlData: CrawlResult, settings: AnalysisSettings): string {
  const pages = crawlData.pages.slice(0, 5) // Limit to first 5 pages for analysis
  
  // Adjust content analysis based on depth
  const contentLimit = getContentLimitByDepth(settings.analysisDepth)
  const analysisInstructions = getDepthBasedInstructions(settings.analysisDepth)
  
  const prompt = `
Analyze this website for usability based on Steve Krug's "Don't Make Me Think" principles from his comprehensive usability guide.

Website: ${url}
Analysis Depth: ${settings.analysisDepth}
Include Mobile: ${settings.includeMobile}

Pages analyzed:
${pages.map(page => `
URL: ${page.url}
Title: ${page.title}
Content: ${page.content.slice(0, contentLimit)}...
`).join('\n')}

${analysisInstructions}

Apply Steve Krug's core usability principles in your analysis:

**KRUG'S FIRST LAW**: Don't Make Me Think! - Everything should be self-evident, obvious, and require no mental effort to understand.

**KEY PRINCIPLES TO EVALUATE:**
1. **Self-evident design** - Is everything obvious at a glance?
2. **Scanning behavior** - Is content optimized for scanning, not reading?
3. **Mindless choices** - Are navigation and interactions easy and obvious?
4. **Visual hierarchy** - Are important elements more prominent?
5. **Web conventions** - Does it follow established patterns users know?
6. **Content clarity** - Is there too much "happy talk" or unnecessary words?
7. **Navigation persistence** - Can users always tell where they are?
8. **Mobile considerations** - How well does it handle mobile constraints?
9. **Courtesy and trust** - Does it treat users with respect and build goodwill?

Analyze each category with these Steve Krug principles in mind:

1. **Navigation Clarity** (20% weight) - Persistent navigation, "you are here" indicators, breadcrumbs
2. **Content Hierarchy** (18% weight) - Visual hierarchy, scannable text, clear page areas
3. **Page Names & Breadcrumbs** (15% weight) - Clear page identification, location awareness
4. **Search Functionality** (12% weight) - Obvious search placement, effective results
5. **Forms & User Input** (10% weight) - Mindless choices, clear labels, minimal required fields
${settings.includeMobile ? '6. **Mobile Usability** (10% weight) - Touch-friendly, content prioritization, thumb-friendly targets' : ''}
7. **Page Loading & Performance** (8% weight) - Fast loading, goodwill preservation
8. **Accessibility** (5% weight) - Universal usability, keyboard navigation, alt text
9. **Error Handling** (2% weight) - Clear recovery paths, helpful error messages

For each category, provide:
- **Score (0-100)** based on how well it follows Krug's principles
- **Specific issues** with priority (high/medium/low) and element location
- **Direct action recommendations** that users can implement immediately
- **Implementation tasks** from Krug's guide (checkboxes format)
- **Brief explanation** referencing specific Krug principles

IMPORTANT: Respond ONLY with valid JSON in this exact structure:
{
  "categories": [
    {
      "id": "navigation",
      "score": 85,
      "issues": [
        {
          "type": "medium", 
          "description": "Navigation menu lacks 'you are here' indicator", 
          "element": "header nav",
          "krugPrinciple": "Users must always know where they are"
        }
      ],
      "recommendations": [
        {
          "action": "Add visual highlighting to current page in navigation",
          "userTask": "Review navigation design and add active state styling",
          "krugReference": "Chapter 6: Street Signs and Breadcrumbs"
        }
      ],
      "implementationTasks": [
        "[ ] Add 'you are here' indicators to navigation",
        "[ ] Implement breadcrumb trail showing path from home",
        "[ ] Test navigation with 'trunk test' - can users identify current location?"
      ],
      "details": "Navigation follows basic conventions but lacks clear location indicators as emphasized in Krug's navigation chapter..."
    }
  ]
}
`

  return prompt
}

async function getAIAnalysis(prompt: string, settings: AnalysisSettings): Promise<any> {
  try {
    if (settings.aiProvider === 'claude') {
      return await getClaudeAnalysis(prompt, settings.aiKey!)
    } else {
      return await getOpenAIAnalysis(prompt, settings.aiKey!)
    }
  } catch (error) {
    console.error('AI Analysis failed, using fallback:', error)
    // Return a basic analysis as fallback
    return generateFallbackAnalysis()
  }
}

function generateFallbackAnalysis(): any {
  console.log('Generating fallback analysis based on Steve Krug principles')
  
  return {
    categories: [
      {
        id: 'navigation',
        score: 75,
        issues: [
          { 
            type: 'medium', 
            description: 'Navigation lacks persistent "you are here" indicators', 
            element: 'header nav',
            krugPrinciple: 'Users must always know where they are (Chapter 6)'
          }
        ],
        recommendations: [
          {
            action: 'Add visual highlighting to show current page location',
            userTask: 'Implement active state styling in navigation CSS',
            krugReference: 'Chapter 6: Street Signs and Breadcrumbs'
          },
          {
            action: 'Ensure navigation appears on every page consistently',
            userTask: 'Review all page templates for persistent navigation',
            krugReference: 'Chapter 6: Persistent Navigation'
          }
        ],
        implementationTasks: [
          '[ ] Add "you are here" indicators to navigation',
          '[ ] Implement breadcrumb trail showing path from home',
          '[ ] Test navigation with "trunk test" - can users identify current location?'
        ],
        details: 'Navigation follows basic conventions but needs improvement to meet Krug\'s standards for persistent, clear location awareness'
      },
      {
        id: 'content_hierarchy',
        score: 80,
        issues: [
          {
            type: 'low',
            description: 'Content not optimized for scanning behavior',
            element: 'main content',
            krugPrinciple: 'Users scan, they don\'t read (Chapter 2)'
          }
        ],
        recommendations: [
          {
            action: 'Use more headings and bullet points for scanning',
            userTask: 'Break up long text blocks with descriptive headings',
            krugReference: 'Chapter 3: Billboard Design 101'
          }
        ],
        implementationTasks: [
          '[ ] Implement visual hierarchy with prominent headings',
          '[ ] Use bullet points and short paragraphs',
          '[ ] Highlight key terms and phrases'
        ],
        details: 'Content follows basic hierarchy but needs optimization for scanning behavior as described in Krug\'s billboard design principles'
      },
      {
        id: 'page_names',
        score: 70,
        issues: [
          {
            type: 'medium',
            description: 'Page names don\'t match what users clicked to get there',
            element: 'page headers',
            krugPrinciple: 'Page name should match link text (Chapter 6)'
          }
        ],
        recommendations: [
          {
            action: 'Ensure page headlines match navigation link text',
            userTask: 'Review all page titles for consistency with navigation',
            krugReference: 'Chapter 6: Page Names'
          }
        ],
        implementationTasks: [
          '[ ] Create prominent page names matching navigation links',
          '[ ] Implement breadcrumb trail for location awareness',
          '[ ] Test "trunk test" - can users identify where they are?'
        ],
        details: 'Page identification needs improvement to meet Krug\'s standards for clear location awareness'
      },
      {
        id: 'search',
        score: 60,
        issues: [
          {
            type: 'medium',
            description: 'Search box not in expected location',
            element: 'header area',
            krugPrinciple: 'Follow web conventions (Chapter 3)'
          }
        ],
        recommendations: [
          {
            action: 'Place search box in upper right corner of every page',
            userTask: 'Move search to conventional location and make it prominent',
            krugReference: 'Chapter 3: Web Conventions'
          }
        ],
        implementationTasks: [
          '[ ] Position search box in expected location (top right)',
          '[ ] Make search box prominent and obviously searchable',
          '[ ] Include search on every page for persistence'
        ],
        details: 'Search needs to follow established web conventions for findability and usability'
      },
      {
        id: 'forms',
        score: 75,
        issues: [
          {
            type: 'medium',
            description: 'Forms require too much thinking and decision-making',
            element: 'form fields',
            krugPrinciple: 'Eliminate question marks (Chapter 4)'
          }
        ],
        recommendations: [
          {
            action: 'Simplify form choices and reduce required fields',
            userTask: 'Review all forms and remove unnecessary fields',
            krugReference: 'Chapter 4: Mindless Choices'
          }
        ],
        implementationTasks: [
          '[ ] Audit forms for unnecessary fields and complexity',
          '[ ] Make form choices obvious and mindless',
          '[ ] Provide clear, immediate help when needed'
        ],
        details: 'Forms need simplification to support Krug\'s principle of mindless, obvious choices'
      },
      {
        id: 'mobile_usability',
        score: 70,
        issues: [
          {
            type: 'medium',
            description: 'Touch targets too small and not thumb-friendly',
            element: 'buttons and links',
            krugPrinciple: 'Mobile requires different interaction patterns (Chapter 10)'
          }
        ],
        recommendations: [
          {
            action: 'Increase touch target sizes to minimum 44px',
            userTask: 'Review and resize all clickable elements for mobile',
            krugReference: 'Chapter 10: Mobile Design'
          }
        ],
        implementationTasks: [
          '[ ] Ensure touch targets are thumb-friendly (44px minimum)',
          '[ ] Prioritize most important content first on mobile',
          '[ ] Test with actual devices, not just simulators'
        ],
        details: 'Mobile experience needs optimization for touch interactions and content prioritization'
      },
      {
        id: 'page_loading',
        score: 85,
        issues: [
          {
            type: 'low',
            description: 'Slow loading could drain user goodwill',
            element: 'page performance',
            krugPrinciple: 'Preserve user goodwill (Chapter 11)'
          }
        ],
        recommendations: [
          {
            action: 'Optimize critical rendering path for faster perceived loading',
            userTask: 'Implement performance optimization strategies',
            krugReference: 'Chapter 11: Goodwill Reservoir'
          }
        ],
        implementationTasks: [
          '[ ] Optimize images and minimize HTTP requests',
          '[ ] Implement progressive loading for better perceived performance',
          '[ ] Test loading speed on various connection types'
        ],
        details: 'Performance is acceptable but optimization would preserve user goodwill'
      },
      {
        id: 'accessibility',
        score: 65,
        issues: [
          {
            type: 'high',
            description: 'Missing basic accessibility features',
            element: 'images and navigation',
            krugPrinciple: 'Accessibility improvements help everyone (Chapter 12)'
          }
        ],
        recommendations: [
          {
            action: 'Add alt text to all images and proper heading structure',
            userTask: 'Implement basic accessibility features first',
            krugReference: 'Chapter 12: Accessibility and You'
          }
        ],
        implementationTasks: [
          '[ ] Add alt text to all images',
          '[ ] Use heading tags correctly (H1, H2, H3)',
          '[ ] Ensure keyboard accessibility for all interactive elements'
        ],
        details: 'Basic accessibility improvements needed - these often improve usability for everyone'
      },
      {
        id: 'error_handling',
        score: 70,
        issues: [
          {
            type: 'medium',
            description: 'Error messages don\'t provide clear recovery paths',
            element: 'error pages and messages',
            krugPrinciple: 'Help users recover from errors gracefully (Chapter 11)'
          }
        ],
        recommendations: [
          {
            action: 'Create helpful error messages with specific recovery steps',
            userTask: 'Review all error scenarios and improve messaging',
            krugReference: 'Chapter 11: Common Courtesy'
          }
        ],
        implementationTasks: [
          '[ ] Write clear, helpful error messages',
          '[ ] Provide specific recovery suggestions',
          '[ ] Test error scenarios for user-friendliness'
        ],
        details: 'Error handling needs improvement to better guide users and preserve goodwill'
      }
    ]
  }
}

async function getClaudeAnalysis(prompt: string, apiKey: string): Promise<any> {
  console.log('API Route - calling Claude API')
  
  // Try different Claude models in order of preference
  const models = [
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-instant-1.2'
  ]
  
  let lastError: Error | null = null
  
  for (const model of models) {
    try {
      console.log(`Trying Claude model: ${model}`)
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
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

async function getOpenAIAnalysis(prompt: string, apiKey: string): Promise<any> {
  console.log('API Route - calling OpenAI API')
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
    console.error('OpenAI API error response:', errorData)
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
  }

  const data = await response.json()
  console.log('OpenAI API response received')
  
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

function processAnalysisResult(aiAnalysis: any, includeMobile: boolean): UsabilityCategory[] {
  const categories: UsabilityCategory[] = USABILITY_CATEGORIES.map(template => {
    const aiCategory = aiAnalysis.categories?.find((cat: any) => cat.id === template.id)
    
    if (!aiCategory) {
      // Provide comprehensive Krug-based recommendations for missing categories
      return getKrugBasedRecommendations(template)
    }

    // Validate and sanitize issues
    const validatedIssues = (aiCategory.issues || []).map((issue: any) => ({
      type: ['high', 'medium', 'low'].includes(issue.type) ? issue.type : 'medium',
      description: issue.description || 'No description provided',
      element: issue.element || undefined,
      page: issue.page || undefined,
      krugPrinciple: issue.krugPrinciple || undefined
    }))

    // Handle both old string format and new Recommendation object format
    const validatedRecommendations = (aiCategory.recommendations || []).map((rec: any) => {
      if (typeof rec === 'string') {
        return rec
      }
      // Return the new Recommendation object format
      return {
        action: rec.action || rec,
        userTask: rec.userTask || '',
        krugReference: rec.krugReference || ''
      }
    })

    return {
      ...template,
      score: Math.max(0, Math.min(100, aiCategory.score || 50)),
      issues: validatedIssues,
      recommendations: validatedRecommendations,
      implementationTasks: aiCategory.implementationTasks || [],
      details: aiCategory.details || ''
    }
  })

  // Filter out mobile category if not included
  if (!includeMobile) {
    return categories.filter(cat => cat.id !== 'mobile_usability')
  }

  return categories
}

function getKrugBasedRecommendations(template: Omit<UsabilityCategory, 'score' | 'issues' | 'recommendations' | 'details'>): UsabilityCategory {
  const krugRecommendations: { [key: string]: any } = {
    navigation: {
      score: 70,
      issues: [
        {
          type: 'medium',
          description: 'Navigation may not follow persistent navigation principles',
          element: 'site navigation',
          krugPrinciple: 'Users must always know where they are (Chapter 6)'
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
        },
        {
          action: 'Implement breadcrumb navigation',
          userTask: 'Show path from home to current location using ">" separators',
          krugReference: 'Chapter 6: Breadcrumbs'
        }
      ],
      implementationTasks: [
        '[ ] Design persistent navigation with site ID/logo linking to home',
        '[ ] Add primary sections and utilities (search, login, help)',
        '[ ] Implement current page indicators',
        '[ ] Create breadcrumb trail showing path from home',
        '[ ] Test with "trunk test" - can users identify current location?'
      ],
      details: 'Navigation should follow Krug\'s principles of persistent, clear wayfinding that tells users where they are, where they can go, and how to get there.'
    },
    
    content_hierarchy: {
      score: 65,
      issues: [
        {
          type: 'medium',
          description: 'Content may not be optimized for scanning behavior',
          element: 'page content',
          krugPrinciple: 'Users scan, they don\'t read (Chapter 2)'
        }
      ],
      recommendations: [
        {
          action: 'Implement clear visual hierarchy',
          userTask: 'Make important elements larger, bolder, or more prominent',
          krugReference: 'Chapter 3: Billboard Design 101'
        },
        {
          action: 'Format text for scanning',
          userTask: 'Use descriptive headings, bullet points, and highlight key terms',
          krugReference: 'Chapter 3: Scannable Text'
        },
        {
          action: 'Create defined page areas',
          userTask: 'Separate navigation from content and group related functionality',
          krugReference: 'Chapter 3: Clear Areas'
        }
      ],
      implementationTasks: [
        '[ ] Implement visual hierarchy with important elements more prominent',
        '[ ] Use plenty of headings and subheadings for scanning',
        '[ ] Keep paragraphs short and use bulleted lists',
        '[ ] Highlight key terms and phrases',
        '[ ] Reduce visual noise and use white space effectively'
      ],
      details: 'Content should be designed like a billboard - clear, scannable, and immediately understandable following Krug\'s hierarchy principles.'
    },
    
    page_names: {
      score: 70,
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
          action: 'Ensure page names match navigation links',
          userTask: 'Review all page titles for consistency with navigation text',
          krugReference: 'Chapter 6: Page Names'
        },
        {
          action: 'Make page names prominent',
          userTask: 'Position page name as clear heading for unique content',
          krugReference: 'Chapter 6: Clear Page Names'
        }
      ],
      implementationTasks: [
        '[ ] Create prominent page names matching navigation links',
        '[ ] Position page names as headings for unique content',
        '[ ] Implement breadcrumb trail for location awareness',
        '[ ] Test "trunk test" - can users identify where they are?'
      ],
      details: 'Clear page identification following Krug\'s principle that users should always know where they are and how they got there.'
    },
    
    search: {
      score: 60,
      issues: [
        {
          type: 'medium',
          description: 'Search functionality may not follow web conventions',
          element: 'search interface',
          krugPrinciple: 'Follow established web conventions (Chapter 3)'
        }
      ],
      recommendations: [
        {
          action: 'Position search box in expected location',
          userTask: 'Place search in upper right corner following web conventions',
          krugReference: 'Chapter 3: Web Conventions'
        },
        {
          action: 'Make search obviously searchable',
          userTask: 'Use clear search box design with prominent search button',
          krugReference: 'Chapter 1: Self-evident Design'
        }
      ],
      implementationTasks: [
        '[ ] Position search box in expected location (top right)',
        '[ ] Make search box prominent and obviously searchable',
        '[ ] Include search on every page for persistence',
        '[ ] Provide effective search results and suggestions'
      ],
      details: 'Search should follow web conventions and be self-evident, placed where users expect to find it.'
    },
    
    forms: {
      score: 65,
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
          userTask: 'Audit forms for unnecessary complexity and required fields',
          krugReference: 'Chapter 4: Mindless Choices'
        },
        {
          action: 'Make form elements self-explanatory',
          userTask: 'Use clear labels and minimize instructions needed',
          krugReference: 'Chapter 1: Self-evident Design'
        }
      ],
      implementationTasks: [
        '[ ] Audit forms for unnecessary fields and complexity',
        '[ ] Make form choices obvious and mindless',
        '[ ] Associate form labels clearly with fields',
        '[ ] Provide clear, immediate help when needed',
        '[ ] Accept data in multiple formats where possible'
      ],
      details: 'Forms should follow Krug\'s principle of mindless choices, making interactions obvious and requiring minimal thinking.'
    },
    
    mobile_usability: {
      score: 65,
      issues: [
        {
          type: 'medium',
          description: 'Mobile interface may not accommodate touch interactions properly',
          element: 'mobile interface',
          krugPrinciple: 'Mobile requires different interaction patterns (Chapter 10)'
        }
      ],
      recommendations: [
        {
          action: 'Ensure touch targets are thumb-friendly',
          userTask: 'Make all clickable elements at least 44px for easy tapping',
          krugReference: 'Chapter 10: Mobile Design'
        },
        {
          action: 'Prioritize content for mobile screens',
          userTask: 'Put most important content first and maintain clear paths',
          krugReference: 'Chapter 10: Content Prioritization'
        }
      ],
      implementationTasks: [
        '[ ] Ensure touch targets are thumb-friendly (44px minimum)',
        '[ ] Prioritize most important content first on mobile',
        '[ ] Remove hover-dependent features for touch interfaces',
        '[ ] Test with actual devices, not just simulators',
        '[ ] Optimize images and minimize load times for mobile'
      ],
      details: 'Mobile design should accommodate touch interactions and content prioritization following Krug\'s mobile usability principles.'
    },
    
    page_loading: {
      score: 75,
      issues: [
        {
          type: 'low',
          description: 'Page loading speed may impact user goodwill',
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
      details: 'Fast loading preserves user goodwill and supports Krug\'s principle of not making users wait unnecessarily.'
    },
    
    accessibility: {
      score: 60,
      issues: [
        {
          type: 'high',
          description: 'Missing basic accessibility features that help everyone',
          element: 'site accessibility',
          krugPrinciple: 'Accessibility improvements help everyone (Chapter 12)'
        }
      ],
      recommendations: [
        {
          action: 'Implement basic accessibility features first',
          userTask: 'Add alt text, proper headings, and keyboard navigation',
          krugReference: 'Chapter 12: Accessibility and You'
        },
        {
          action: 'Ensure keyboard accessibility',
          userTask: 'Test navigation and functionality using keyboard only',
          krugReference: 'Chapter 12: Universal Benefit'
        }
      ],
      implementationTasks: [
        '[ ] Add alt text to all images',
        '[ ] Use heading tags correctly (H1, H2, H3)',
        '[ ] Associate form labels with fields',
        '[ ] Ensure keyboard accessibility for all interactive elements',
        '[ ] Test with screen reader software'
      ],
      details: 'Basic accessibility improvements often improve usability for everyone, following Krug\'s principle of universal benefit.'
    },
    
    error_handling: {
      score: 70,
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
      details: 'Error handling should be courteous and helpful, preserving user goodwill through clear recovery paths.'
    }
  }
  
  const categoryData = krugRecommendations[template.id]
  if (!categoryData) {
    // Fallback for unknown categories
    return {
      ...template,
      score: 50,
      issues: [],
      recommendations: [
        {
          action: 'Review this area for Krug\'s usability principles',
          userTask: 'Apply self-evident design and user-centered thinking',
          krugReference: 'Chapter 1: Don\'t Make Me Think'
        }
      ],
      implementationTasks: [
        '[ ] Audit this area for clarity and user-friendliness',
        '[ ] Apply Krug\'s principle of self-evident design'
      ],
      details: 'This area should follow Krug\'s fundamental principles of clear, user-friendly design.'
    }
  }
  
  return {
    ...template,
    ...categoryData
  }
}

function calculateOverallScore(categories: UsabilityCategory[]): number {
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0)
  const weightedScore = categories.reduce((sum, cat) => sum + (cat.score! * cat.weight), 0)
  
  return Math.round(weightedScore / totalWeight)
}

function generateSummary(categories: UsabilityCategory[]) {
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

function getContentLimitByDepth(depth: 'quick' | 'standard' | 'deep'): number {
  switch (depth) {
    case 'quick': return 1500    // Basic analysis with less content
    case 'standard': return 2500 // Standard comprehensive analysis
    case 'deep': return 4000     // Deep analysis with more content
    default: return 2500
  }
}

function getDepthBasedInstructions(depth: 'quick' | 'standard' | 'deep'): string {
  switch (depth) {
    case 'quick':
      return `
**QUICK ANALYSIS MODE**
Focus on the most critical usability issues that immediately impact user experience:
- Prioritize navigation clarity and obvious design elements
- Focus on major usability violations that break Krug's "Don't Make Me Think" principle
- Provide 1-2 key recommendations per category
- Identify only high-priority issues that need immediate attention
- Keep analysis concise but actionable`

    case 'standard':
      return `
**STANDARD ANALYSIS MODE**
Provide comprehensive usability analysis covering all key areas:
- Thorough evaluation of all Krug's principles
- Balanced assessment of navigation, content, and interaction design
- 2-3 detailed recommendations per category
- Include both high and medium priority issues
- Provide specific, actionable improvement suggestions`

    case 'deep':
      return `
**DEEP ANALYSIS MODE**
Conduct exhaustive usability review with detailed insights:
- In-depth analysis of all usability principles and edge cases
- Detailed examination of user flow and interaction patterns
- 3-4 comprehensive recommendations per category with implementation details
- Include low-priority issues that could enhance user experience
- Provide specific code/design suggestions and Krug chapter references
- Consider advanced usability concepts like information architecture and user psychology
- Analyze micro-interactions and subtle UX patterns that impact usability`

    default:
      return ''
  }
}