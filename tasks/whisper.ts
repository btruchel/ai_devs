import { Answer, TaskResponseData } from "../types"
import { aiDevApiUtils } from "../utils/utils"
import * as path from "path"
import * as fs from "fs"
import { openAIUtils } from "../utils/utils"

export interface WhisperAnswer extends Answer { answer: string }

const { transcribe } = openAIUtils()
const { downloadFile } = aiDevApiUtils()

export async function handler(_: TaskResponseData): Promise<WhisperAnswer> {
  const localFilePath = path.join(__dirname, '..', 'tmp', 'my_audio.mp3')
  await downloadFile('mateusz.mp3', localFilePath)
  const audio_file = fs.createReadStream(localFilePath)
  const answer = await transcribe(audio_file)
  return { answer }
}
