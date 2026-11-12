// Merros on Azure (SPEC 11): UAE North, one resource group.
//
//   Container Registry          images for the web app and the tools (migrate, seed, jobs)
//   Key Vault                   every secret; the apps read them through a managed identity
//   PostgreSQL Flexible Server  with the pgvector extension allowed
//   AI Speech                   Gulf Arabic and English voice for the Copilot
//   Storage (Blob)              reserved for My Result Video (Phase 5)
//   Log Analytics + App Insights
//   Container Apps environment  web app, a migrate job (run on each deploy), a nightly VariantWatch job
//
// Deploy in two passes (see docs/DEPLOYMENT.md): first with deployApps=false to create the registry,
// then push the images, then with deployApps=true.

targetScope = 'resourceGroup'

@description('Short lowercase name used as a prefix for every resource.')
@minLength(3)
@maxLength(10)
param prefix string = 'merros'

@description('Azure region. Data residency: keep this in the UAE.')
param location string = 'uaenorth'

@description('Region of the AI Speech resource. Keep it in the UAE when the service is offered there.')
param speechLocation string = location

@description('Create the Container Apps (needs the images to be in the registry already).')
param deployApps bool = false

@description('Image tag to run.')
param imageTag string = 'latest'

@description('PostgreSQL administrator login.')
param dbAdminLogin string = 'merrosadmin'

@secure()
@description('PostgreSQL administrator password.')
param dbAdminPassword string

@secure()
@description('32 random bytes, base64. Wraps each user data key.')
param encryptionMasterKey string

@secure()
@description('At least 32 characters. Signs the session cookie.')
param sessionSecret string

@description('Ed25519 public key (hex) of the simulated screening lab.')
param labSigningPublicKey string

@secure()
@description('Ed25519 private key (hex) of the simulated lab. Prototype only: lets the demo seed and Living Results sign synthetic reports.')
param labSigningPrivateKey string

@description('mock (offline demo model) or anthropic.')
@allowed(['mock', 'anthropic'])
param aiProvider string = 'mock'

@secure()
@description('Claude API key. Leave empty with aiProvider=mock.')
param aiApiKey string = ''

@description('Show the persona picker login. This prototype has no other login, so keep true for the demo.')
param demoMode bool = true

@description('Free F0 or standard S0 tier for AI Speech.')
@allowed(['F0', 'S0'])
param speechSku string = 'F0'

var suffix = uniqueString(resourceGroup().id)
var acrName = toLower('${prefix}${suffix}')
var kvName = toLower('${prefix}-kv-${take(suffix, 8)}')
var pgName = toLower('${prefix}-pg-${take(suffix, 8)}')
var storageName = toLower('${take(prefix, 8)}st${take(suffix, 12)}')
var dbName = 'merros'
var databaseUrl = 'postgresql://${dbAdminLogin}:${uriComponent(dbAdminPassword)}@${postgres.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'

// Built in role definition ids.
var roleAcrPull = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var roleKeyVaultSecretsUser = '4633458b-17de-408a-b874-0445c86b69e6'

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${prefix}-apps'
  location: location
}

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${prefix}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${prefix}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, roleAcrPull)
  scope: acr
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleAcrPull)
  }
}

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource vaultRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, identity.id, roleKeyVaultSecretsUser)
  scope: vault
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleKeyVaultSecretsUser)
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgName
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '16'
    administratorLogin: dbAdminLogin
    administratorLoginPassword: dbAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
  }
}

