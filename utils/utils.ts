import * as fs from 'fs/promises'
import { config } from "../config"
import OpenAI from 'openai'
import { Answer, TaskImport, TaskResponse, TaskResponseData } from "../types"
import axios from 'axios'
import { ModerationCreateResponse } from 'openai/resources/moderations'
import { ChatCompletionContentPart, ChatCompletionCreateParamsBase, ChatCompletionSystemMessageParam, ChatCompletionTool, ChatCompletionUserMessageParam } from 'openai/resources/chat/completions'
import { Uploadable } from 'openai/uploads'
import { FunctionDefinition } from 'openai/resources'
import express, { Express } from "express"
import { Server } from 'http'
import { getJson } from "serpapi"
const ngrok = require('ngrok')

export function aiDevApiUtils() {
  async function getToken(taskName: string): Promise<string> {
    const { data } = await axios.post(`${config.baseUrl}/token/${taskName}`, { apikey: config.apiKey })
    return data.token
  }

  async function getTaskDescription(taskName: string): Promise<{ data: TaskResponseData, token: string }> {
    const token = await getToken(taskName)
    const { data }: TaskResponse = await axios.get(`${config.baseUrl}/task/${token}`)
    return { data, token }
  }

  async function submitAnswer(token: string, answer: Answer): Promise<void> {
    try {
      const { data }: TaskResponse = await axios.post(`${config.baseUrl}/answer/${token}`, answer)
      showMessage(data)
    } catch (error) {
      console.log(error.response.code, error.response.data,)
    }


  }

  async function postForAdditionalData(token: string, additionalData: { [key: string]: string }): Promise<any> {
    const { data }: TaskResponse = await axios.post(`${config.baseUrl}/task/${token}`, additionalData, { headers: { 'Content-Type': 'multipart/form-data' } })
    console.log(data)
    return data
  }

  function showMessage(data: TaskResponseData): void {
    const { code, msg, ...rest } = data
    console.log(`
      Code: ${code}
      Message: ${msg}
      Other Data: ${JSON.stringify(rest)}
    `)
  }

  async function getAdditionalFile(url, config, retryCount = 0) {
    if (retryCount > 10) {
      console.log('unable to get file')
      return
    }
    let result
    try {
      result = await axios.get(url, config)
    } catch ({ response }) {
      console.log({ status: response.status, data: response.data })
      result = { status: response.status, data: response.data }
    }

    if (result.status === 200) {
      return result.data
    }
    await wait(500 * retryCount)
    return getAdditionalFile(url, config, retryCount + 1)
  }

  async function downloadFile(filename: string, destination: string): Promise<void> {
    const response = await axios.get(`${config.baseUrl}/data/${filename}`, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data, 'binary')
    await fs.writeFile(destination, buffer)
    console.log('file downloaded successfully!')
  }
  return { getTaskDescription, submitAnswer, postForAdditionalData, downloadFile, getAdditionalFile, showMessage }
}

export async function getTaskImplementation(taskName: string): Promise<TaskImport | void> {
  const tasks = await fs.readdir("./tasks")
  if (!tasks.includes(`${taskName}.ts`)) return

  const { handler, additionalStep }: TaskImport = require(`../tasks/${taskName}`)
  return { handler, additionalStep }
}

export function openAIUtils() {
  const openAI = new OpenAI({ apiKey: config.openAIapiKey })
  async function moderation(input: string[]) {
    const { results }: ModerationCreateResponse = await openAI.moderations.create({ input })
    return results
  }
  async function chatCompletion(systemPrompt: string, userPrompts: ChatCompletionUserMessageParam["content"], model: ChatCompletionCreateParamsBase["model"]) {
    const systemMessage: ChatCompletionSystemMessageParam = {
      role: 'system',
      content: systemPrompt
    }
    const userMessage: ChatCompletionUserMessageParam = {
      role: 'user',
      content: userPrompts
    }
    return openAI.chat.completions.create({ messages: [systemMessage, userMessage], model })
  }

  async function gpt35_completion(systemPrompt: string, userPrompts: string): Promise<string> {
    const completion = await chatCompletion(systemPrompt, userPrompts, 'gpt-3.5-turbo',)
    return completion.choices[0].message.content || ''
  }

  async function gpt4_completion(systemPrompt: string, userPrompts: string): Promise<string> {
    const completion = await chatCompletion(systemPrompt, userPrompts, 'gpt-4',)
    return completion.choices[0].message.content || ''
  }

  async function gpt35_with_tools(systemPrompt: string, userPrompt: string, functions: FunctionDefinition[]) {
    const systemMessage: ChatCompletionSystemMessageParam = {
      role: 'system',
      content: systemPrompt
    }
    const userMessage: ChatCompletionUserMessageParam = {
      role: 'user',
      content: userPrompt
    }
    const tools: ChatCompletionTool[] = functions.map((definition) => ({ type: 'function', function: definition }))

    const completion = await openAI.chat.completions.create({ messages: [systemMessage, userMessage], model: 'gpt-3.5-turbo-0125', tools })
    const calledTool = (completion.choices[0].message.tool_calls || [])[0]
    return calledTool.function
  }

  async function vision(systemPrompt: string, userPrompt: string, imageUrl: string) {
    const userPrompts: ChatCompletionContentPart[] = [
      { type: 'text', text: userPrompt },
      { type: 'image_url', image_url: { url: imageUrl } }
    ]
    const completion = await chatCompletion(systemPrompt, userPrompts, 'gpt-4-turbo')
    return completion.choices[0].message.content || ''
  }

  async function embedding(input: string): Promise<OpenAI.Embeddings.Embedding[]> {
    const body: OpenAI.Embeddings.EmbeddingCreateParams = {
      model: 'text-embedding-ada-002',
      input
    }
    const result: OpenAI.Embeddings.CreateEmbeddingResponse = await openAI.embeddings.create(body)
    return result.data
  }

  async function transcribe(file: Uploadable): Promise<string> {
    const transcription: OpenAI.Audio.Transcriptions.Transcription = await openAI.audio.transcriptions.create({ model: 'whisper-1', file })
    return transcription.text
  }

  return { moderation, gpt35_completion, gpt4_completion, embedding, transcribe, gpt35_with_tools, vision }
}

export function wait(delay: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay))
}

export function splitEvery<T>(n: number, items: T[]): Array<T[]> {
  const result: Array<T[]> = []
  let idx = 0;

  while (idx < items.length) {
    result.push(items.slice(idx, idx += n));
  }
  return result
}

export function createServer() {
  const app = express()
  app.use(express.json())
  app.all('*', (_, __, next) => {
    app.disable('shoutdown')
    next()
  })
  return app
}

export async function startPublicServer(app: Express): Promise<{ server: Server, url: string }> {
  const server = app.listen(config.port)
  const url = await ngrok.connect(config.port)
  return { server, url }
}

export async function stopPublicServer(app: Express, server: Server): Promise<void> {
  if (app.enabled('shoutdown')) {
    ngrok.disconnect()
    server.close()
    console.log('server closed')
    process.exit(0)
  }
  app.enable('shoutdown')
  setTimeout(stopPublicServer, 3000, app, server)
}


export function parseJSONResponse<T>(response: string): T | null {
  try {
    return JSON.parse(response) as T
  } catch (error) {
    console.log(error)
    return null
  }
}

export async function serpGetLink(query: string): Promise<string | null> {
  const response = await getJson({
    engine: "google",
    api_key: config.serpapiKey,
    q: query,
    location: "Poland",
  })
  const links = response.organic_results
  return links ? links[0].link : null
}
