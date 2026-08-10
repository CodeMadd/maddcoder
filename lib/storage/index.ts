import { promises as fs } from "fs";
import path from "path";

export interface StorageDriver {
  readonly name: string;
  put(key: string, data: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

/**
 * Development driver. Stores files under ./.storage (git-ignored). Files are
 * only ever served through authenticated, ownership-checked routes — never via
 * a public URL.
 */
class LocalStorage implements StorageDriver {
  readonly name = "local";
  private root = path.join(process.cwd(), ".storage");

  private full(key: string) {
    const safe = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.root, safe);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const file = this.full(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.full(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.full(key));
    } catch {
      // Ignore missing files on delete.
    }
  }
}

/**
 * S3 / R2 driver placeholder. The abstraction is ready for a real
 * S3-compatible backend; wire it up with @aws-sdk/client-s3 and the STORAGE_*
 * env vars. Credentials are only ever used server-side.
 */
class S3Storage implements StorageDriver {
  readonly name = "s3";
  async put(): Promise<void> {
    throw new Error(
      "S3 storage driver not configured. Install @aws-sdk/client-s3 and implement lib/storage S3Storage, or set STORAGE_DRIVER=local.",
    );
  }
  async get(): Promise<Buffer> {
    throw new Error("S3 storage driver not configured.");
  }
  async delete(): Promise<void> {
    throw new Error("S3 storage driver not configured.");
  }
}

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  cached = driver === "s3" ? new S3Storage() : new LocalStorage();
  return cached;
}

export function documentStorageKey(
  userId: string,
  documentId: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `documents/${userId}/${documentId}/${safe}`;
}
