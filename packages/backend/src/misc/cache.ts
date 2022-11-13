export class Cache<T> {
	public cache: Map<string | null, { date: number; value: T; }>;
	private lifetime: number;
	public fetcher: (key: string | null) => Promise<T | undefined>;

	constructor(lifetime: number, fetcher: Cache<T>['fetcher']) {
		this.cache = new Map();
		this.lifetime = lifetime;
		this.fetcher = fetcher;
	}

	public set(key: string | null, value: T): void {
		this.cache.set(key, {
			date: Date.now(),
			value,
		});
	}

	public get(key: string | null): T | undefined {
		const cached = this.cache.get(key);
		if (cached == null) return undefined;

		// discard if past the cache lifetime
		if ((Date.now() - cached.date) > this.lifetime) {
			this.cache.delete(key);
			return undefined;
		}

		return cached.value;
	}

	public delete(key: string | null) {
		this.cache.delete(key);
	}

	/**
	 * If the value is cached, it is returned. Otherwise the fetcher is
	 * run to get the value. If the fetcher returns undefined, it is
	 * returned but not cached.
	 */
	public async fetch(key: string | null): Promise<T | undefined> {
		const cached = this.get(key);
		if (cached !== undefined) {
			return cached;
		} else {
			const value = await this.fetcher();

			// don't cache undefined
			if (value !== undefined)
				this.set(key, value);

			return value;
		}
	}
}
