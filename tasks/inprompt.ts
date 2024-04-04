import { Answer, TaskResponseData } from "../types"
import { openAIUtils } from "../utils/utils"

export type InpromptData = TaskResponseData & { input: string[], question: string }
export interface InpromptAnswer extends Answer { answer: string }

const { gpt35_completion } = openAIUtils()

export async function handler(data: InpromptData): Promise<InpromptAnswer | void> {
  const { input, question } = data
  const nameInQuestion = getName(question)
  if (!nameInQuestion) return
  const context = input.filter(line => line.includes(nameInQuestion))
  const systemPromp = `answer the question as truthly as you can. ### context: ${context.join("\n")}`

  const answer = await gpt35_completion(systemPromp, question)
  return { answer }
}

function getName(text: string): string | undefined {
  const { groups }= text.match(/(?<name>[A-Z]\w+\b)/) || {}
  return groups && groups.name
}
