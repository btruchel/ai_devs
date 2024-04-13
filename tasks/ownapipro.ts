import { Answer, TaskResponseData } from "../types"
import { createServer, openAIUtils, parseJSONResponse, startPublicServer, stopPublicServer } from "../utils/utils"
import { Express, Request, Response } from "express"

export type OwnApiProData = TaskResponseData
export interface OwnApiProAnswer extends Answer { answer: string }
type Category = 'memory' | 'question'
type CategorizedData = { category: Category, data: string }
const { gpt35_completion } = openAIUtils()
const memories: string[] = []
export async function handler(_: OwnApiProData): Promise<OwnApiProAnswer | void> {
  const app = createServer()
  const appWithRoutes = addRoutes(app)
  const { server, url } = await startPublicServer(appWithRoutes)
  stopPublicServer(appWithRoutes, server)
  return { answer: url + '/ownApi' }
}

function addRoutes(app: Express) {
  app.post('/ownApi', async (req: Request, res: Response) => {
    const { question } = req.body
    const categorized = await categorize(question)
    if (categorized) {
      const response = categorized.category === 'memory'
        ? memories.push(categorized.data) && `Ok, stored memories: [${memories.join(";")}]`
        : await gpt35_completion(`answer thruthfully. be brief ###context: ${memories.join("\n")}`, categorized.data)
      console.log(question, response)
      res.status(200).send({ reply: response })
    }
  })
  return app
}

async function categorize(question: string): Promise<CategorizedData | null> {
  const systemPrompt = `
    categorize the user input tasks into one of 2 categories: [memory, question]
    rules: answer in json.
    examples:
    user: ile orientacyjnie ludzi mieszka w Polsce?
    AI:  { "category": "question", "data": "ile orientacyjnie ludzi mieszka w Polsce?" }
    user: lubie placki
    AI: { "category": "memory", "data": "lubie placki" }
  `
  const response = await gpt35_completion(systemPrompt, question)
  return parseJSONResponse<CategorizedData>(response)
}