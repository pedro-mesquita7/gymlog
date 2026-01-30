import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<{ db: duckdb.AsyncDuckDB; isPersistent: boolean }> | null = null;
let isPersistent = false;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS events (
    _event_id VARCHAR PRIMARY KEY,
    _created_at TIMESTAMP NOT NULL,
    event_type VARCHAR NOT NULL,
    payload JSON NOT NULL,
    year INTEGER GENERATED ALWAYS AS (YEAR(_created_at)) VIRTUAL,
    month INTEGER GENERATED ALWAYS AS (MONTH(_created_at)) VIRTUAL
  )
`;

async function cleanupOPFS(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    for (const name of ['gymlog.db', 'gymlog.db.wal']) {
      try {
        await root.removeEntry(name);
        console.log(`Deleted corrupted OPFS file: ${name}`);
      } catch {
        // File may not exist, ignore
      }
    }
  } catch (cleanupErr) {
    console.warn('OPFS cleanup failed:', cleanupErr);
  }
}

async function openWithOPFS(database: duckdb.AsyncDuckDB): Promise<boolean> {
  await database.open({
    path: 'opfs://gymlog.db',
    accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
  });
  const conn = await database.connect();
  await conn.query(SCHEMA_SQL);
  await conn.query('CHECKPOINT');
  await conn.close();
  return true;
}

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

    // Try OPFS for persistence, fall back to in-memory if unavailable
    try {
      await openWithOPFS(db);
      isPersistent = true;
      console.log('DuckDB initialized (OPFS persistent mode)');
    } catch (opfsErr) {
      const errMsg = String(opfsErr);
      const isCorruption = errMsg.includes('not a valid') || errMsg.includes('corrupt') || errMsg.includes('Could not');

      if (isCorruption) {
        console.warn('OPFS database corrupted, cleaning up and retrying:', opfsErr);
        await cleanupOPFS();

        try {
          await openWithOPFS(db);
          isPersistent = true;
          console.log('DuckDB initialized (OPFS persistent mode after cleanup)');
        } catch (retryErr) {
          console.warn('OPFS retry failed, falling back to in-memory:', retryErr);
          await db.open({});
          const conn = await db.connect();
          await conn.query(SCHEMA_SQL);
          await conn.close();
          isPersistent = false;
          console.log('DuckDB initialized (in-memory mode)');
        }
      } else {
        console.warn('OPFS unavailable, falling back to in-memory:', opfsErr);
        await db.open({});
        const conn = await db.connect();
        await conn.query(SCHEMA_SQL);
        await conn.close();
        isPersistent = false;
        console.log('DuckDB initialized (in-memory mode)');
      }
    }

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

export async function checkpoint(): Promise<void> {
  if (!db || !isPersistent) return;
  try {
    const conn = await db.connect();
    await conn.query('CHECKPOINT');
    await conn.close();
  } catch (err) {
    console.warn('CHECKPOINT failed:', err);
  }
}
