import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils, openAIUtils, wait } from "../utils/utils"

export type WhoAmIData = TaskResponseData & { hint: string }
export interface WhoAmIAnswer extends Answer { answer: string }

const { gpt4_completion } = openAIUtils()
const { getTaskDescription  } = aiDevApiUtils()
export async function handler(data: WhoAmIData): Promise<WhoAmIAnswer | void> {
  const systemPromptFn = (_hints) => `You are very good at Trivia games. 
  You are taking part in a trivia quiz.
  Based on the given hints, guess the name of the famous person. 
  If you are not certain about the person, ask for a hint.
  if you are sure just answer.
  Respond in json format
    ### examples
     { 
      "hint": true, 
    }
      or
    { "answer": "John Lennon"}

  ### hints
  ${_hints.join("\n")}
  `
  let triesLeft = 10
  let hints = [data.hint]
  while (triesLeft) {
    const response = await gpt4_completion(systemPromptFn(hints), 'Do you know the answer or do you need a hint?')
    let jsonResponse
    try {
      jsonResponse = JSON.parse(response)
      if (jsonResponse.hint) {
        hints = await getNewHints(hints)
        console.log(hints)
        triesLeft--
      }
      if (jsonResponse.answer) {
        return { answer: jsonResponse.answer }
      }
    } catch (error) {
      console.log(error)
      triesLeft--
    }
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