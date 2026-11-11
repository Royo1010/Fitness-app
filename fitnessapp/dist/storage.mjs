import { emptyState, validateState } from './core.mjs';

export class LocalStore {
  async open() {
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('ritme-fitness', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Sluit andere Ritme-tabbladen en open de app opnieuw.'));
    });
    this.db.onversionchange = () => this.db.close();
    return this;
  }
  async load() {
    const value = await new Promise((resolve, reject) => {
      const tx = this.db.transaction('data', 'readonly');
      const request = tx.objectStore('data').get('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return value ? validateState(value) : emptyState();
  }
  async save(state, expectedRevision) {
    const snapshot = structuredClone(state);
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('data', 'readwrite');
      const store = tx.objectStore('data');
      let conflict = false;
      const read = store.get('state');
      read.onsuccess = () => {
        if ((read.result?.revision ?? 0) !== expectedRevision) { conflict = true; tx.abort(); return; }
        snapshot.revision = expectedRevision + 1;
        store.put(snapshot, 'state');
      };
      tx.oncomplete = () => resolve(snapshot.revision);
      tx.onerror = () => reject(tx.error || new Error('Opslaan is mislukt.'));
      tx.onabort = () => reject(new Error(conflict ? 'Deze gegevens zijn in een ander tabblad gewijzigd. Exporteer eventuele eigen wijzigingen en herlaad de app.' : 'Opslaan is onderbroken.'));
    });
  }
}
