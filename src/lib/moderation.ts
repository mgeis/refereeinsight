import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "@aws-sdk/client-rekognition";

const region = process.env.AWS_REGION ?? "us-east-1";
const client = new RekognitionClient({ region });

// Confidence floor for flagging — higher than Rekognition's own default (50)
// to keep false positives on legitimate profile photos low.
const MIN_CONFIDENCE = 80;

export type ModerationResult = {
  flagged: boolean;
  labels: string[];
};

export async function moderateImage(bytes: Buffer): Promise<ModerationResult> {
  const response = await client.send(
    new DetectModerationLabelsCommand({
      Image: { Bytes: bytes },
      MinConfidence: MIN_CONFIDENCE,
    }),
  );

  const labels = (response.ModerationLabels ?? [])
    .map((l) => l.Name)
    .filter((name): name is string => !!name);

  return { flagged: labels.length > 0, labels };
}
