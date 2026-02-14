export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
  public_repos: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  updated_at: string;
  default_branch: string;
  owner?: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  content?: string;
  download_url: string;
}

class GitHubService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('github_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('github_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('github_token');
  }

  isConnected(): boolean {
    return !!this.getToken();
  }

  private getHeaders() {
    const token = this.getToken();
    if (!token) {
      throw new Error('GitHub token not found. Please connect your GitHub account.');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async startOAuthFlow(): Promise<void> {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('github_oauth_state', state);
    window.location.href = `/api/auth/github?state=${state}`;
  }

  async getCurrentUser(): Promise<GitHubUser> {
    const response = await fetch(`/api/github/user`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  }

  async getRepositories(): Promise<GitHubRepository[]> {
    const response = await fetch(`/api/github/repos`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get repositories: ${response.statusText}`);
    }

    return response.json();
  }

  async createRepository(name: string, description?: string, isPrivate?: boolean): Promise<GitHubRepository> {
    const response = await fetch(`/api/github/repos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        description,
        private: isPrivate || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to create repository: ${response.statusText}`);
    }

    return response.json();
  }

  async updateFile(
    owner: string,
    repo: string,
    filePath: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<GitHubFileContent> {
    // First, get the current file to get its SHA if not provided
    if (!sha) {
      try {
        const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers: this.getHeaders(),
        });
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          sha = fileData.sha;
        }
      } catch (error) {
        // File might not exist, that's ok
      }
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        content: btoa(unescape(encodeURIComponent(content))), // Handle Unicode characters
        message,
        ...(sha && { sha }), // Only include SHA if we have it
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update file: ${response.statusText}`);
    }

    const result = await response.json();
    return result.content;
  }

  async commitMultipleFiles(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    message: string
  ): Promise<void> {
    console.log(`Creating atomic commit with ${files.length} files`);
    
    let isEmptyRepo = false;
    
    try {
      // 1. Check if main branch exists (for empty repos)
      const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
        headers: this.getHeaders(),
      });
      
      let currentCommitSha: string | null = null;
      let currentTreeSha: string | null = null;
      
      if (branchResponse.ok) {
        // Existing repo with main branch
        const branchData = await branchResponse.json();
        currentCommitSha = branchData.object.sha;
        
        // 2. Get the current tree
        const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${currentCommitSha}`, {
          headers: this.getHeaders(),
        });
        
        if (!commitResponse.ok) {
          throw new Error('Failed to get current commit');
        }
        
        const commitData = await commitResponse.json();
        currentTreeSha = commitData.tree.sha;
      } else if (branchResponse.status === 404) {
        // Empty repo - main branch doesn't exist yet
        console.log('Empty repository detected - creating initial commit');
        isEmptyRepo = true;
      } else {
        throw new Error(`Failed to check branch: ${branchResponse.status}`);
      }
      
      // 3. Create blobs for all files
      const blobs = await Promise.all(
        files.map(async (file) => {
          console.log(`Creating blob for: ${file.path}`);
          
          // Try UTF-8 encoding first for text files, then base64 if needed
          let contentPayload;
          try {
            // For most text files, GitHub accepts UTF-8 directly
            contentPayload = {
              content: file.content,
              encoding: 'utf-8'
            };
          } catch (error) {
            // Fallback to base64 for binary files
            contentPayload = {
              content: btoa(unescape(encodeURIComponent(file.content))),
              encoding: 'base64'
            };
          }
          
          const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(contentPayload)
          });
          
          if (!blobResponse.ok) {
            const errorText = await blobResponse.text();
            console.error(`Blob creation failed for ${file.path}:`, errorText);
            throw new Error(`Failed to create blob for ${file.path}: ${blobResponse.status} ${errorText}`);
          }
          
          const blobData = await blobResponse.json();
          console.log(`✅ Created blob for ${file.path}: ${blobData.sha}`);
          
          return {
            path: file.path,
            mode: '100644',
            type: 'blob' as const,
            sha: blobData.sha
          };
        })
      );
      
      // 4. Create new tree
      const treePayload = isEmptyRepo ? {
        tree: blobs  // No base_tree for empty repo
      } : {
        base_tree: currentTreeSha,
        tree: blobs
      };
      
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(treePayload)
      });
      
      if (!treeResponse.ok) {
        throw new Error('Failed to create tree');
      }
      
      const treeData = await treeResponse.json();
      
      // 5. Create new commit
      const commitPayload = isEmptyRepo ? {
        message,
        tree: treeData.sha
        // No parents for initial commit
      } : {
        message,
        tree: treeData.sha,
        parents: [currentCommitSha]
      };
      
      const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(commitPayload)
      });
      
      if (!newCommitResponse.ok) {
        throw new Error('Failed to create commit');
      }
      
      const newCommitData = await newCommitResponse.json();
      
      // 6. Update or create the reference
      let updateRefResponse;
      
      if (isEmptyRepo) {
        // Create main branch for empty repo
        updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            ref: 'refs/heads/main',
            sha: newCommitData.sha
          })
        });
      } else {
        // Update existing main branch
        updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            sha: newCommitData.sha
          })
        });
      }
      
      if (!updateRefResponse.ok) {
        const errorText = await updateRefResponse.text();
        throw new Error(`Failed to ${isEmptyRepo ? 'create' : 'update'} reference: ${errorText}`);
      }
      
      console.log(`✅ Successfully created ${isEmptyRepo ? 'INITIAL' : 'atomic'} commit with ${files.length} files - SHA: ${newCommitData.sha}`);
      console.log(`🚀 This will trigger only ONE deployment on Vercel!`);
      
      if (isEmptyRepo) {
        console.log(`🎉 Repository initialized with main branch!`);
      }
      
    } catch (error) {
      console.error('Failed to create atomic commit:', error);
      
      // Check if this might be an empty repo issue and try fallback
      const errorMessage = (error as Error).message || String(error);
      const isLikelyEmptyRepo = isEmptyRepo || 
        errorMessage.includes('409') || 
        errorMessage.includes('Conflict') ||
        errorMessage.includes('Failed to create blob');
      
      if (isLikelyEmptyRepo) {
        console.log('Attempting fallback to file-by-file upload for potentially empty repository...');
        try {
          await this.uploadFilesOneByOne(owner, repo, files, message);
          return;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  }

  // Fallback method for empty repositories - uploads files one by one
  private async uploadFilesOneByOne(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    message: string
  ): Promise<void> {
    console.log(`Uploading ${files.length} files one by one to empty repository...`);
    
    for (const file of files) {
      try {
        console.log(`Uploading: ${file.path}`);
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message: `${message} - Add ${file.path}`,
            content: btoa(unescape(encodeURIComponent(file.content))),
            branch: 'main'
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to upload ${file.path}:`, errorText);
          throw new Error(`Failed to upload ${file.path}: ${response.status}`);
        }
        
        console.log(`✅ Uploaded: ${file.path}`);
      } catch (error) {
        console.error(`Error uploading ${file.path}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ Successfully uploaded all ${files.length} files to repository`);
    console.log(`⚠️ Note: This created ${files.length} separate commits instead of one atomic commit`);
  }

  // Helper method to sync project files to GitHub
  async syncProjectToGitHub(
    repository: GitHubRepository,
    projectFiles: Array<{ path: string; content: string; name: string }>,
    commitMessage: string
  ): Promise<void> {
    const [owner, repoName] = repository.full_name.split('/');
    
    console.log(`Syncing ${projectFiles.length} files to ${repository.full_name}`);

    const filesToSync = projectFiles.map(file => ({
      path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
      content: file.content,
    }));

    await this.commitMultipleFiles(owner, repoName, filesToSync, commitMessage);
  }

  // Parse OAuth callback parameters
  static parseOAuthCallback(): { token?: string; user?: string; error?: string } {
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      token: urlParams.get('github_token') || undefined,
      user: urlParams.get('github_user') || undefined,
      error: urlParams.get('error') || undefined,
    };
  }

  // Clean up OAuth parameters from URL
  static cleanOAuthParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('github_connected');
    url.searchParams.delete('github_token');
    url.searchParams.delete('github_user');
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url.toString());
  }

  // Generate hash for change detection
  generateContentHash(files: Array<{ path: string; content: string }>): string {
    const content = files
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(f => `${f.path}:${f.content}`)
      .join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Get repository contents for comparison
  async getRepositoryContents(owner: string, repo: string, path: string = ''): Promise<GitHubFileContent[]> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // Repository is empty
      }
      throw new Error(`Failed to get repository contents: ${response.statusText}`);
    }

    const contents = await response.json();
    return Array.isArray(contents) ? contents : [contents];
  }

  // Check if there are changes between project and GitHub repo
  async hasChanges(
    repository: GitHubRepository,
    projectFiles: Array<{ path: string; content: string; name: string }>,
    lastSyncHash?: string
  ): Promise<{ hasChanges: boolean; currentHash: string }> {
    const currentHash = this.generateContentHash(projectFiles);
    
    // If we have a last sync hash, compare with that
    if (lastSyncHash) {
      return {
        hasChanges: currentHash !== lastSyncHash,
        currentHash
      };
    }

    // If no last sync hash, check against repository
    try {
      const [owner, repoName] = repository.full_name.split('/');
      const repoContents = await this.getRepositoryContents(owner, repoName);
      
      // If repository is empty, there are changes
      if (repoContents.length === 0) {
        return { hasChanges: true, currentHash };
      }

      // Compare file structure (simplified comparison)
      const repoFiles = repoContents.filter(item => item.name && !item.name.startsWith('.'));
      const projectFileNames = projectFiles.map(f => f.name);
      
      const hasStructuralChanges = 
        repoFiles.length !== projectFiles.length ||
        repoFiles.some(rf => !projectFileNames.includes(rf.name));

      return {
        hasChanges: hasStructuralChanges,
        currentHash
      };
    } catch (error) {
      console.error('Error checking changes:', error);
      // If we can't check, assume there are changes
      return { hasChanges: true, currentHash };
    }
  }
}

export default GitHubService;
export const githubService = new GitHubService();