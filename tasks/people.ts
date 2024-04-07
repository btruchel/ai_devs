import { Answer, TaskResponseData } from "../types"
import { qdrantDb, QdrantPoint } from "../utils/qdrant"
import { aiDevApiUtils, openAIUtils, splitEvery } from "../utils/utils"

export type PeopleData = TaskResponseData & { data: string, question: string }
export interface PeopleAnswer extends Answer { answer: string }

type Person = {
  imie: string,
  nazwisko: string,
  wiek: number,
  o_mnie: string,
  ulubiona_postac_z_kapitana_bomby: string,
  ulubiony_serial: string,
  ulubiony_film: string,
  ulubiony_kolor: string
}

const { getAdditionalFile } = aiDevApiUtils()
const { embedding, gpt35_completion } = openAIUtils()
const { setUpCollection, prepareUUID, insertMany, checkPointsExist, searchCollection } = qdrantDb()
console.log(gpt35_completion, searchCollection)
export async function handler(data: PeopleData): Promise<PeopleAnswer | void> {
  await setUpCollection('people', 1536, [{ field_name: 'data', field_schema: 'text' }])

  const people: Person[] = (await getAdditionalFile(data.data, {}))

  for (const batch of splitEvery(100, people)) {
    await insertPeople(batch)
  }

  const questionVector = (await embedding(data.question))[0].embedding
  const context = (await searchCollection('people', questionVector)).map(match => match?.payload) as Person[]
  if (context.length > 0) {
    const systemPrompt = `
      ### rules: be brief
      ###context:
        ${context.map(person => transformPerson(person, true)).join("\n")}`
    const answer = await gpt35_completion(systemPrompt, data.question)
    console.log(systemPrompt, answer)
    return { answer }
  }
  return
}


async function insertPeople(people: Person[]): Promise<void> {
  const peopleWithIds = people.map(person => ({ ...person, id: prepareUUID('people', 'name', { name: `${person.imie}_${person.nazwisko}` }) }))
  const toInsert: QdrantPoint<Person>[] = []
  const { missing } = await checkPointsExist('people', peopleWithIds.map(a => a.id))
  if (missing.length > 0) {
    console.log(`missing ${missing.length} people`)
    const idMap = new Set(missing)
    for (const person of peopleWithIds.filter(_person => idMap.has(_person.id))) {
      toInsert.push(await prepareInsert(person))
    }
  }
  if (toInsert.length > 0) {
    await insertMany<Person>('people', toInsert)
  }
}

async function prepareInsert(person: Person & { id?: string }): Promise<QdrantPoint<Person>> {
  console.log(`preparing ${person.imie} ${person.nazwisko}`)
  const personEmbedding = (await embedding(transformPerson(person)))
  const { id, ...payload } = person
  return {
    id: id || prepareUUID('people', 'name', { name: `${person.imie}_${person.nazwisko}` }),
    vector: personEmbedding[0].embedding,
    payload
  }
}

function transformPerson(person: Person, forContext = false): string {
  const { imie, nazwisko, wiek, o_mnie, ulubiona_postac_z_kapitana_bomby, ulubiony_serial, ulubiony_film, ulubiony_kolor } = person
  const transformation = `${imie} ${nazwisko} lat ${wiek}:
    ${o_mnie}. Lubi oglądać ${ulubiony_serial} i ${ulubiony_film}.
    Ulubiona postac z kapitana bomby to ${ulubiona_postac_z_kapitana_bomby} a ulubiony kolor to ${ulubiony_kolor}.
    `
  return forContext ? `(${transformation})` : transformation
}
