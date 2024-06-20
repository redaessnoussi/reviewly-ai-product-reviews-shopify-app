import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

let app, storage;

export function setupFirebase(config) {
  if (!app) {
    app = initializeApp(config);
    storage = getStorage(app);
  }
  return { app, storage };
}
