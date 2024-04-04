import { Answer, TaskResponseData } from "../types"
import { openAIUtils } from "../utils/utils"

export type BloggerResponseData = TaskResponseData & { blog: string[] }
export interface BloggerAnswer extends Answer { answer: BlogPost[] }
type BlogPost = string

const  { gpt35_completion } = openAIUtils()
export async function handler(data: BloggerResponseData): Promise<BloggerAnswer | void> {
    if (!data.blog) {
        console.log('no blog topics :(')
        return
    }
    const systemPromp = 'You are well spoken chef in an Italian restaurant. Write in Polish. Write a short blog post about:'
    const blogPosts: BlogPost[] = await Promise.all(data.blog.map(topic => gpt35_completion(systemPromp, topic)))
    return { answer: blogPosts }
}
