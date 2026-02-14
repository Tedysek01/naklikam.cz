import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GitHubRepository, GitHubUser } from '@/services/GitHubService';

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
  createdAt: number;
  updatedAt: number;
}

export interface VercelUser {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  readyAt?: number;
  buildingAt?: number;
  creator: {
    username: string;
  };
}

interface DeploymentStore {
  // GitHub State
  githubConnected: boolean;
  githubUser: GitHubUser | null;
  githubToken: string | null;
  selectedRepository: GitHubRepository | null;
  
  // Vercel State
  vercelConnected: boolean;
  vercelUser: VercelUser | null;
  vercelToken: string | null;
  vercelProject: VercelProject | null;
  
  // Deployment State
  isDeploying: boolean;
  currentDeployment: Deployment | null;
  deploymentHistory: Deployment[];
  lastSyncAt: string | null;
  
  // Actions
  setGitHubConnection: (user: GitHubUser, token: string) => void;
  setSelectedRepository: (repository: GitHubRepository) => void;
  clearGitHubConnection: () => void;
  
  setVercelConnection: (user: VercelUser, token: string) => void;
  setVercelProject: (project: VercelProject) => void;
  clearVercelConnection: () => void;
  
  setDeploymentState: (isDeploying: boolean) => void;
  setCurrentDeployment: (deployment: Deployment | null) => void;
  addDeploymentToHistory: (deployment: Deployment) => void;
  updateLastSync: () => void;
  
  // Computed getters
  isReadyToDeploy: () => boolean;
  canConnectVercel: () => boolean;
}

export const useDeploymentStore = create<DeploymentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      githubConnected: false,
      githubUser: null,
      githubToken: null,
      selectedRepository: null,
      
      vercelConnected: false,
      vercelUser: null,
      vercelToken: null,
      vercelProject: null,
      
      isDeploying: false,
      currentDeployment: null,
      deploymentHistory: [],
      lastSyncAt: null,
      
      // GitHub Actions
      setGitHubConnection: (user, token) =>
        set({
          githubConnected: true,
          githubUser: user,
          githubToken: token,
        }),
      
      setSelectedRepository: (repository) =>
        set({ selectedRepository: repository }),
      
      clearGitHubConnection: () =>
        set({
          githubConnected: false,
          githubUser: null,
          githubToken: null,
          selectedRepository: null,
        }),
      
      // Vercel Actions
      setVercelConnection: (user, token) =>
        set({
          vercelConnected: true,
          vercelUser: user,
          vercelToken: token,
        }),
      
      setVercelProject: (project) =>
        set({ vercelProject: project }),
      
      clearVercelConnection: () =>
        set({
          vercelConnected: false,
          vercelUser: null,
          vercelToken: null,
          vercelProject: null,
        }),
      
      // Deployment Actions
      setDeploymentState: (isDeploying) =>
        set({ isDeploying }),
      
      setCurrentDeployment: (deployment) =>
        set({ currentDeployment: deployment }),
      
      addDeploymentToHistory: (deployment) =>
        set((state) => ({
          deploymentHistory: [deployment, ...state.deploymentHistory].slice(0, 10), // Keep last 10
        })),
      
      updateLastSync: () =>
        set({ lastSyncAt: new Date().toISOString() }),
      
      // Computed getters
      isReadyToDeploy: () => {
        const state = get();
        return !!(
          state.githubConnected &&
          state.selectedRepository &&
          state.vercelConnected &&
          state.vercelProject &&
          !state.isDeploying
        );
      },
      
      canConnectVercel: () => {
        const state = get();
        return !!(state.githubConnected && state.selectedRepository);
      },
    }),
    {
      name: 'deployment-store',
      // Only persist non-sensitive data
      partialize: (state) => ({
        githubConnected: state.githubConnected,
        githubUser: state.githubUser,
        selectedRepository: state.selectedRepository,
        vercelConnected: state.vercelConnected,
        vercelUser: state.vercelUser,
        vercelProject: state.vercelProject,
        deploymentHistory: state.deploymentHistory,
        lastSyncAt: state.lastSyncAt,
        // Don't persist tokens - they'll be stored in services
      }),
    }
  )
);