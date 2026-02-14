# Deployment Guide: GitHub + Vercel Integration

## Přehled

Implementujeme deployment workflow pro Next.js projekty: IDE → GitHub → Vercel. Uživatelé budou mít vlastní GitHub a Vercel účty, naše IDE je jen propojí a automatizuje deployment.

## Architektura

```
┌─ Lovable IDE ─┐    ┌─ User GitHub ─┐    ┌─ User Vercel ─┐
│   Project     │───▶│     Repo      │───▶│  Deployment   │
│   Files       │    │   Commits     │    │  Live Site    │
│   Changes     │    │   Branches    │    │  Custom URL   │
└───────────────┘    └───────────────┘    └───────────────┘
```

## Fáze 1: GitHub Integration

### 1.1 GitHub App Setup

**Kroky:**
1. Vytvoř GitHub App na https://github.com/settings/apps
2. Permissions potřebné:
   - Repository permissions: Contents (Read & Write), Metadata (Read)
   - Account permissions: Email addresses (Read)
3. Webhook URL: `https://your-api.com/webhooks/github`

**Environment variables:**
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### 1.2 OAuth Flow Implementation

**Backend endpoint `/auth/github`:**
```typescript
// server.js - přidat GitHub OAuth
app.get('/auth/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email`;
  res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  // Exchange code for access token
  // Store token securely per user
  // Redirect back to IDE
});
```

### 1.3 GitHub API Integration

**Potřebné operace:**
- List user repositories
- Create new repository
- Get repository contents
- Create/update files
- Commit changes
- Get commit history

**Backend služba `/api/github`:**
```typescript
// GitHub API proxy endpoints
POST /api/github/repos - Create repository
GET /api/github/repos - List repositories  
POST /api/github/repos/:repo/contents - Update files
POST /api/github/repos/:repo/commits - Create commit
```

### 1.4 Frontend GitHub UI

**Komponenty k vytvoření:**
```
src/components/deployment/
├── GitHubConnect.tsx      - OAuth připojení
├── RepositorySelector.tsx - Výběr/vytvoření repo
├── GitStatus.tsx          - Stav sync s GitHub
└── CommitDialog.tsx       - Commit message UI
```

**Store rozšíření:**
```typescript
// src/store/deploymentStore.ts
interface DeploymentStore {
  githubToken: string | null;
  connectedRepo: GitHubRepo | null;  
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastCommit: string | null;
  
  connectGitHub: () => Promise<void>;
  createRepository: (name: string) => Promise<void>;
  syncToGitHub: (commitMessage: string) => Promise<void>;
}
```

## Fáze 2: Vercel Integration

### 2.1 Vercel Integration Setup

**Kroky:**
1. Uživatelé používají Personal Access Tokens (PAT)
2. Token generují na: https://vercel.com/account/tokens
3. Scopes potřebné pro token: `read-user`, `read-projects`, `write-projects`

**Žádné environment variables nejsou potřeba!**

### 2.2 Vercel Authentication Flow

**Frontend only - žádné backend endpoints:**
- Uživatel zadá PAT přímo v UI
- Token se validuje proti Vercel API
- Token se ukládá v localStorage

### 2.3 Vercel API Integration

**Backend služba `/api/vercel`:**
```typescript
POST /api/vercel/projects - Create Vercel project
GET /api/vercel/projects/:id - Get project status  
POST /api/vercel/projects/:id/deployments - Trigger deployment
GET /api/vercel/deployments/:id - Get deployment status
POST /api/vercel/projects/:id/domains - Add custom domain
```

### 2.4 Frontend Vercel UI

**Komponenty:**
```
src/components/deployment/
├── VercelConnect.tsx      - OAuth připojení
├── ProjectDashboard.tsx   - Deployment status
├── DeploymentLogs.tsx     - Build logs
├── DomainManager.tsx      - Custom domains
└── DeployButton.tsx       - One-click deploy
```

## Fáze 3: Deployment Workflow

### 3.1 Complete Flow

**User journey:**
1. **Setup** (jednorázově):
   - Connect GitHub account
   - Connect Vercel account  
   - Create/select repository
   - Create Vercel project

2. **Development** (opakovaně):
   - Edit files in IDE
   - Click "Deploy" button
   - Enter commit message
   - Auto: Commit → Push → Deploy → Live URL

### 3.2 Deployment Service

**Centrální služba:**
```typescript
// src/services/DeploymentService.ts
export class DeploymentService {
  async deployProject(projectId: string, commitMessage: string) {
    // 1. Sync files to GitHub
    await this.syncToGitHub(projectId, commitMessage);
    
    // 2. Trigger Vercel deployment  
    const deployment = await this.triggerVercelDeploy(projectId);
    
    // 3. Monitor deployment status
    return this.monitorDeployment(deployment.id);
  }
  
