import type { HistoryRecord } from "./types";

const databaseName = "guardrail";
const storeName = "reviews";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function saveReview(record: HistoryRecord) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function listReviews() {
  const database = await openDatabase();
  const records = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as HistoryRecord[]);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return records.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}
