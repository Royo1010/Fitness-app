// Update coordination only; training storage is owned by the existing app.
export function releaseInfo(value) {
  if (!value || typeof value.version !== 'string' || !/^[a-f0-9]{64}$/.test(value.contentHash)) {
    throw new Error('De gepubliceerde versie kon niet worden gelezen. Probeer het later opnieuw.');
  }
  return { version: value.version, contentHash: value.contentHash, commit: typeof value.commit === 'string' ? value.commit : null };
}

export function workerBuild(worker, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = (error, data) => {
      clearTimeout(timer); channel.port1.close(); channel.port2.close();
      if (error) reject(error); else resolve(data);
    };
    const timer = setTimeout(() => finish(new Error('De app-update reageert niet. Probeer het opnieuw.')), timeout);
    channel.port1.onmessage = event => {
      try { finish(null, releaseInfo(event.data)); } catch (e) { finish(e); }
    };
    try { worker.postMessage({ type: 'RITME_BUILD' }, [channel.port2]); } catch (e) { finish(e); }
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function bounded(promise, timeout) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('De updatecontrole duurt te lang. Probeer het opnieuw met een werkende internetverbinding.')), timeout); })]); }
  finally { clearTimeout(timer); }
}
export class AppUpdates {
  constructor({ current, registration, container, fetcher = globalThis.fetch.bind(globalThis), online = () => navigator.onLine, onChange = () => {}, save = async () => {}, reload = () => location.reload(), timeout = 15000 }) {
    Object.assign(this, { current, registration, container, fetcher, online, onChange, save, reload, timeout });
    this.state = { phase: 'idle', message: '', target: null };
  }
  set(phase, message, target = null) { this.state = { phase, message, target }; this.onChange(this.state); }
  async published() {
    if (!this.online()) throw new Error('Geen internetverbinding. Maak verbinding en controleer opnieuw. Je trainingen blijven bewaard.');
    const abort = new AbortController(), timer = setTimeout(() => abort.abort(), this.timeout);
    try {
      const url = new URL('./release.json', import.meta.url); url.searchParams.set('check', Date.now());
      const response = await this.fetcher(url.href, { cache: 'no-store', signal: abort.signal });
      if (!response.ok) throw new Error('De gepubliceerde versie is nu niet bereikbaar. Probeer het later opnieuw.');
      return releaseInfo(await response.json());
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('De gepubliceerde versie kon niet worden gelezen. Probeer het later opnieuw.');
      if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Controleren is mislukt. Controleer je internetverbinding en probeer opnieuw.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async readyRegistration() {
    if (!this.container || !this.registration) throw new Error('App-updates zijn hier niet beschikbaar. Open Ritme via het bestaande HTTPS-websiteadres.');
    const registration = await bounded(this.registration, this.timeout);
    await bounded(registration.update(), this.timeout);
    return registration;
  }
  async targetWorker(registration, hash, controllerOnly = false) {
    const deadline = Date.now() + this.timeout;
    do {
      const workers = controllerOnly ? [this.container.controller] : [registration.waiting, this.container.controller, registration.active];
      for (const worker of new Set(workers.filter(Boolean))) {
        try {
          const info = await workerBuild(worker, Math.min(2000, this.timeout));
          if (info.contentHash === hash) return worker;
        } catch { /* An older worker may not yet support build messages. */ }
      }
      await delay(50);
    } while (Date.now() < deadline);
    throw new Error('De nieuwe publicatie is nog niet volledig beschikbaar. Probeer het straks opnieuw; je huidige app blijft werken.');
  }
  async check() {
    if (['checking', 'installing'].includes(this.state.phase)) return;
    this.set('checking', 'Gepubliceerde versie controleren…');
    try {
      const release = await this.published();
      if (!this.current.contentHash) throw new Error('Deze lokale ontwikkelversie heeft geen buildnummer. Controleer updates in de gepubliceerde app.');
      const registration = await this.readyRegistration();
      if (release.contentHash === this.current.contentHash) { this.set('latest', 'Je gebruikt de nieuwste beschikbare versie'); return; }
      await this.targetWorker(registration, release.contentHash);
      this.set('available', 'Update beschikbaar', release);
    } catch (e) { this.set('error', e.message || 'Controleren is mislukt. Probeer het opnieuw.'); }
  }
  async install() {
    if (this.state.phase !== 'available') return;
    this.set('installing', 'Update ophalen en je invoer veilig bewaren…', this.state.target);
    try {
      // Recheck the publication: another build may have shipped since the button appeared.
      const release = await this.published(), registration = await this.readyRegistration();
      const worker = await this.targetWorker(registration, release.contentHash);
      await this.save();
      if (worker === registration.waiting) worker.postMessage({ type: 'ACTIVATE_UPDATE' });
      await this.targetWorker(registration, release.contentHash, true);
      // No controllerchange handler reloads other tabs or discards their pending input.
      this.reload();
    } catch (e) { this.set('error', e.message || 'Installeren is mislukt. Je gegevens blijven bewaard.'); }
  }
  async notice(worker) {
    if (!worker || !this.current.contentHash || ['checking', 'installing'].includes(this.state.phase)) return;
    try {
      const info = await workerBuild(worker);
      if (info.contentHash !== this.current.contentHash && !['checking', 'installing'].includes(this.state.phase)) this.set('available', 'Update beschikbaar', info);
    } catch { /* The explicit check can report network/installation errors. */ }
  }
  async watch() {
    try {
      if (!this.registration) return;
      const registration = await this.registration;
      this.notice(registration.waiting || this.container.controller);
      const observe = worker => worker?.addEventListener('statechange', () => { if (worker.state === 'installed') this.notice(registration.waiting); });
      observe(registration.installing);
      registration.addEventListener('updatefound', () => observe(registration.installing));
      this.container.addEventListener('controllerchange', () => this.notice(this.container.controller));
    } catch { /* Explicit update checks present registration errors in Settings. */ }
  }
}
