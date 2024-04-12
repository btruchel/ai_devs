import { Answer, TaskResponseData } from "../types"
import { createServer, openAIUtils, startPublicServer, stopPublicServer } from "../utils/utils"
import { Express, Request, Response  } from "express"

export type OwnApiData = TaskResponseData
export interface OwnApiAnswer extends Answer { answer: string }
const { gpt35_completion } = openAIUtils()

export async function handler(_: OwnApiData): Promise<OwnApiAnswer | void> {
  const app = createServer()
  const appWithRoutes = addRoutes(app)
  const { server, url } = await startPublicServer(appWithRoutes)
  stopPublicServer(appWithRoutes, server)
  return { answer: url + '/ownApi'}
}

function addRoutes(app: Express) {
  app.post('/ownApi', async (req: Request, res: Response) => {
    const { question } = req.body
    const systemPrompt = `Answer in polish. Be. truthful. Be brief.`
    const response = await gpt35_completion(systemPrompt, question)
    console.log(req.body, response)
    res.status(200).send({ reply: response })
  })
  return app
}