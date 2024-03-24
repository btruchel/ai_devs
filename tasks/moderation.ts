import { Moderation } from "openai/resources/moderations"
import { openAIUtils } from "../utils/utils"
import { Answer, TaskResponseData } from "../types"

export interface ModerationData extends TaskResponseData { input: string[] }
export interface ModerationAnswer extends Answer { answer: number[] }

const { moderation } = openAIUtils()

export async function handler(data: ModerationData ): Promise<ModerationAnswer | void> {
  if (!data.input) { 
    console.log('no input :(')
    return  
  }

  const results = await moderation(data.input)
  return { answer: results.map(isFlagged) }
}

function isFlagged(item: Moderation): number {
  return item.flagged ? 1 : 0
}
