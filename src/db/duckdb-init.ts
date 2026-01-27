import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let isPersistent = false;

export async function initDuckDB(): Promise<{ db: duckdb.AsyncDuckDB; isPersistent: boolean }> {
  if (db) {
    return { db, isPersistent };
  }

  // Get bundles from jsDelivr CDN
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // Try OPFS first for persistence, fall back to memory
  try {
    await db.open({
      path: 'opfs://gymlog.db',
      accessMode: duckdb.DuckDBAccessMode.READ_WRITE
    });
    isPersistent = true;
    console.log('DuckDB initialized with OPFS persistence');
  } catch (error) {
    console.warn('OPFS not supported, using in-memory database:', error);
    await db.open({ path: ':memory:' });
    isPersistent = false;
  }

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

  return { db, isPersistent };
}

export function getDuckDB(): duckdb.AsyncDuckDB | null {
  return db;
}

export function getIsPersistent(): boolean {
  return isPersistent;
}
