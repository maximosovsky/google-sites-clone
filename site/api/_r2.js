import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _client = null;

function getClient() {
    if (_client) return _client;
    _client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });
    return _client;
}

const BUCKET = () => process.env.R2_BUCKET || 'gsclone';

/**
 * Upload a file to R2
 * @param {string} key - Object key (e.g. 'zips/abc123.zip')
 * @param {Buffer} body - File contents
 * @param {string} contentType - MIME type
 * @param {object} metadata - Custom metadata
 */
export async function uploadToR2(key, body, contentType, metadata = {}) {
    const client = getClient();
    await client.send(new PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
    }));
    return key;
}

/**
 * Get a presigned download URL (valid for 1 hour)
 * @param {string} key - Object key
 * @returns {string} Presigned URL
 */
export async function getDownloadUrl(key) {
    const client = getClient();
    const command = new GetObjectCommand({
        Bucket: BUCKET(),
        Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: 3600 });
}
