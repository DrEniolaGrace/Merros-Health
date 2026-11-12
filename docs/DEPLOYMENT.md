# Deploying Merros to Azure (UAE North)

Everything the prototype needs is described in one file, `infra/main.bicep`, and deployed by one
manual GitHub Actions workflow, `.github/workflows/deploy.yml`.

**Status:** the template compiles (`az bicep build`) and the workflow is written, but **it has not
been run against a real Azure subscription yet**. The first run may need small corrections (for
example a service or size that the subscription does not offer in UAE North). Local development
does not depend on any of this.

## What gets created

| Resource | Why |
|---|---|
| Container Registry (Basic) | Stores the two images: `merros-web` and `merros-tools` |
| Container Apps environment | Runs the web app, the migrate job and the nightly VariantWatch job |
| PostgreSQL Flexible Server (Burstable B1ms, v16) | The database, with the `vector` extension allowed |
| Key Vault | Holds every secret. The apps read them with a managed identity; nothing secret is in the template outputs |
| AI Speech (free F0 tier by default) | Gulf Arabic (`ar-AE`) and English voice for the Copilot |
| Storage account (Blob) | Reserved for My Result Video (Phase 5) |
| Log Analytics and Application Insights | Logs and monitoring |

Not created yet: Azure Communication Services (real video calls are still simulated) and the
genomics service (Phase 5).

## One time setup

You need an Azure subscription (Azure for Students works) and the code in a GitHub repository.

1. **Create the resource group** in the Azure portal: name `merros-rg`, region **UAE North**.
2. **Let GitHub deploy to it.** In the portal: Microsoft Entra ID, App registrations, New
   registration (name `merros-deploy`). Then:
   * On the app: Certificates and secrets, Federated credentials, Add, "GitHub Actions deploying
     Azure resources", your repository, entity type Branch, and the branch you deploy from (currently `master`).
   * On the resource group `merros-rg`: Access control (IAM), Add role assignment, give the app
     **Contributor** and **Role Based Access Control Administrator** (the template assigns two roles
     to the apps' own identity).
3. **Add repository secrets** (GitHub, Settings, Secrets and variables, Actions):

   | Secret | Value |
   |---|---|
   | `AZURE_CLIENT_ID` | Application (client) ID of `merros-deploy` |
   | `AZURE_TENANT_ID` | Directory (tenant) ID |
   | `AZURE_SUBSCRIPTION_ID` | Your subscription ID |
   | `DB_ADMIN_PASSWORD` | A new strong password (letters and digits) |
   | `ENCRYPTION_MASTER_KEY` | A **new** key for Azure. Run `pnpm setup:env` in a scratch copy, or generate 32 random bytes as base64 |
   | `SESSION_SECRET` | A new random string of at least 32 characters |
   | `LAB_SIGNING_PUBLIC_KEY` | From a new key pair (same scratch `pnpm setup:env`) |
   | `LAB_SIGNING_PRIVATE_KEY` | The matching private key |
   | `AI_API_KEY` | Optional. Only when deploying with `ai_provider = anthropic` |

   Use new secrets for Azure rather than copying the ones in your local `.env`.

## Deploy

GitHub, Actions, **Deploy to Azure**, Run workflow. It will:

1. Run the type check and unit tests.
2. Create or update the infrastructure (registry, database, vault, speech).
3. Build both images inside the registry.
4. Create or update the web app and the two jobs.
5. Run the migrate job (applies migrations; seeds the synthetic personas only if the database is empty).
6. Check that the site answers, and print its address in the run summary.

## After the first deployment

* **Voice:** the Speech key is created and wired automatically. The Copilot badge should read
  "Voice: Azure AI Speech". Check the Arabic voice name against the current list in the portal
  (`AZURE_SPEECH_VOICE_AR`, default `ar-AE-FatimaNeural`).
* **Reset the demo data:** start the `merros-migrate` job with the command `pnpm seed`, or use the
  Judge Tour reset inside the app.
* **Cost:** the database and the always on web replica are the main costs. Stop the PostgreSQL
  server and scale the web app to zero when you are not demonstrating.

## Before any real use (not done in the prototype)

* Private networking for the database (the template allows Azure services through the firewall).
* The lab's private signing key must not live in the platform at all; a real lab signs its own reports.
* Demo persona login must be replaced by UAE Pass.
* Azure Key Vault managed HSM for the master key, with rotation.
