import { Answer, TaskResponseData } from "../types"
import { operAI } from "../utils/utils"
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/chat/completions"

export interface BloggerResponseData extends TaskResponseData { blog: string[] }
export interface BloggerAnswer extends Answer { answer: BlogPost[] }
type BlogPost = string

export async function handler(data: BloggerResponseData): Promise<BloggerAnswer | void> {
    if (!data.blog) {
        console.log('no blog topics :(')
        return
    }
    const blogPosts: BlogPost[] = await Promise.all(data.blog.map(generateBlogPost))
    return { answer: blogPosts }
}

async function generateBlogPost(topic: string): Promise<BlogPost> {
    const systemMessage: ChatCompletionSystemMessageParam = { 
        role: 'system', 
        content: 'You are well spoken chef in an Italian restaurant. Write in Polish. Write a short blog post about:' 
    }
    const userMessage: ChatCompletionUserMessageParam = { 
        role: 'user', 
        content: topic 
    }
    const completion = await operAI.chat.completions.create({
        messages: [systemMessage, userMessage],
        model: 'gpt-3.5-turbo',
    })
    const chatAnswer = completion.choices[0].message.content
    return chatAnswer || ''
}