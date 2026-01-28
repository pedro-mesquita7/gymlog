import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<{ db: duckdb.AsyncDuckDB; isPersistent: boolean }> | null = null;
let isPersistent = false;

export async function initDuckDB(): Promise<{ db: duckdb.AsyncDuckDB; isPersistent: boolean }> {
  // Prevent concurrent initialization
  if (initPromise) {
    return initPromise;
  }

  if (db) {
    return { db, isPersistent };
  }

  initPromise = (async () => {
    // Use CDN bundles for reliability
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);

    // Use OPFS for persistence (data survives page refresh)
    await db.open({ path: 'opfs://gymlog.db' });
    isPersistent = true;
    console.log('DuckDB initialized (OPFS persistent mode)');

    // Initialize schema
    const conn = await db.connect();

    // Create events buffer table for event sourcing
    await conn.query(`
      CREATE TABLE IF NOT EXISTS events (
        _event_id VARCHAR PRIMARY KEY,
        _created_at TIMESTAMP NOT NULL,
        event_type VARCHAR NOT NULL,
        payload JSON NOT NULL,
        year INTEGER GENERATED ALWAYS AS (YEAR(_created_at)) VIRTUAL,
        month INTEGER GENERATED ALWAYS AS (MONTH(_created_at)) VIRTUAL
      )
    `);

    await conn.close();

    return { db: db!, isPersistent };
  })();

  return initPromise;
}

export function getDuckDB(): duckdb.AsyncDuckDB | null {
  return db;
}

export function getIsPersistent(): boolean {
  return isPersistent;
}
