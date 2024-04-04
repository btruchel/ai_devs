import * as fs from 'fs/promises'
import { config } from "../config"
import OpenAI from 'openai'
import { Answer, TaskImport, TaskResponse, TaskResponseData } from "../types"
import axios from 'axios'
import { ModerationCreateResponse } from 'openai/resources/moderations'
import { ChatCompletionCreateParamsBase, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/chat/completions'
import { Uploadable } from 'openai/uploads'

export function aiDevApiUtils() {
  async function getToken(taskName: string): Promise<string> {
    const { data } = await axios.post(`${config.baseUrl}/token/${taskName}`, { apikey: config.apiKey })
    return data.token
  }

  async function getTaskDescription(taskName: string): Promise<{ data: TaskResponseData, token: string }> {
    const token = await getToken(taskName)
    const { data }: TaskResponse = await axios.get(`${config.baseUrl}/task/${token}`)
    console.log(data)
    return { data, token }
  }

  async function submitAnswer(token: string, answer: Answer): Promise<void> {
    try {
      const { data } = await axios.post(`${config.baseUrl}/answer/${token}`, answer)
      console.log(data)
    } catch (error) {
      console.log(error.response.code, error.response.data, )
    }
    
    
  }

  async function postForAdditionalData(token: string, additionalData: { [key: string]: string }): Promise<any> {
    const { data }: TaskResponse = await axios.post(`${config.baseUrl}/task/${token}`, additionalData, { headers: { 'Content-Type': 'multipart/form-data' } })
    console.log(data)
    return data
  }

  async function getAdditionalFile(url, config, retryCount = 0) {
    console.log('retryCount', retryCount)
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
  return { getTaskDescription, submitAnswer, postForAdditionalData, downloadFile, getAdditionalFile }
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

  async function chatCompletion(systemPrompt: string, userPrompts: string, model: ChatCompletionCreateParamsBase["model"]) {
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
  return { moderation, gpt35_completion, gpt4_completion, embedding, transcribe }
}

export function wait(delay: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay))
}
