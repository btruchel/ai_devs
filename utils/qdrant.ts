import { QdrantClient } from '@qdrant/qdrant-js'
import { config } from "../config"
import { v5 as uuidv5 } from 'uuid'

export type IndexSchema = {
    field_name: string,
    field_schema: 'keyword' | 'integer' | 'float' | 'geo' | 'text' | 'bool' | 'datetime'
}

export type QdrantPoint<T extends { [key: string]: unknown }> = {
    id: string,
    vector: number[],
    payload: T
}
const uuidSeed = '1b671a64-40d5-491e-99b0-da01ff1f3341'
export function qdrantDb() {
    const client = new QdrantClient({ url: config.qdrantUrl })
    async function searchCollection(collectionName: string, vector: number[]) {
        return client.search(collectionName, { vector, limit: 3 })
    }
    async function setUpCollection(collectionName: string, vectorSize: number, indexes: IndexSchema[]): Promise<void> {
        const response = await client.getCollections();
        const collection = response.collections.find((collection) => collection.name === collectionName)
        if (!collection) {
            await client.createCollection(collectionName, {
                vectors: { size: vectorSize, distance: 'Cosine', on_disk: true },
                optimizers_config: { default_segment_number: 2 },
                replication_factor: 2,
            })
            await Promise.all(indexes.map(params => client.createPayloadIndex(collectionName, { ...params, wait: true })))
        }
        console.log('all set up')
    }

    async function isCollectionEmpty(collectionName: string): Promise<boolean> {
        const collection = await client.getCollection(collectionName);
        return !!collection && collection.points_count === 0 
    }

    async function insertMany<T extends { [key: string]: unknown }>(collectionName, points: QdrantPoint<T>[]) {
        return client.upsert(collectionName, {
            wait: true,
            points,
        })
    }

    async function checkPointsExist(collectionName: string, ids: string[]): Promise<{ found: string[], missing: string[] }> {
        const points = await client.retrieve(collectionName, { ids })
        const pointMap = new Set(points.map(point => point.id))
        return {
            found: ids.filter(id => pointMap.has(id)),
            missing: ids.filter(id => !pointMap.has(id)),
        }
    }

    function prepareUUID<T>(collectionName: string, field: keyof T, payload: T): string {
        const collectionSeed = uuidv5(collectionName, uuidSeed)
        return uuidv5(payload[field], collectionSeed)
    }

    return { setUpCollection, insertMany, prepareUUID, checkPointsExist, searchCollection, isCollectionEmpty }
}