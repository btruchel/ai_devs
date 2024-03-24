import { Answer, TaskResponseData } from "../types"

export interface BloggerResponseData extends TaskResponseData { blog: string[] }
export interface BloggerAnswer extends Answer { answer: string[] }

export async function handler(data: BloggerResponseData ): Promise<BloggerAnswer | void> {
    if (!data.blog) { 
        console.log('no blog topics :(')
        return  
      }
    return  
}