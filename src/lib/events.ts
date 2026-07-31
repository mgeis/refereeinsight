import { randomBytes } from "crypto";
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  ResourceAlreadyExistsException,
} from "@aws-sdk/client-cloudwatch-logs";

/**
 * Structured event logging to CloudWatch. Never throws and never blocks the
 * caller — logging failures must not affect request handling. If
 * CLOUDWATCH_LOG_GROUP isn't set (e.g. a fresh local checkout before AWS is
 * configured), this silently no-ops.
 */

const region = process.env.AWS_REGION ?? "us-east-1";
const logGroupName = process.env.CLOUDWATCH_LOG_GROUP;

const client = logGroupName ? new CloudWatchLogsClient({ region }) : null;

// One stream per process lifetime — cheap to create, avoids any need for
// sequence-token coordination across concurrent writers to the same stream.
const logStreamName = `events-${new Date().toISOString().slice(0, 10)}-${randomBytes(4).toString("hex")}`;
let streamReady: Promise<void> | null = null;

function ensureStream(): Promise<void> {
  if (!streamReady) {
    streamReady = client!
      .send(new CreateLogStreamCommand({ logGroupName, logStreamName }))
      .then(() => undefined)
      .catch((err) => {
        if (err instanceof ResourceAlreadyExistsException) return;
        throw err;
      });
  }
  return streamReady;
}

export function logEvent(eventType: string, data: Record<string, unknown> = {}): void {
  if (!client || !logGroupName) return;

  const message = JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), ...data });

  ensureStream()
    .then(() =>
      client.send(
        new PutLogEventsCommand({
          logGroupName,
          logStreamName,
          logEvents: [{ timestamp: Date.now(), message }],
        })
      )
    )
    .catch((err) => {
      console.error("[logEvent] failed to write to CloudWatch:", err);
    });
}
