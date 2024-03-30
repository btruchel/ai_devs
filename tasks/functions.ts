import { Answer } from "../types"

export interface FunctionsAnswer extends Answer { answer: FunctionSchema }
type FunctionSchema = {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: {
      name: { type: 'string' }
      surname: { type: 'string' }
      year: { type: 'integer', description: string }
    }
  }
}

export async function handler(): Promise<FunctionsAnswer> {
  const addUserSchema: FunctionSchema = {
    name: 'addUser',
    description: 'adds user to a collection',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        surname: { type: 'string' },
        year: { type: 'integer', description: 'year of born in field' },
      }
    }
  }
  return { answer: addUserSchema }
}

