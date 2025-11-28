import { Shape } from '@/draw/types';
import { IDBPDatabase, openDB } from 'idb';

const dbName = 'sync-sketch';
const dbVersion = 1;
const storeName = 'shapes'

export interface SketchDB {
    shapes:{
        id:string;
        shape: Shape;
        
    }
}

export async function initDB(): Promise<IDBPDatabase<SketchDB>> {

    const db = await openDB<SketchDB>(dbName, dbVersion, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                store.createIndex('type', 'type')
            }
        }
    }
    )
    return db;
}

export async function saveShape(db:IDBPDatabase<SketchDB>, shape: Shape) {
    await db.put(storeName, shape)
}

export async function getAllShapes(db: IDBPDatabase<SketchDB>) {

    const allShapes = await db.getAll(storeName)
    return allShapes

}

export async function deleteShape(db:IDBPDatabase<SketchDB>, shape: Shape) {
    await db.delete(storeName, shape.id)
}

export async function clearAllShapes(db:IDBPDatabase<SketchDB>){
    await db.clear(storeName);

}