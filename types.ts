export type TaskImport = { handler: Handler, additionalStep?: AdditionalStep}
export type Handler = (data: TaskResponseData) => Promise<Answer>
export type AdditionalStep = (token: string) => Promise<TaskResponseData>

export type TaskResponse = { data: TaskResponseData }


export type TaskResponseData = { code: number, msg: string} & { [key: string]: string }
export interface Answer { answer: unknown }
