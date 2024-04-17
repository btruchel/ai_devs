import { config } from "../config"
import { Answer, TaskResponseData } from "../types"
import axios from 'axios'

export type MemeData = TaskResponseData & { image: string, text: string, service: string }
export interface MemeAnswer extends Answer { answer: string }

export async function handler(data: MemeData): Promise<MemeAnswer | void> {
  const response = await axios.post("https://get.renderform.io/api/v2/render", {
    template: 'awful-frogs-rumble-sharply-1813', data: {
      "meme_text.text": data.text,
      "meme_image.src": data.image
    }
  }, { headers: { 'X-API-KEY': config.renderIoApiKey, 'Content-Type': 'application/json' } })
  return { answer: response.data.href }
}
