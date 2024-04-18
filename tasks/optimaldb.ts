import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils, openAIUtils } from "../utils/utils"

export type OptimalDbData = TaskResponseData & { database: string }
export interface OptimalDbAnswer extends Answer { answer: string }
const { getAdditionalFile } = aiDevApiUtils()
const { gpt35_completion } = openAIUtils()

type PeopleDb = { [key: string]: string[] }

export async function handler(data: OptimalDbData): Promise<OptimalDbAnswer | void> {
  const people: PeopleDb = (await getAdditionalFile(data.database, {}))
  const systemPrompt = `summarize every quote. keep as much information as possible.
    ### example:
    user: "Over the course of his violent career as a killer-for-hire, John Wick has earned a widespread reputation as one of the world's deadliest and most skilled professional assassins."
    "His extraordinary exploits, formidable skill set, lethal precision, and unwavering focus and determination to complete his tasks have solidified his status as both a legendary and infamous figure within the international criminal underworld"
    "known and feared by many as the Baba Yaga or The Boogeyman."
    AI:
    "killer-for-hire"
    "professional assasin"
    "legendary within the criminal underworld"
    "known as Baba Yaga"
    "known as Boogeyman"`
  const newContext: PeopleDb[] = []
    for (const person in people) {
      const response = await gpt35_completion(systemPrompt, people[person].join("\n"))
      newContext.push({[person]: response.split("\n")})
    }

  return { answer: JSON.stringify(newContext) }
}
