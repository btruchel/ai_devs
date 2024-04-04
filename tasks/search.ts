import { Answer, TaskResponseData } from "../types"
import { qdrantDb, QdrantPoint } from "../utils/qdrant"
import { aiDevApiUtils, openAIUtils } from "../utils/utils"

export type SearchData = TaskResponseData & { question: string }
export interface SearchAnswer extends Answer { answer: string }

type Article = { title: string, url: string, info: string, date: string }

const { getAdditionalFile } = aiDevApiUtils()
const { embedding } = openAIUtils()
const { setUpCollection, prepareUUID, insertMany, checkPointsExist, searchCollection } = qdrantDb()
export async function handler(data: SearchData): Promise<SearchAnswer | void> {
  await setUpCollection('archiwum_aidevs', 1536, [{ field_name: 'title', field_schema: 'text' }, { field_name: 'date', field_schema: 'text' }])

  const articles: Article[] = (await getAdditionalFile('https://unknow.news/archiwum_aidevs.json', {}))
  await insertArticles(articles)

  const questionVector = (await embedding(data.question))[0].embedding
  const context = (await searchCollection('archiwum_aidevs', questionVector)).map(match => match?.payload) as Article[]

  console.log(context)
  if(context.length > 0) {
    return { answer: context[0].url }
  }
  return
}

async function insertArticles(articles: Article[]): Promise<void> {
  const articlesWithIds = articles.map(article => ({ ...article, id: prepareUUID('archiwum_aidevs', 'title', article) }))
  const toInsert: QdrantPoint<Article>[] = []
  const { missing } = await checkPointsExist('archiwum_aidevs', articlesWithIds.map(a => a.id))
  if (missing.length > 0) {
    console.log(`missing ${missing.length} articles`)
    const idMap = new Set(missing)
    for (const article of articlesWithIds.filter(article => idMap.has(article.id))) {
      toInsert.push(await prepareInsert(article))
    }
  }
  if (toInsert.length > 0) {
    await insertMany<Article>('archiwum_aidevs', toInsert)
  }
}

async function prepareInsert(article: Article & { id?: string }): Promise<QdrantPoint<Article>> {
  console.log(`preparing ${article.title}`)
  const articleEmbedding = (await embedding(article.info))
  const { id, ...payload } = article
  return {
    id: id || prepareUUID('archiwum_aidevs', 'title', article),
    vector: articleEmbedding[0].embedding,
    payload
  }
}
