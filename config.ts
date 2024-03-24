import * as dotenv  from 'dotenv'
dotenv.config()

type Config = {
    baseUrl: string
    apiKey: string
    openAIapiKey: string
}

export const config: Config = {
    baseUrl: process.env.aiDevUrl || '',
    apiKey: process.env.apiKey || '',
    openAIapiKey: process.env.openaiApiKey || ''
}