import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'

import { Github, GitBranch, Calendar, ExternalLink, AlertCircle, Plus, Loader2, Upload, CheckCircle, Link, Unlink } from 'lucide-react';
import GitHubService, { githubService, type GitHubUser, type GitHubRepository } from '@/services/GitHubService';
import { useToast } from '@/hooks/use-toast';
import { useProjectStore } from '@/store/projectStore';
import type { ProjectFile, GitHubConnection } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { canAccessDeployment } from '@/utils/subscriptionUtils';
import { projectService } from '@/services/firebaseService';

interface GitHubConnectProps {
  onRepositorySelected?: (repository: GitHubRepository) => void;
  className?: string;
}

export default function GitHubConnect({ onRepositorySelected, className }: GitHubConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [isNewRepoPrivate, setIsNewRepoPrivate] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRepoList, setShowRepoList] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isCheckingChanges, setIsCheckingChanges] = useState(false);
  const { toast } = useToast();
  const { currentProject } = useProjectStore();
  const { user: authUser } = useAuthStore();

  useEffect(() => {
    checkConnection();
    handleOAuthCallback();
  }, []);

  // Check for changes when project or selected repo changes
  useEffect(() => {
    if (selectedRepo && currentProject?.files?.length) {
      checkForChanges();
    }
  }, [selectedRepo, currentProject?.files, currentProject?.githubConnection?.lastSyncHash]);

  const checkConnection = async () => {
    if (githubService.isConnected()) {
      setIsLoading(true);
      try {
        const userData = await githubService.getCurrentUser();
        setUser(userData);
        setIsConnected(true);
        await loadRepositories();
      } catch (error) {
        console.error('Failed to check GitHub connection:', error);
        githubService.clearToken();
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOAuthCallback = () => {
    const { token, user: username, error } = GitHubService.parseOAuthCallback();
    
    if (error) {
      toast({
        title: "GitHub Connection Failed",
        description: error,
        variant: "destructive",
      });
      GitHubService.cleanOAuthParams();
      return;
    }

    if (token) {
      githubService.setToken(token);
      toast({
        title: "GitHub Connected!",
        description: `Successfully connected as ${username}`,
      });
      GitHubService.cleanOAuthParams();
      checkConnection();
    }
  };

  const loadRepositories = async () => {
    try {
      const repos = await githubService.getRepositories();
      setRepositories(repos);
      
      // Check if current project has a connected repository after loading repos
      if (currentProject?.githubConnection && !selectedRepo) {
        const connectedRepo = repos.find(
          repo => repo.id === currentProject.githubConnection?.repositoryId
        );
        if (connectedRepo) {
          setSelectedRepo(connectedRepo);
        }
      }
    } catch (error) {
      console.error('Failed to load repositories:', error);
      toast({
        title: "Failed to load repositories",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await githubService.startOAuthFlow();
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to GitHub. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };


  const checkForChanges = async () => {
    if (!selectedRepo || !currentProject?.files?.length) return;

    setIsCheckingChanges(true);
    try {
      const filesToCheck = currentProject.files
        .filter(file => !file.isDirectory && file.content)
        .map((file: ProjectFile) => ({
          path: file.path,
          content: file.content,
          name: file.name
        }));

      const { hasChanges: changesDetected } = await githubService.hasChanges(
        selectedRepo,
        filesToCheck,
        currentProject.githubConnection?.lastSyncHash
      );

      setHasChanges(changesDetected);
    } catch (error) {
      console.error('Error checking for changes:', error);
      setHasChanges(true); // Assume changes if we can't check
    } finally {
      setIsCheckingChanges(false);
    }
  };

  const handleRepositorySelect = async (repo: GitHubRepository) => {
    setSelectedRepo(repo);
    setShowRepoList(false);
    setShowCreateForm(false);
    
    // Save GitHub connection to project
    if (currentProject) {
      const connection: GitHubConnection = {
        repositoryId: repo.id,
        repositoryName: repo.name,
        repositoryFullName: repo.full_name,
        repoOwner: repo.owner?.login || '',
        repoName: repo.name,
        autoSync: false
      };
      
      try {
        await projectService.connectGitHubRepository(currentProject.id, connection);
        toast({
          title: "Repository Connected",
          description: `Connected to ${repo.full_name}`,
        });
      } catch (error) {
        console.error('Failed to save GitHub connection:', error);
        toast({
          title: "Connection saved locally",
          description: `Using ${repo.full_name} for this session`,
        });
      }
    }
    
    onRepositorySelected?.(repo);
  };

  const handleCreateRepository = async () => {
    if (!newRepoName.trim()) {
      toast({
        title: "Repository name required",
        description: "Please enter a name for the new repository",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingRepo(true);
    try {
      const newRepo = await githubService.createRepository(
        newRepoName.trim(),
        newRepoDescription.trim() || undefined,
        isNewRepoPrivate
      );

      // Refresh repositories list
      await loadRepositories();

      // Select the newly created repository
      handleRepositorySelect(newRepo);

      // Reset form
      setNewRepoName('');
      setNewRepoDescription('');
      setIsNewRepoPrivate(false);
      setShowCreateForm(false);

      toast({
        title: "Repository Created!",
        description: `Successfully created ${newRepo.full_name}`,
      });
    } catch (error) {
      console.error('Failed to create repository:', error);
      toast({
        title: "Failed to create repository",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRepo(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSyncToGitHub = async () => {
    if (!selectedRepo || !currentProject?.files?.length) return;

    setIsSyncing(true);
    try {
      const filesToSync = currentProject.files
        .filter(file => !file.isDirectory && file.content)
        .map((file: ProjectFile) => ({
          path: file.path,
          content: file.content,
          name: file.name
        }));

      // Generate new hash before syncing
      const newHash = githubService.generateContentHash(filesToSync);

      await githubService.syncProjectToGitHub(
        selectedRepo,
        filesToSync,
        'Updated from Naklikam.cz'
      );

      // Update last sync hash in Firebase
      if (currentProject) {
        await projectService.updateLastSync(currentProject.id, newHash);
      }

      setHasChanges(false);
      toast({
        title: "Success!",
        description: `Project synced to ${selectedRepo.full_name}`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync project",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectRepository = async () => {
    if (!currentProject) return;

    try {
      await projectService.disconnectGitHub(currentProject.id);
      setSelectedRepo(null);
      setHasChanges(false);
      toast({
        title: "Repository Disconnected",
        description: "GitHub repository has been disconnected from this project",
      });
    } catch (error) {
      console.error('Failed to disconnect repository:', error);
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect repository",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Connect GitHub
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to sync your projects and enable deployment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              "Connecting..."
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                Connect with GitHub
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connected State - Show selected repo or selection prompt */}
      {selectedRepo ? (
        // Repository Selected State
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Repository
                {currentProject?.githubConnection && (
                  <Link className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowRepoList(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Change
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDisconnectRepository}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Unlink className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedRepo.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRepo.private ? 'Private' : 'Public'} • Updated {formatDate(selectedRepo.updated_at)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Status and Upload Section */}
            <div className="space-y-3">
              {isCheckingChanges ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Checking for changes...</span>
                </div>
              ) : currentProject?.files && currentProject.files.length > 0 ? (
                <>
                  {/* Changes Status */}
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    hasChanges 
                      ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/30' 
                      : 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                  }`}>
                    {hasChanges ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm text-orange-700 dark:text-orange-300">
                          Máte nové změny k nahrání
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Žádné nové změny
                        </span>
                      </>
                    )}
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleSyncToGitHub}
                    disabled={isSyncing || (!hasChanges && !isSyncing)}
                    className="w-full flex items-center justify-center gap-2"
                    variant={hasChanges ? "default" : "outline"}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Nahrávám {currentProject.files.filter(f => !f.isDirectory).length} souborů...
                      </>
                    ) : hasChanges ? (
                      <>
                        <Upload className="w-4 h-4" />
                        Nahrát změny na GitHub
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Vše je synchronizováno
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                  <p className="text-sm">Žádné soubory v projektu</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-2 border-t">
              <a 
                href={selectedRepo.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View on GitHub
              </a>
              {user && (
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <img 
                    src={user.avatar_url} 
                    alt={user.login}
                    className="w-5 h-5 rounded-full"
                  />
                  {user.login}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // No Repository Selected State
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Repository
            </CardTitle>
            <CardDescription>
              Select a repository to sync your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowRepoList(true)}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <GitBranch className="w-4 h-4" />
              Select Repository
            </Button>
            
            {user && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <img 
                  src={user.avatar_url} 
                  alt={user.login}
                  className="w-5 h-5 rounded-full"
                />
                Connected as {user.login}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Repository Selection Modal/Dropdown */}
      {showRepoList && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Select Repository
              </div>
              <div className="flex items-center gap-2">
                {canAccessDeployment(authUser) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRepoList(false);
                    setShowCreateForm(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
          {/* Create New Repository Form */}
          {showCreateForm && canAccessDeployment(authUser) && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Repository
              </h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="repo-name" className="block text-sm font-medium mb-1">
                    Repository Name *
                  </label>
                  <Input
                    id="repo-name"
                    type="text"
                    placeholder="my-awesome-project"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    disabled={isCreatingRepo}
                  />
                </div>
                <div>
                  <label htmlFor="repo-description" className="block text-sm font-medium mb-1">
                    Description (optional)
                  </label>
                  <Textarea
                    id="repo-description"
                    placeholder="A brief description of your project"
                    value={newRepoDescription}
                    onChange={(e) => setNewRepoDescription(e.target.value)}
                    disabled={isCreatingRepo}
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="repo-private"
                    checked={isNewRepoPrivate}
                    onCheckedChange={(checked) => setIsNewRepoPrivate(checked as boolean)}
                    disabled={isCreatingRepo}
                  />
                  <label
                    htmlFor="repo-private"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Make repository private
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateRepository}
                    disabled={isCreatingRepo || !newRepoName.trim()}
                    className="flex items-center gap-2"
                  >
                    {isCreatingRepo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {isCreatingRepo ? 'Creating...' : 'Create Repository'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewRepoName('');
                      setNewRepoDescription('');
                      setIsNewRepoPrivate(false);
                    }}
                    disabled={isCreatingRepo}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {repositories.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No repositories found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={loadRepositories}
              >
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedRepo?.id === repo.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleRepositorySelect(repo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{repo.name}</p>
                        <Badge className="text-xs">
                          {repo.private ? "Private" : "Public"}
                        </Badge>
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Updated {formatDate(repo.updated_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {repo.default_branch}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 opacity-0 group-hover:opacity-100"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        window.open(repo.html_url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}