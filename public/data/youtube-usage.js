export const USAGE_KEY = 'personaltube.youtube-usage.v1';
export const USAGE_FAILURE_KEY = 'personaltube.youtube-usage-incomplete.v1';
const pacificDay = timestamp => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(timestamp);

export class YouTubeUsage {
  constructor(storage, clock, locks = null) { this.storage = storage; this.clock = clock; this.locks = locks; this.failedDay = null; }
  snapshot() {
    try {
      const day = pacificDay(this.clock());
      if (this.failedDay === day) return null;
      const incomplete = this.storage.getItem(USAGE_FAILURE_KEY);
      if (incomplete === day) return null;
      if (incomplete !== null && !/^\d{4}-\d{2}-\d{2}$/.test(incomplete)) throw new Error('Invalid usage marker');
      const raw = this.storage.getItem(USAGE_KEY);
      const saved = raw === null ? null : JSON.parse(raw);
      if (saved && (saved.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(saved.day) || !Number.isSafeInteger(saved.units) || saved.units < 0 || !Number.isSafeInteger(saved.search) || saved.search < 0)) throw new Error('Invalid usage');
      if (raw !== null && !saved) throw new Error('Invalid usage');
      return saved?.day === day ? { day, units: saved.units, search: saved.search } : { day, units: 0, search: 0 };
    } catch { this.failedDay = pacificDay(this.clock()); return null; }
  }
  async record(resource) {
    if (!['channels', 'playlistItems', 'videos', 'search', 'commentThreads'].includes(resource)) return;
    const increment = () => {
      const value = this.snapshot();
      if (!value) return;
      const bucket = resource === 'search' ? 'search' : 'units';
      if (value[bucket] >= Number.MAX_SAFE_INTEGER) throw new Error('Usage overflow');
      value[bucket]++;
      this.storage.setItem(USAGE_KEY, JSON.stringify({ version: 1, ...value }));
    };
    try {
      if (this.locks) await this.locks.request(USAGE_KEY, { ifAvailable: true }, lock => { if (!lock) throw new Error('Usage busy'); increment(); });
      else increment();
    } catch {
      this.failedDay = pacificDay(this.clock());
      try { this.storage.setItem(USAGE_FAILURE_KEY, pacificDay(this.clock())); } catch { /* Storage failure remains visible in this tab. */ }
    }
  }
}
