import { Answer, TaskResponseData } from "../types"
import { openAIUtils } from "../utils/utils"

export interface EmbeddingAnswer extends Answer { answer: number[] }

const { embedding } = openAIUtils()

export async function handler(_: TaskResponseData): Promise<EmbeddingAnswer | void> {
  const phraseToEmbedding = 'Hawaiian pizza'
  const answer = (await embedding(phraseToEmbedding))
  return { answer: answer[0].embedding }
}
