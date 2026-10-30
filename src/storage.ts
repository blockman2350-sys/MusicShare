import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Bucket settings use the names Railway exposes on a storage bucket:
// BUCKET, ENDPOINT, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY.
// S3_FORCE_PATH_STYLE=true is for local MinIO. Without these variables the app
// keeps storing files in Postgres, as before.
export function storageEnabled(): boolean {
  const e = process.env;
  return Boolean(e.BUCKET && e.ENDPOINT && e.ACCESS_KEY_ID && e.SECRET_ACCESS_KEY);
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      endpoint: process.env.ENDPOINT,
      region: process.env.REGION || "auto",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      // Fail stalled connections instead of holding one of the pooled sockets forever.
      requestHandler: { connectionTimeout: 5000, requestTimeout: 30000 },
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3().send(
    new PutObjectCommand({ Bucket: process.env.BUCKET, Key: key, Body: body, ContentType: contentType, ContentLength: body.length }),
  );
}

/** Streams an object, or a byte range of it ("bytes=0-99"). */
export async function getObjectStream(key: string, range?: string, signal?: AbortSignal): Promise<ReadableStream | null> {
  try {
    const res = await s3().send(new GetObjectCommand({ Bucket: process.env.BUCKET, Key: key, Range: range }), { abortSignal: signal });
    return res.Body ? (res.Body.transformToWebStream() as ReadableStream) : null;
  } catch (e) {
    if ((e as { name?: string }).name === "NoSuchKey") return null;
    throw e;
  }
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: process.env.BUCKET, Key: key }));
}
