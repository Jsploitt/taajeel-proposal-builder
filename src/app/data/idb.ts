/**
 * Minimal IndexedDB wrapper for logo bytes. localStorage cannot hold them and
 * a dependency is not worth 40 lines.
 */
const DB_NAME = 'taajeel'
const DB_VERSION = 1
const STORE = 'assets'

let dbPromise: Promise<IDBDatabase | null> | null = null

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return open().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const req = run(db.transaction(STORE, mode).objectStore(STORE))
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => resolve(null)
        } catch {
          resolve(null)
        }
      })
  )
}

export interface StoredAsset {
  bytes: ArrayBuffer
  mime: string
  name: string
}

export const idbAssets = {
  get: (key: string) => tx<StoredAsset>('readonly', (s) => s.get(key) as IDBRequest<StoredAsset>),
  put: (key: string, value: StoredAsset) => tx('readwrite', (s) => s.put(value, key) as IDBRequest<IDBValidKey>),
  keys: () => tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys() as IDBRequest<IDBValidKey[]>),
  del: (key: string) => tx('readwrite', (s) => s.delete(key) as IDBRequest<undefined>),
}