  async setupProject(projectId: string, repoName: string) {
    // 1. Create GitHub repository
    const repo = await this.createGitHubRepo(repoName);
    
    // 2. Create Vercel project connected to repo
    const vercelProject = await this.createVercelProject(repo);
    
    // 3. Initial commit with project files
    await this.initialCommit(projectId, repo);
    
    return { repo, vercelProject };
  }
}
```

### 3.3 UI Integration

**ProjectPage.tsx rozšíření:**
```typescript
// Přidat deployment panel
<div className="deployment-panel">
  {!githubConnected && <GitHubConnect />}
  {!vercelConnected && <VercelConnect />}
  {readyToDeploy && <DeployButton onClick={handleDeploy} />}
  {deployment && <DeploymentStatus deployment={deployment} />}
</div>
```

## Fáze 4: Advanced Features

### 4.1 Branch Management
- Development branch pro preview
- Production branch pro live site
- Pull request previews

### 4.2 Environment Variables
- UI pro nastavení ENV vars
- Sync mezi IDE a Vercel

### 4.3 Custom Domains  
- Domain validation
- DNS setup instructions
- SSL certificates

### 4.4 Analytics Integration
- Deployment metrics
- Site performance data
- Error monitoring

## Implementační Pořadí

1. **Week 1**: GitHub OAuth + basic API
2. **Week 2**: File sync GitHub ↔ IDE  
3. **Week 3**: Vercel OAuth + project creation
4. **Week 4**: Complete deployment flow
5. **Week 5**: UI polish + error handling
6. **Week 6**: Custom domains + advanced features

## Bezpečnost

- **API Keys**: Stored encrypted per user
- **Webhooks**: Signature validation
- **Permissions**: Minimal required scopes
- **Rate Limiting**: API calls per user
- **Error Handling**: Never expose tokens in logs

## Náklady

**Pro tebe:** $0 - používáš API zdarma
**Pro uživatele:** 
- GitHub: Free (unlimited public repos)
- Vercel: Free tier (100GB bandwidth, vlastní domény)

## Technical Implementation Details

### Database Schema Extensions

```sql
-- Add to existing user/project tables
ALTER TABLE users ADD COLUMN github_token TEXT;
ALTER TABLE users ADD COLUMN github_username TEXT;
ALTER TABLE users ADD COLUMN vercel_token TEXT;
ALTER TABLE users ADD COLUMN vercel_team_id TEXT;

ALTER TABLE projects ADD COLUMN github_repo_id TEXT;
ALTER TABLE projects ADD COLUMN github_repo_name TEXT;
ALTER TABLE projects ADD COLUMN vercel_project_id TEXT;
ALTER TABLE projects ADD COLUMN deployment_url TEXT;
ALTER TABLE projects ADD COLUMN last_deployed_at TIMESTAMP;

-- New deployments table
CREATE TABLE deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  github_commit_sha TEXT,
  vercel_deployment_id TEXT,
  status TEXT, -- 'pending', 'building', 'deployed', 'failed'
  deployment_url TEXT,
  build_logs TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP
);
```

### Error Handling Strategy

```typescript
// Comprehensive error handling for deployment flow
export class DeploymentError extends Error {
  constructor(
    message: string,
    public code: 'GITHUB_AUTH' | 'GITHUB_API' | 'VERCEL_AUTH' | 'VERCEL_API' | 'BUILD_FAILED',
    public details?: any
  ) {
    super(message);
  }
}

// Usage in service
try {
  await this.syncToGitHub(projectId, commitMessage);
} catch (error) {
  if (error.status === 401) {
    throw new DeploymentError('GitHub token expired', 'GITHUB_AUTH');
  }
  throw new DeploymentError('Failed to sync to GitHub', 'GITHUB_API', error);
}
```

### Rate Limiting Implementation

```typescript
// Rate limiting for API calls
export class RateLimiter {
  private limits = new Map<string, { count: number; resetAt: number }>();
  
  async checkLimit(userId: string, endpoint: string): Promise<boolean> {
    const key = `${userId}:${endpoint}`;
    const limit = this.limits.get(key);
    
    if (!limit || Date.now() > limit.resetAt) {
      this.limits.set(key, { count: 1, resetAt: Date.now() + 60000 }); // 1 minute
      return true;
    }
    
    if (limit.count >= 10) { // 10 requests per minute
      return false;
    }
    
    limit.count++;
    return true;
  }
}
```

---

Tento guide pokrývá kompletní implementaci GitHub + Vercel integrace pro Lovable Clone IDE. Implementace by měla být postupná podle uvedeného pořadí fází.