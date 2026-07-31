# TODO

- [ ] **Finish SES setup — now blocking two features, not just Cognito branding** (both `us-east-1_17owL4tjv` test and `us-east-1_5CEnPxD5c` prod pools/account)
  - Cognito's `CustomMessage` Lambda trigger (`refereeinsight-cognito-custom-message`) already provides branded HTML for Cognito-sent mail, but both pools still use `EmailSendingAccount: COGNITO_DEFAULT` (50/day cap, generic Amazon sender).
  - The admin-invite feature (`src/lib/email.ts`, `SES_FROM_EMAIL` env var) sends its own mail directly via SES — **this is currently broken in practice**: the account has zero verified identities and `ProductionAccessEnabled: false` (sandbox), confirmed via `aws sesv2 get-account`. Sandbox mode requires both sender AND recipient to be verified, so invite emails to real, uninvited people cannot deliver until this is resolved.
  - Steps (unchanged, now more urgent):
    1. Verify a domain (or single address) in SES, ideally `refereeinsight.com` or similar — adds DKIM/SPF/DMARC DNS records for deliverability. Set `SES_FROM_EMAIL` to match.
    2. Request SES **production access** in the AWS console (manual review, ~24h) — has to be requested from the account owner's own AWS context, not run via CLI on someone's behalf.
    3. Update each Cognito user pool's `EmailConfiguration`: `EmailSendingAccount=DEVELOPER`, `SourceArn=<verified SES identity ARN>`, `From=<address>`.
  - Cost: ~$0.10 per 1,000 emails, negligible at this app's scale.

- [ ] **Register a domain name** for the app (e.g. `refereeinsight.com`) — needed for the SES setup above, and for a real prod URL instead of an EC2 host/IP.

- [ ] **Deploy using the correct IAM user; do all needed grants for that user**
  - Currently deploying/admin actions have been run under `mgeis_iam` (personal IAM user). Decide on the actual deploy-time principal (a dedicated IAM user or role for CI/CD, or the EC2 instance profile referenced in `scripts/deploy-ec2.sh`) and grant it exactly what it needs: RDS/Secrets Manager (DB creds), S3 (profile pictures — `refereeinsight-test-profile-pictures`, `refereeinsight-prod-profile-pictures`), Rekognition (`DetectModerationLabels`), CloudWatch Logs (event logging), Cognito admin actions, and Lambda/SES once that's wired up. Needs an inventory of exactly which AWS calls the running app makes server-side, then a least-privilege policy — don't just attach broad managed policies.

- [ ] **Have beta users sign an NDA** before granting access. Need to decide: e-signature tool (e.g. DocuSign/HelloSign) vs. a simple click-to-accept flow like the existing EULA acceptance system (`Eula`/`EulaAcceptance` models, `/dashboard/eula`) — an NDA could likely reuse that same versioned-acceptance pattern rather than building something new.

- [ ] **Require date of birth at registration** — add a `dateOfBirth` field to signup (`src/app/signup/page.tsx`, `User` model, `/api/auth/signup`).

- [ ] **Minor handling, dependent on DOB above**:
  - If the user is a minor (under 18, or whatever age threshold legal decides), require a parental/guardian email address at signup.
  - When a minor's match report generates feedback, CC the parent email on that feedback notification.
  - Needs a legal/policy decision first: exact age cutoff, what "feedback" delivery mechanism this hooks into (none exists yet — reports currently aren't emailed to anyone), and whether COPPA or similar applies given DOB collection from minors.
