export type Handler = (data: TaskResponseData) => Promise<Answer>
export type TaskResponse = { data: TaskResponseData }

export interface TaskResponseData { code: number, message: string }
export interface Answer { answer: unknown }