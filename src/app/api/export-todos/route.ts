import { NextRequest, NextResponse } from 'next/server'
import { AnalysisResult, TodoTask, TodoExportOptions, Recommendation } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { analysisResult, exportOptions }: {
      analysisResult: AnalysisResult
      exportOptions: TodoExportOptions
    } = await request.json()

    if (!analysisResult) {
      return NextResponse.json({
        success: false,
        error: 'Analysis result is required'
      }, { status: 400 })
    }

    // Generate todo tasks from analysis result
    const todoTasks = generateTodoTasks(analysisResult)
    
    // Format based on export options
    const exportData = formatTodoExport(todoTasks, exportOptions)
    
    return NextResponse.json({
      success: true,
      data: exportData
    })

  } catch (error) {
    console.error('Todo export error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to export todos'
    }, { status: 500 })
  }
}

function generateTodoTasks(analysisResult: AnalysisResult): TodoTask[] {
  const tasks: TodoTask[] = []
  let taskId = 1

  analysisResult.categories.forEach(category => {
    // Add tasks from implementation tasks
    if (category.implementationTasks && category.implementationTasks.length > 0) {
      category.implementationTasks.forEach(task => {
        const cleanTask = task.replace(/^\[\s*\]\s*/, '') // Remove checkbox prefix
        tasks.push({
          id: `task-${taskId++}`,
          title: cleanTask,
          description: `Implementation task for ${category.name}`,
          category: category.name,
          priority: getTaskPriority(category, cleanTask),
          krugReference: category.description,
          userAction: cleanTask,
          estimatedTime: estimateTaskTime(cleanTask),
          completed: false
        })
      })
    }

    // Add tasks from recommendations
    if (category.recommendations && category.recommendations.length > 0) {
      category.recommendations.forEach(rec => {
        if (typeof rec === 'object' && 'userTask' in rec) {
          const recommendation = rec as Recommendation
          tasks.push({
            id: `task-${taskId++}`,
            title: recommendation.action,
            description: recommendation.userTask,
            category: category.name,
            priority: getRecommendationPriority(category, recommendation),
            krugReference: recommendation.krugReference,
            userAction: recommendation.userTask,
            estimatedTime: estimateTaskTime(recommendation.userTask),
            completed: false
          })
        } else if (typeof rec === 'string') {
          tasks.push({
            id: `task-${taskId++}`,
            title: rec,
            description: `Recommendation for ${category.name}`,
            category: category.name,
            priority: getTaskPriority(category, rec),
            userAction: rec,
            estimatedTime: estimateTaskTime(rec),
            completed: false
          })
        }
      })
    }

    // Add high-priority issues as tasks
    if (category.issues && category.issues.length > 0) {
      category.issues
        .filter(issue => issue.type === 'high')
        .forEach(issue => {
          tasks.push({
            id: `task-${taskId++}`,
            title: `Fix: ${issue.description}`,
            description: `High priority issue in ${category.name}: ${issue.description}`,
            category: category.name,
            priority: 'high',
            krugReference: issue.krugPrinciple || category.description,
            userAction: `Investigate and fix: ${issue.description}`,
            estimatedTime: '2-4 hours',
            completed: false
          })
        })
    }
  })

  return tasks
}

function getTaskPriority(category: any, task: string): 'high' | 'medium' | 'low' {
  // Higher weight categories get higher priority
  if (category.weight >= 15) return 'high'
  if (category.weight >= 8) return 'medium'
  return 'low'
}

function getRecommendationPriority(category: any, rec: Recommendation): 'high' | 'medium' | 'low' {
  // Check if it's related to core Krug principles
  const coreKeywords = ['navigation', 'hierarchy', 'obvious', 'self-evident', 'mindless']
  const isCore = coreKeywords.some(keyword => 
    rec.action.toLowerCase().includes(keyword) || 
    rec.userTask.toLowerCase().includes(keyword)
  )
  
  if (isCore) return 'high'
  if (category.weight >= 10) return 'medium'
  return 'low'
}

function estimateTaskTime(task: string): string {
  const taskLower = task.toLowerCase()
  
  if (taskLower.includes('test') || taskLower.includes('audit') || taskLower.includes('review')) {
    return '1-2 hours'
  }
  if (taskLower.includes('implement') || taskLower.includes('create') || taskLower.includes('design')) {
    return '4-8 hours'
  }
  if (taskLower.includes('optimize') || taskLower.includes('improve') || taskLower.includes('enhance')) {
    return '2-4 hours'
  }
  if (taskLower.includes('add') || taskLower.includes('fix') || taskLower.includes('update')) {
    return '1-3 hours'
  }
  
  return '2-4 hours' // Default estimate
}

