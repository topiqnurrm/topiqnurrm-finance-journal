import { Budget } from "@/lib/types/finance";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  Query,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (items: (T & { id: string })[]) => void,
  constraints: { orderByField?: string; whereField?: string; whereValue?: any } = {}
) {
  let q: Query<DocumentData> = collection(db, collectionName);
 
  if (constraints.whereField && constraints.whereValue !== undefined) {
    q = query(q, where(constraints.whereField, "==", constraints.whereValue));
  }
  if (constraints.orderByField) {
    q = query(q, orderBy(constraints.orderByField, "desc"));
  }
 
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as (T & {
      id: string;
    })[];
    callback(items);
  });
}
 
export async function addItem<T extends object>(collectionName: string, data: T) {
  return addDoc(collection(db, collectionName), data);
}
 
export async function updateItem<T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>
) {
  return updateDoc(doc(db, collectionName, id), data as DocumentData);
}
 
export async function deleteItem(collectionName: string, id: string) {
  return deleteDoc(doc(db, collectionName, id));
}
 
export async function getBudget(monthId: string): Promise<Budget | null> {
  const snap = await getDoc(doc(db, "budgets", monthId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Budget;
}
 
export async function setBudget(monthId: string, data: Omit<Budget, "id">) {
  await setDoc(doc(db, "budgets", monthId), data, { merge: true });
}
