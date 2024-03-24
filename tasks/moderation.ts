import { Moderation, ModerationCreateResponse } from "openai/resources/moderations"
import { operAI } from "../utils/utils"
import { Answer, TaskResponseData } from "../types"

export interface ModerationData extends TaskResponseData { input: string[] }
export interface ModerationAnswer extends Answer { answer: number[] }

export async function handler(data: ModerationData ): Promise<ModerationAnswer | void> {
  if (!data.input) { 
    console.log('no input :(')
    return  
  }
  const { results }: ModerationCreateResponse = await operAI.moderations.create({ input: data.input })
  return { answer: results.map(isFlagged) }
}

function isFlagged(item: Moderation): number {
  return item.flagged ? 1 : 0
}
