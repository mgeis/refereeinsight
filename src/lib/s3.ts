import { randomBytes } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "us-east-1";
const bucketName = process.env.PROFILE_PICTURES_BUCKET;

const client = new S3Client({ region });

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_PROFILE_PICTURE_TYPES = Object.keys(EXTENSION_BY_CONTENT_TYPE);

function requireBucket(): string {
  if (!bucketName) {
    throw new Error("PROFILE_PICTURES_BUCKET must be set to upload profile pictures");
  }
  return bucketName;
}

export async function uploadProfilePicture(
  userId: number,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
  if (!extension) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const key = `profile-pictures/${userId}/${randomBytes(16).toString("hex")}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: requireBucket(),
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );

  return key;
}

export async function deleteProfilePicture(key: string): Promise<void> {
  await client.send(
    new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }),
  );
}

// Bucket is private — pictures are served through short-lived presigned URLs
// rather than public bucket ACLs or a CDN in front of it.
export async function getProfilePictureUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: requireBucket(), Key: key });
  return getSignedUrl(client, command, { expiresIn: 900 });
}
