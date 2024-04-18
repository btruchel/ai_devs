import { Answer, TaskResponseData } from "../types"
import { createServer, openAIUtils, serpGetLink, startPublicServer, stopPublicServer } from "../utils/utils"
import { Express, Request, Response  } from "express"

export type GoogleData = TaskResponseData & { cookie: string }
export interface GoogleAnswer extends Answer { answer: string }
const { gpt35_completion } = openAIUtils()

export async function handler(_: GoogleData): Promise<GoogleAnswer | void> {
  const app = createServer()
  const appWithRoutes = addRoutes(app)
  const { server, url } = await startPublicServer(appWithRoutes)
  stopPublicServer(appWithRoutes, server)
  return { answer: url + '/googleTask'}
}

function addRoutes(app: Express) {
  app.post('/googleTask', async (req: Request, res: Response) => {
    const { question } = req.body
    const systemPrompt = `Transform the user input into a search engine question`
    const response = await gpt35_completion(systemPrompt, question)
    const answer = await serpGetLink(response)
    res.status(200).send({ reply: answer || 'no answer' })
  })
  return app
}
