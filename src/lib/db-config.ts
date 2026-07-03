// DB_SECRETS_SOURCE=env  → DATABASE_URL read from environment (default, used in dev)
// DB_SECRETS_SOURCE=aws  → credentials fetched from AWS Secrets Manager (used in test/prod)
//
// When DB_SECRETS_SOURCE=aws, set one of:
//   DB_SECRET_ARN   — full ARN  (preferred in ECS/Lambda where the task role has access)
//   DB_SECRET_NAME  — secret name (also works; ARN is more robust across accounts)
//   AWS_REGION      — region (defaults to us-east-1)
//
// The secret must be JSON in RDS-standard format:
//   { "username": "...", "password": "...", "host": "...", "port": 5432, "dbname": "..." }

const source = process.env.DB_SECRETS_SOURCE ?? "env";

if (source !== "env" && source !== "aws") {
  throw new Error(
    `Unknown DB_SECRETS_SOURCE: "${source}". Valid values: "env", "aws".`,
  );
}

let cachedUrl: string | undefined;

async function resolveFromSecretsManager(): Promise<string> {
  const secretId = process.env.DB_SECRET_ARN ?? process.env.DB_SECRET_NAME;
  if (!secretId) {
    throw new Error(
      "DB_SECRET_ARN or DB_SECRET_NAME must be set when DB_SECRETS_SOURCE=aws",
    );
  }

  const { SecretsManagerClient, GetSecretValueCommand } = await import(
    "@aws-sdk/client-secrets-manager"
  );

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );

  if (!response.SecretString) {
    throw new Error(`Secret "${secretId}" has no string value`);
  }

  const secret = JSON.parse(response.SecretString) as {
    username: string;
    password: string;
    host: string;
    port: string | number;
    dbname: string;
  };

  const encoded = encodeURIComponent(secret.password);
  return `postgresql://${secret.username}:${encoded}@${secret.host}:${secret.port}/${secret.dbname}?schema=public`;
}

export async function getConnectionString(): Promise<string> {
  if (cachedUrl) return cachedUrl;

  if (source === "aws") {
    cachedUrl = await resolveFromSecretsManager();
  } else {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL must be set when DB_SECRETS_SOURCE=env");
    cachedUrl = url;
  }

  return cachedUrl;
}
