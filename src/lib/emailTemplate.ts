const APP_NAME = "Referee Insight";
const BRAND_COLOR = "#00aaff";

// Shared visual shell for app-sent transactional email (as opposed to
// Cognito-triggered email, which gets the same look via the separate
// CustomMessage Lambda trigger deployed alongside this app).
export function wrapEmailHtml(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a1830;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a1830;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#0f1f3d;border-radius:12px;overflow:hidden;border:1px solid rgba(0,150,255,0.25);">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <div style="font-size:18px;font-weight:700;color:#e8f4ff;letter-spacing:0.02em;">${APP_NAME}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px 32px;color:#c8dcf5;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
          <div style="color:rgba(140,180,220,0.5);font-size:11px;margin-top:16px;">${APP_NAME} &copy; ${new Date().getFullYear()}</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function codeBlock(code: string): string {
  return `<div style="margin:20px 0;padding:16px 20px;background:rgba(0,150,255,0.08);border:1px solid rgba(0,150,255,0.3);border-radius:8px;text-align:center;">
    <span style="font-size:22px;font-weight:700;letter-spacing:2px;color:${BRAND_COLOR};font-family:monospace;">${code}</span>
  </div>`;
}

export function buttonLink(href: string, label: string): string {
  return `<div style="margin:20px 0;text-align:center;">
    <a href="${href}" style="display:inline-block;padding:12px 28px;border-radius:8px;background:linear-gradient(135deg,#0055cc,#0099ee);color:#fff;font-weight:600;font-size:14px;text-decoration:none;">${label}</a>
  </div>`;
}