function formatTodoExport(tasks: TodoTask[], options: TodoExportOptions): any {
  switch (options.format) {
    case 'markdown':
      return generateMarkdownTodos(tasks, options)
    case 'json':
      return generateJsonTodos(tasks, options)
    case 'csv':
      return generateCsvTodos(tasks, options)
    default:
      throw new Error('Unsupported export format')
  }
}

function generateMarkdownTodos(tasks: TodoTask[], options: TodoExportOptions): string {
  let markdown = '# Website Usability Todo Tasks\n\n'
  markdown += `*Generated from Steve Krug "Don't Make Me Think" analysis*\n\n`
  
  if (options.groupByCategory) {
    const categories = Array.from(new Set(tasks.map(t => t.category)))
    
    categories.forEach(category => {
      const categoryTasks = tasks.filter(t => t.category === category)
      markdown += `## ${category}\n\n`
      
      categoryTasks.forEach(task => {
        const priority = options.includePriority ? ` **[${task.priority.toUpperCase()}]**` : ''
        const reference = options.includeReferences && task.krugReference ? ` *(${task.krugReference})*` : ''
        
        markdown += `- [ ] ${task.title}${priority}\n`
        markdown += `  - ${task.description}\n`
        if (task.userAction) {
          markdown += `  - **Action:** ${task.userAction}\n`
        }
        if (task.estimatedTime) {
          markdown += `  - **Estimated Time:** ${task.estimatedTime}\n`
        }
        if (reference) {
          markdown += `  - **Reference:** ${reference}\n`
        }
        markdown += '\n'
      })
    })
  } else {
    // Group by priority
    const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low']
    
    priorities.forEach(priority => {
      const priorityTasks = tasks.filter(t => t.priority === priority)
      if (priorityTasks.length === 0) return
      
      markdown += `## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Tasks\n\n`
      
      priorityTasks.forEach(task => {
        const reference = options.includeReferences && task.krugReference ? ` *(${task.krugReference})*` : ''
        
        markdown += `- [ ] ${task.title} - ${task.category}\n`
        markdown += `  - ${task.description}\n`
        if (task.userAction) {
          markdown += `  - **Action:** ${task.userAction}\n`
        }
        if (task.estimatedTime) {
          markdown += `  - **Estimated Time:** ${task.estimatedTime}\n`
        }
        if (reference) {
          markdown += `  - **Reference:** ${reference}\n`
        }
        markdown += '\n'
      })
    })
  }
  
  return markdown
}

function generateJsonTodos(tasks: TodoTask[], options: TodoExportOptions): any {
  const filteredTasks = tasks.map(task => {
    const exportTask: any = {
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      userAction: task.userAction,
      estimatedTime: task.estimatedTime,
      completed: task.completed
    }
    
    if (options.includePriority) {
      exportTask.priority = task.priority
    }
    
    if (options.includeReferences && task.krugReference) {
      exportTask.krugReference = task.krugReference
    }
    
    return exportTask
  })
  
  if (options.groupByCategory) {
    const grouped: { [key: string]: TodoTask[] } = {}
    filteredTasks.forEach(task => {
      if (!grouped[task.category]) {
        grouped[task.category] = []
      }
      grouped[task.category].push(task)
    })
    return grouped
  }
  
  return filteredTasks
}

function generateCsvTodos(tasks: TodoTask[], options: TodoExportOptions): string {
  const headers = ['Title', 'Description', 'Category', 'User Action', 'Estimated Time']
  
  if (options.includePriority) {
    headers.push('Priority')
  }
  
  if (options.includeReferences) {
    headers.push('Krug Reference')
  }
  
  let csv = headers.join(',') + '\n'
  
  tasks.forEach(task => {
    const row = [
      `"${task.title}"`,
      `"${task.description}"`,
      `"${task.category}"`,
      `"${task.userAction || ''}"`,
      `"${task.estimatedTime || ''}"`
    ]
    
    if (options.includePriority) {
      row.push(`"${task.priority}"`)
    }
    
    if (options.includeReferences) {
      row.push(`"${task.krugReference || ''}"`)
    }
    
    csv += row.join(',') + '\n'
  })
  
  return csv
}