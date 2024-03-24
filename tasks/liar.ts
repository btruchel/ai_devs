import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils, openAIUtils } from "../utils/utils"

export interface LiarData extends TaskResponseData { question, answer }
export interface LiarAnswer extends Answer { answer: string }

const { postForAdditionalData } = aiDevApiUtils()
const { gpt35_completion } = openAIUtils()

export async function handler(data: LiarData): Promise<LiarAnswer | void> {
  if (!data.question || !data.answer) { 
    console.log('missing some data :(')
    return
  }
  const {question, answer: liarAnswer} = data
  const systemPrompt = `Answer only YES or NO; Having a question: ${question}, is this answer strictly related to the question?`
  const verificationResult = await gpt35_completion(systemPrompt, liarAnswer)
  return { answer: verificationResult }
}

export async function additionalStep(token: string): Promise<LiarData> {
  const question = 'Is a black cat black or white?'
  const data = await postForAdditionalData(token, { question })
  return { ...data, question }
}