// pgvector must be allow listed before CREATE EXTENSION works.
resource pgExtensions 'Microsoft.DBforPostgreSQL/flexibleServers/configurations@2023-12-01-preview' = {
  parent: postgres
  name: 'azure.extensions'
  properties: {
    value: 'VECTOR'
    source: 'user-override'
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Lets other Azure services (the Container Apps) reach the server. Tighten to a private network before any real use.
resource pgAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource speech 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: '${prefix}-speech-${take(suffix, 6)}'
  location: speechLocation
  kind: 'SpeechServices'
  sku: { name: speechSku }
  properties: {
    publicNetworkAccess: 'Enabled'
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}

// ---- Secrets (Key Vault). Names are what the apps reference below. ----
var secretValues = {
  'database-url': databaseUrl
  'encryption-master-key': encryptionMasterKey
  'session-secret': sessionSecret
  'lab-signing-private-key': labSigningPrivateKey
  'azure-speech-key': speech.listKeys().key1
  'ai-api-key': empty(aiApiKey) ? 'not-set' : aiApiKey
}

var secretNames = ['database-url', 'encryption-master-key', 'session-secret', 'lab-signing-private-key', 'azure-speech-key', 'ai-api-key']

resource secrets 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [
  for name in secretNames: {
    parent: vault
    name: name
    properties: {
      value: secretValues[name]
    }
  }
]

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${prefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

var kvSecrets = [
  for name in secretNames: {
    name: name
    keyVaultUrl: 'https://${kvName}${az.environment().suffixes.keyvaultDns}/secrets/${name}'
    identity: identity.id
  }
]

var commonEnv = [
  { name: 'DATABASE_URL', secretRef: 'database-url' }
  { name: 'DIRECT_URL', secretRef: 'database-url' }
  { name: 'ENCRYPTION_MASTER_KEY', secretRef: 'encryption-master-key' }
  { name: 'SESSION_SECRET', secretRef: 'session-secret' }
  { name: 'LAB_SIGNING_PRIVATE_KEY', secretRef: 'lab-signing-private-key' }
  { name: 'LAB_SIGNING_PUBLIC_KEY', value: labSigningPublicKey }
  { name: 'DEMO_MODE', value: demoMode ? 'true' : 'false' }
  { name: 'AI_PROVIDER', value: aiProvider }
  { name: 'AI_API_KEY', secretRef: 'ai-api-key' }
  { name: 'AZURE_SPEECH_KEY', secretRef: 'azure-speech-key' }
  { name: 'AZURE_SPEECH_REGION', value: speechLocation }
  { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: insights.properties.ConnectionString }
]

var registries = [
  {
    server: acr.properties.loginServer
    identity: identity.id
  }
]

var appIdentity = {
  type: 'UserAssigned'
  userAssignedIdentities: {
    '${identity.id}': {}
  }
}

resource web 'Microsoft.App/containerApps@2024-03-01' = if (deployApps) {
  name: '${prefix}-web'
  location: location
  identity: appIdentity
  dependsOn: [acrPull, vaultRead, secrets, pgDatabase, pgExtensions, pgAllowAzure]
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
      registries: registries
      secrets: kvSecrets
    }
    template: {
      containers: [
        {
          name: 'web'
          image: '${acr.properties.loginServer}/merros-web:${imageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: commonEnv
          probes: [
            {
              type: 'Readiness'
              httpGet: { path: '/en', port: 3000 }
              initialDelaySeconds: 10
              periodSeconds: 15
            }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 2 }
    }
  }
}

// Applies migrations and seeds the synthetic demo data if the database is empty. Started by the deploy workflow.
resource migrateJob 'Microsoft.App/jobs@2024-03-01' = if (deployApps) {
  name: '${prefix}-migrate'
  location: location
  identity: appIdentity
  dependsOn: [acrPull, vaultRead, secrets, pgDatabase, pgExtensions, pgAllowAzure]
  properties: {
    environmentId: environment.id
    configuration: {
      triggerType: 'Manual'
      replicaTimeout: 900
      replicaRetryLimit: 1
      manualTriggerConfig: { parallelism: 1, replicaCompletionCount: 1 }
      registries: registries
      secrets: kvSecrets
    }
    template: {
      containers: [
        {
          name: 'migrate'
          image: '${acr.properties.loginServer}/merros-tools:${imageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: commonEnv
        }
      ]
    }
  }
}

// VariantWatch: checks watched variants against ClinVar every night (SPEC 6.3). 02:00 UAE time is 22:00 UTC.
resource variantWatchJob 'Microsoft.App/jobs@2024-03-01' = if (deployApps) {
  name: '${prefix}-variantwatch'
  location: location
  identity: appIdentity
  dependsOn: [acrPull, vaultRead, secrets, pgDatabase]
  properties: {
    environmentId: environment.id
    configuration: {
      triggerType: 'Schedule'
      replicaTimeout: 900
      replicaRetryLimit: 1
      scheduleTriggerConfig: { cronExpression: '0 22 * * *', parallelism: 1, replicaCompletionCount: 1 }
      registries: registries
      secrets: kvSecrets
    }
    template: {
      containers: [
        {
          name: 'variantwatch'
          image: '${acr.properties.loginServer}/merros-tools:${imageTag}'
          command: ['pnpm', 'variant-watch']
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
          env: commonEnv
        }
      ]
    }
  }
}

output registryName string = acr.name
output registryLoginServer string = acr.properties.loginServer
output keyVaultName string = vault.name
output migrateJobName string = '${prefix}-migrate'
output webUrl string = deployApps ? 'https://${web!.properties.configuration.ingress.fqdn}' : ''
