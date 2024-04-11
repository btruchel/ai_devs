import { FunctionDefinition } from "openai/resources"
import { Answer, TaskResponseData } from "../types"
import { openAIUtils, parseJSONResponse } from "../utils/utils"

export type ToolsData = TaskResponseData & { question: string }
export interface ToolsAnswer extends Answer { answer: ToDoItem | CalendarEvent  }
type ToDoItem = { tool: 'ToDo', desc: string }
type CalendarEvent = { tool: 'Calendar', desc: string, date: string }

const { gpt35_with_tools } = openAIUtils()

export async function handler(data: ToolsData): Promise<ToolsAnswer | void> {
  const now = new Date()
  const systemPrompt = `Pick one of the functions. Today is ${now.toISOString()}`
  const response = await gpt35_with_tools(systemPrompt, data.question, [calendarSchema, todoListSchema])
  const answer = parseJSONResponse<ToDoItem | CalendarEvent>(response.arguments)
  if (answer) { return { answer } }
  return
}

const calendarSchema: FunctionDefinition = {
  name: 'addCalendarEvent',
  description: 'adds a callendar note',
  parameters: {
    type: 'object',
    properties: {
      tool: { type: 'string', description: 'either ToDo or Calendar' },
      desc: { type: 'string' },
      date: { type: 'string', description: 'date in YYYY-MM-DD' },
    }
  }
}

const todoListSchema: FunctionDefinition = {
  name: 'addToDoItem',
  description: 'adds a new ToDo item',
  parameters: {
    type: 'object',
    properties: {
      tool: { type: 'string', description: 'either ToDo or Calendar' },
      desc: { type: 'string' },
    }
  }
}