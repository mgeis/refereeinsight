-- CreateTable
CREATE TABLE "Eula" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Eula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Eula_version_key" ON "Eula"("version");

-- CreateTable
CREATE TABLE "EulaAcceptance" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eulaId" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EulaAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EulaAcceptance_userId_eulaId_key" ON "EulaAcceptance"("userId", "eulaId");

-- AddForeignKey
ALTER TABLE "EulaAcceptance" ADD CONSTRAINT "EulaAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EulaAcceptance" ADD CONSTRAINT "EulaAcceptance_eulaId_fkey" FOREIGN KEY ("eulaId") REFERENCES "Eula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed version 1
INSERT INTO "Eula" ("version", "content") VALUES (1, $EULA$
END USER LICENSE AGREEMENT

Referee Insight
Version 1
Effective Date: [INSERT DATE]

TEMPLATE NOTICE: This is a draft template, not legal advice. Bracketed
placeholders (e.g. [ENTITY NAME]) must be filled in, and this document
should be reviewed by a qualified attorney licensed in your jurisdiction
before you rely on it.

PLEASE READ THIS END USER LICENSE AGREEMENT ("AGREEMENT") CAREFULLY BEFORE
USING REFEREE INSIGHT (THE "SERVICE"). BY CREATING AN ACCOUNT OR USING THE
SERVICE, YOU AGREE TO BE BOUND BY THIS AGREEMENT. IF YOU DO NOT AGREE, DO
NOT USE THE SERVICE.

1. THE SERVICE
Referee Insight is a personal match-reporting and referee-development tool
operated by [ENTITY NAME] ("we," "us," or "our"). The Service allows
registered users ("you") to create accounts, record match reports and
related officiating data, and optionally use AI-assisted features to
review that data.

2. ELIGIBILITY AND ACCOUNTS
You must provide accurate registration information and are responsible for
maintaining the confidentiality of your account credentials and for all
activity that occurs under your account. You must notify us promptly of
any unauthorized use of your account.

3. YOUR CONTENT
You retain ownership of the match reports, notes, and other data you
submit to the Service ("Your Content"). You grant us a limited,
non-exclusive license to store, process, and display Your Content solely
for the purpose of operating and improving the Service for you. You are
responsible for ensuring Your Content does not violate any third party's
rights or any applicable law.

4. ACCEPTABLE USE
You agree not to: (a) use the Service for any unlawful purpose; (b)
attempt to gain unauthorized access to any account, data, or system
supporting the Service; (c) interfere with or disrupt the integrity or
performance of the Service; (d) upload content that is defamatory,
harassing, or that discloses another person's personal information
without a lawful basis for doing so; or (e) use automated means to access
the Service except through officially supported interfaces (including the
Service's MCP server, where enabled for your account and subject to this
Agreement).

5. THIRD-PARTY SERVICES
The Service uses third-party providers to operate, including but not
limited to authentication services (Amazon Cognito) and, where AI-assisted
features are enabled, Anthropic's Claude API to process the questions and
match-report data you submit to those features. Your use of AI-assisted
features is subject to those providers' own terms where applicable. We are
not responsible for the acts or omissions of third-party providers.

6. PRIVACY AND DATA
We store the account and match-report information you provide in order to
operate the Service. [INSERT SUMMARY OF DATA PRACTICES OR LINK TO A
SEPARATE PRIVACY POLICY.] Do not submit sensitive personal information
about yourself or others beyond what is reasonably necessary for a match
report.

7. MCP SERVER ACCESS
The Service may expose an MCP (Model Context Protocol) endpoint that lets
you connect your own AI client to your account data. Access to the MCP
server requires (a) a valid personal access token issued through your
account, and (b) that you have agreed to the most current version of this
Agreement. We may suspend MCP access at any time your acceptance of this
Agreement is no longer current, without separately suspending your access
to the Service's web interface.

8. CHANGES TO THIS AGREEMENT
We may revise this Agreement from time to time. Each revision is assigned
a new version number. If we adopt a new version, you will be required to
review and accept it before continuing to use the Service (including the
MCP server) — continued access is conditioned on accepting the then-current
version. We will make reasonable efforts to flag material changes, but the
version history maintained by the Service is the authoritative record of
what you agreed to and when.

9. TERMINATION
We may suspend or terminate your access to the Service at any time for
conduct that violates this Agreement or for any other reason at our
discretion, including extended inactivity. You may stop using the Service
and request deletion of your account at any time by contacting us.

10. DISCLAIMER OF WARRANTIES
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF
ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE
DO NOT WARRANT THAT AI-ASSISTED FEATURES WILL BE ACCURATE, RELIABLE, OR
ERROR-FREE.

11. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, [ENTITY NAME] WILL NOT BE LIABLE
FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
OR ANY LOSS OF DATA, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

12. GOVERNING LAW
This Agreement is governed by the laws of [INSERT JURISDICTION], without
regard to its conflict-of-laws principles.

13. CONTACT
Questions about this Agreement can be directed to [INSERT CONTACT EMAIL].

BY CLICKING "I AGREE," CREATING AN ACCOUNT, OR OTHERWISE USING THE
SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE
BOUND BY THIS AGREEMENT.
$EULA$);
