import { Answer, TaskResponseData } from "../types"
import { openAIUtils } from "../utils/utils"

export type GnomeData = TaskResponseData & { url: string }
export interface GnomeAnswer extends Answer { answer: string }

const { vision } = openAIUtils()

export async function handler(data: GnomeData): Promise<GnomeAnswer | void> {
  const response = await vision('answer in polish. if there is no gnome, respond with the word: ERROR', `what's the color of the hat?`, data.url)
  return { answer: response }
}
