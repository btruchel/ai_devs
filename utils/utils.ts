import * as fs from 'fs/promises'
import { config } from "../config"
import OpenAI from 'openai'
import { Answer, Handler, TaskResponse, TaskResponseData } from "../types"

export function aiDevApiUtils(axios) {
  async function getToken(taskName: string): Promise<string> {
    const { data } = await axios.post(`${config.baseUrl}/token/${taskName}`, { apikey: config.apiKey })
    return data.token
  }

  async function getTaskDescription(token: string): Promise<TaskResponseData> {
    const { data }: TaskResponse = await axios.get(`${config.baseUrl}/task/${token}`)
    console.log(data)
    return data
  }

  async function submitAnswer(token: string, answer: Answer): Promise<void> {
    const { data } = await axios.post(`${config.baseUrl}/answer/${token}`, answer)
    console.log(data)
  }
  return { getToken, getTaskDescription, submitAnswer }
}

export async function getTaskImplementation(taskName: string): Promise<Handler | void> {
  const tasks = await fs.readdir("./tasks")
  if (!tasks.includes(`${taskName}.ts`)) return

  const { handler }: { handler: Handler } = require(`../tasks/${taskName}`)
  return handler
}

export const operAI = new OpenAI({ apiKey: config.openAIapiKey })
