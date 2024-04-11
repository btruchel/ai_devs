import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils, openAIUtils, parseJSONResponse } from "../utils/utils"

export type KnowledgeData = TaskResponseData & { question: string }
export interface KnowledgeAnswer extends Answer { answer: string }
type Category = 'common' | 'rate' | 'population'
type CategorizedData = { category: Category, data: string }

const { getAdditionalFile } = aiDevApiUtils()
const { gpt35_completion } = openAIUtils()

export async function handler(data: KnowledgeData): Promise<KnowledgeAnswer | void> {
  const categorized = await categorize(data.question)
  if (categorized) {
    const answer = await getAnswer(categorized.category, categorized.data)
    return { answer }
  }
}

async function categorize(question: string): Promise<CategorizedData | null> {
  const systemPrompt = `
    categorize the user input tasks into one of 3 categories: [common, rate, population]
    rules: answer in json.
    examples:
    user: ile orientacyjnie ludzi mieszka w Polsce?
    AI:  { "category": "population", "data": "poland" }
    user: jaki jest kurs euro
    AI: { "category": "rate", "data": "EUR" }
    user: jaki jest kolor nieba?
    AI: { "category": "common", "data": "jaki jest kolor nieba?"  }
  `
  const response = await gpt35_completion(systemPrompt, question)
  return parseJSONResponse<CategorizedData>(response)
}

async function getAnswer(category: Category, data: string): Promise<string> {
  const fn: (data: string) => Promise<string> = {
    'rate': getRate,
    'population': getPopulation,
    'common': getCommonKnowledge,
    'default': async () => ''
  }[category]
  return fn(data)
}

async function getRate(rate) {
  const result = await getAdditionalFile(`http://api.nbp.pl/api/exchangerates/rates/A/${rate}/`, {})
  return result.rates[0].mid
}

async function getPopulation(country) {
  const result = await getAdditionalFile(`https://restcountries.com/v3.1/name/${country}?fields=population`, {})
  return result[0].population
}

async function getCommonKnowledge(topic) {
  return gpt35_completion('answer thruthfully', topic)
}