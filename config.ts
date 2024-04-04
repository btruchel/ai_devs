import * as dotenv  from 'dotenv'
dotenv.config()

type Config = {
    baseUrl: string
    apiKey: string
    openAIapiKey: string
    qdrantUrl: string
}

export const config: Config = {
    baseUrl: process.env.aiDevUrl || '',
    apiKey: process.env.apiKey || '',
    openAIapiKey: process.env.openaiApiKey || '',
    qdrantUrl: process.env.qdrantUrl || 'http://localhost:6333'
}
