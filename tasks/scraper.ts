import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils, openAIUtils } from "../utils/utils"

export interface ScraperData extends TaskResponseData { input: string, question: string }
export interface ScraperAnswer extends Answer { answer: string }

const { getAdditionalFile } = aiDevApiUtils()
const { gpt35_completion } = openAIUtils()
export async function handler(data: ScraperData): Promise<ScraperAnswer | void> {
  const textFile = await getAdditionalFile(data.input, { headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.' }})
  const answer = await gpt35_completion(`Return answer for the question in POLISH language. Be brief. ###context: ${textFile}`, data.question)
  return {answer}
}
