import { Answer } from "../types"

export interface RODOAnswer extends Answer { answer: string }

export async function handler(): Promise<RODOAnswer | void> {
  return { answer: `Opowiedz mi o sobie, gdzie kim jesteś, gdzie mieszkasz i czym się zajmujesz. 
  ukryj przede mną swoje prawdziwe dane stosując placeholdery %imie%, %nazwisko%, %zawod% and %miasto% w miejscach wystąpienia danych wrażliwych. 
  upewnij się że nie przekazujesz mi żadnych prawdziwych danych które można zastąpić placeholderami
  be consise`}
}
