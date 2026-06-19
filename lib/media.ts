// Media storage abstraction.
//
// Recipe photos are stored with an external provider; the app only keeps the
// public URL and the provider id needed to delete the asset. Today the only
// backend is Cloudinary (signed REST API, no SDK dependency). The MediaStore
// interface is intentionally small so a local-filesystem backend can be added
// later and selected via MEDIA_PROVIDER without touching the call sites.
//
// Server-only: relies on CLOUDINARY_* secrets, never import from client code.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type UploadedMedia = { url: string; publicId: string };

export interface MediaStore {
  /** True when the backend has the credentials it needs to upload. */
  readonly configured: boolean;
  /** Uploads an image file and returns its public URL + provider id. */
  upload(file: File): Promise<UploadedMedia>;
  /** Best-effort deletion of a previously uploaded asset. */
  remove(publicId: string): Promise<void>;
}

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = process.env.CLOUDINARY_FOLDER ?? "mealoday";

/**
 * Cloudinary signature: the params (minus file/api_key/resource_type) sorted
 * alphabetically as `key=value` joined by `&`, suffixed with the API secret,
 * hashed with SHA-1.
 */
function sign(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
}

class CloudinaryStore implements MediaStore {
  readonly configured = true;

  constructor(
    private readonly cloud: string,
    private readonly key: string,
    private readonly secret: string,
  ) {}

  async upload(file: File): Promise<UploadedMedia> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = sign({ folder: FOLDER, timestamp }, this.secret);

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", this.key);
    form.append("timestamp", String(timestamp));
    form.append("folder", FOLDER);
    form.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloud}/image/upload`,
      { method: "POST", body: form },
    );
    if (!res.ok) {
      throw new Error(`Échec de l'upload Cloudinary (${res.status})`);
    }
    const json = (await res.json()) as { secure_url: string; public_id: string };
    return { url: json.secure_url, publicId: json.public_id };
  }

  async remove(publicId: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = sign({ public_id: publicId, timestamp }, this.secret);

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", this.key);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);

    // Best-effort: a failed deletion must not break the recipe write.
    await fetch(`https://api.cloudinary.com/v1_1/${this.cloud}/image/destroy`, {
      method: "POST",
      body: form,
    }).catch(() => undefined);
  }
}

// ponytail: LocalStore writes to public/uploads/ at build-time root — ephemeral
// on Vercel serverless (filesystem resets per cold start). Use Cloudinary for
// production deployments; LocalStore is for local/self-hosted setups only.
class LocalStore implements MediaStore {
  readonly configured = true;

  private uploadsDir(): string {
    return path.join(process.cwd(), "public", "uploads");
  }

  async upload(file: File): Promise<UploadedMedia> {
    const ext = file.name.split(".").pop() ?? "bin";
    const id = `${crypto.randomUUID()}.${ext}`;
    const dir = this.uploadsDir();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, id), Buffer.from(await file.arrayBuffer()));
    return { url: `/uploads/${id}`, publicId: id };
  }

  async remove(publicId: string): Promise<void> {
    await fs
      .unlink(path.join(this.uploadsDir(), publicId))
      .catch(() => undefined);
  }
}

/** Fallback when no provider is configured: uploads throw, deletions no-op. */
class NullStore implements MediaStore {
  readonly configured = false;
  async upload(): Promise<UploadedMedia> {
    throw new Error(
      "Aucun service média configuré. Renseignez CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.",
    );
  }
  async remove(): Promise<void> {}
}

let store: MediaStore | null = null;

/** Returns the active media store (singleton): Cloudinary → LocalStore → NullStore. */
export function getMediaStore(): MediaStore {
  if (!store) {
    store =
      CLOUD && KEY && SECRET
        ? new CloudinaryStore(CLOUD, KEY, SECRET)
        : new LocalStore();
  }
  return store;
}
