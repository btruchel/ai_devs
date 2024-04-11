import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils, openAIUtils, parseJSONResponse, wait } from "../utils/utils"

export type WhoAmIData = TaskResponseData & { hint: string }
export interface WhoAmIAnswer extends Answer { answer: string }

const { gpt35_completion } = openAIUtils()
const { getTaskDescription } = aiDevApiUtils()
export async function handler(data: WhoAmIData): Promise<WhoAmIAnswer | void> {
  const systemPrompt = `
  Name one famous person fitting the provided description.
  If you are not sure (under 80% sure) ask for additional data
  respond in JSON format

  ### examples
  user:
  'played in the beatles'
  response:
  {  "hint": true }

  user:
  'played in the beatles'
  'he had long hair'
  response:
  {  "hint": true }

  user:
  'played in the beatles'
  'he had long hair'
  'was married to yoko ono'
  response:
  { "answer": "John Lennon"}
  `
  let triesLeft = 10
  let hints = [data.hint]
  while (triesLeft) {
    const response = await gpt35_completion(systemPrompt, hints.join("\n"))
    const parsed = parseJSONResponse<{ hint: string } & { answer: string }>(response)
    if (parsed) {
      if (parsed.hint) {
        hints = await getNewHints(hints)
        console.log(hints)
      }
      if (parsed.answer) {
        return { answer: parsed.answer }
      }
    }
    triesLeft--
  }
  console.log('to stupid')
  return
}

async function getNewHints(currentHints: string[]): Promise<string[]> {
  await wait(3000)
  const hints = new Set(currentHints)
  const { data: newData } = await getTaskDescription('whoami')
  if (hints.has(newData.hint)) return getNewHints(currentHints)
  return currentHints.concat(newData.hint)
}