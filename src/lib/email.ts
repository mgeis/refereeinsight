import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const region = process.env.AWS_REGION ?? "us-east-1";
const fromEmail = process.env.SES_FROM_EMAIL;

const client = new SESv2Client({ region });

// Note: while the SES account is in sandbox mode, this only succeeds when
// both the sender (SES_FROM_EMAIL) and the recipient are verified identities.
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!fromEmail) {
    throw new Error("SES_FROM_EMAIL must be set to send email.");
  }

  await client.send(new SendEmailCommand({
    FromEmailAddress: fromEmail,
    Destination: { ToAddresses: [params.to] },
    Content: {
      Simple: {
        Subject: { Data: params.subject, Charset: "UTF-8" },
        Body: { Html: { Data: params.html, Charset: "UTF-8" } },
      },
    },
  }));
}
