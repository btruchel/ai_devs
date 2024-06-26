import { Answer, TaskResponseData } from "../types"

export type HelloApiData = TaskResponseData & { cookie: string }
export interface HelloApiAnswer extends Answer { answer: string }

export async function handler(data: HelloApiData): Promise<HelloApiAnswer | void> {
  if (!data.cookie) { 
    console.log('no cookie :(') 
    return
  }
  return { answer: data.cookie }
}
