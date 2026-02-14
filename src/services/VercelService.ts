import { vercelTokenService } from './vercelTokenService';
import { auth } from '@/config/firebase';

const API_BASE = import.meta.env.PROD 
  ? 'https://www.naklikam.cz/api'
  : 'http://localhost:3002';

export interface VercelUser {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  targets: {
    production: {
      domain: string;
      url: string;
    };
  };
  gitRepository?: {
    type: string;
    repo: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface VercelDeployment {
  uid: string;
  url: string;
  name: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  type: 'LAMBDAS';
  createdAt: number;
  readyAt?: number;
  buildingAt?: number;
  creator: {
    uid: string;
    username: string;
  };
  target: 'production' | 'preview';
}

class VercelService {
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    // Still save to localStorage for quick access
    localStorage.setItem('vercel_token', token);
    
    // Save to Firebase if user is authenticated
    const user = auth.currentUser;
    if (user) {
      try {
        await vercelTokenService.saveToken(user.uid, token);
      } catch (error) {
        console.error('Failed to save Vercel token to Firebase:', error);
      }
    }
  }

  async getToken(): Promise<string | null> {
    // First check memory
    if (this.token) {
      return this.token;
    }
    
    // Then check localStorage
    const localToken = localStorage.getItem('vercel_token');
    if (localToken) {
      this.token = localToken;
      return localToken;
    }
    
    // Finally, try to load from Firebase
    const user = auth.currentUser;
    if (user) {
      try {
        const firebaseToken = await vercelTokenService.getToken(user.uid);
        if (firebaseToken) {
          this.token = firebaseToken;
          // Also save to localStorage for next time
          localStorage.setItem('vercel_token', firebaseToken);
          return firebaseToken;
        }
      } catch (error) {
        console.error('Failed to load Vercel token from Firebase:', error);
      }
    }
    
    return null;
  }

  async clearToken() {
    this.token = null;
    localStorage.removeItem('vercel_token');
    
    // Remove from Firebase if user is authenticated
    const user = auth.currentUser;
    if (user) {
      try {
        await vercelTokenService.removeToken(user.uid);
      } catch (error) {
        console.error('Failed to remove Vercel token from Firebase:', error);
      }
    }
  }

  async isConnected(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  private async getHeaders() {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Vercel token not found. Please connect your Vercel account.');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        console.error('Invalid token - unauthorized');
        return false;
      }
      
      if (!response.ok) {
        console.error(`Token validation failed with status: ${response.status}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation network error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<VercelUser> {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: await this.getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Invalid or expired Vercel Personal Access Token');
    }
    
    if (response.status === 403) {
      throw new Error('Token does not have required permissions. Please create a new token with read-user scope');
    }

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    const user = data.user || data;
    return {
      id: user.uid || user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
  }

  async getProjects(): Promise<VercelProject[]> {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: await this.getHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Invalid or expired Vercel Personal Access Token');
    }
    
    if (response.status === 403) {
      throw new Error('Token does not have required permissions. Please create a new token with read-projects scope');
    }

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    return data.projects || [];
  }

  async createProject(name: string, gitRepository?: { type: string; repo: string }): Promise<VercelProject> {
    const projectData: any = {
      name,
      framework: 'nextjs',
    };

    if (gitRepository) {
      projectData.gitRepository = {
        type: gitRepository.type,
        repo: gitRepository.repo,
      };
    }

    const response = await fetch('https://api.vercel.com/v10/projects', {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(projectData),
    });

    if (response.status === 401) {
      throw new Error('Invalid or expired Vercel Personal Access Token');
    }
    
    if (response.status === 403) {
      throw new Error('Token does not have required permissions. Please create a new token with write-projects scope');
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to create project: ${response.statusText} (${response.status})`);
    }

    return response.json();
  }

  async createDeployment(projectId: string, gitSource?: any): Promise<VercelDeployment> {
    const response = await fetch(`${API_BASE}/api/vercel/projects/${projectId}/deployments`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({
        gitSource,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to create deployment: ${response.statusText}`);
    }

    return response.json();
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get deployment: ${response.statusText}`);
    }

    return response.json();
  }

  async getProjectDeployments(projectId: string, limit = 10): Promise<VercelDeployment[]> {
    const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=${limit}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get deployments: ${response.statusText}`);
    }

    const data = await response.json();
    return data.deployments || [];
  }

  async waitForDeployment(deploymentId: string, timeout = 300000): Promise<VercelDeployment> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const deployment = await this.getDeployment(deploymentId);
      
      if (deployment.state === 'READY' || deployment.state === 'ERROR' || deployment.state === 'CANCELED') {
        return deployment;
      }
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Deployment timeout');
  }

  // Create project with immediate GitHub connection and trigger deployment
  async createProjectWithGitHub(
    projectName: string,
    githubRepo: { owner: string; name: string; branch?: string },
    options: {
      autoDeployEnabled?: boolean;
      triggerInitialDeploy?: boolean;
    } = {}
  ): Promise<{
    project: VercelProject;
    deployment?: VercelDeployment;
  }> {
    console.log(`Creating Vercel project with GitHub integration: ${githubRepo.owner}/${githubRepo.name}`);

    // Create project with GitHub repository connection
    const project = await this.createProject(projectName, {
      type: 'github',
      repo: `${githubRepo.owner}/${githubRepo.name}`,
    });

    console.log(`Vercel project created: ${project.id}`);

    let deployment: VercelDeployment | undefined;

    // Trigger initial deployment if requested
    if (options.triggerInitialDeploy) {
      console.log('Triggering initial deployment...');
      
      try {
        deployment = await this.createDeployment(project.id, {
          type: 'github',
          repo: `${githubRepo.owner}/${githubRepo.name}`,
          ref: githubRepo.branch || 'main',
        });
        console.log(`Initial deployment created: ${deployment.uid}`);
      } catch (error) {
        console.warn('Initial deployment failed, but project was created successfully:', error);
      }
    }

    return { project, deployment };
  }

  // Helper method to create project and deploy from GitHub (legacy)
  async deployFromGitHub(
    projectName: string,
    githubRepo: { owner: string; name: string; branch?: string }
  ): Promise<{
    project: VercelProject;
    deployment: VercelDeployment;
  }> {
    console.log(`Creating Vercel project and deploying from GitHub: ${githubRepo.owner}/${githubRepo.name}`);

    const result = await this.createProjectWithGitHub(projectName, githubRepo, {
      triggerInitialDeploy: true
    });

    if (!result.deployment) {
      throw new Error('Failed to create initial deployment');
    }

    return { 
      project: result.project, 
      deployment: result.deployment 
    };
  }

  // Connect with Personal Access Token
  async connectWithPAT(token: string): Promise<VercelUser> {
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new Error('Invalid Vercel Personal Access Token. Please check that your token is correct and has not expired.');
    }
    
    await this.setToken(token);
    try {
      return await this.getCurrentUser();
    } catch (error) {
      // If getting user fails, clear the invalid token
      await this.clearToken();
      throw error;
    }
  }
}

export default VercelService;
export const vercelService = new VercelService();