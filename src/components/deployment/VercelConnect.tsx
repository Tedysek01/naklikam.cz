import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Zap, ExternalLink, AlertCircle, Loader2, CheckCircle, Clock, XCircle, Key, Info } from 'lucide-react';
import { vercelService, type VercelUser, type VercelProject, type VercelDeployment } from '@/services/VercelService';
import { useToast } from '@/hooks/use-toast';
import type { GitHubRepository } from '@/services/GitHubService';
import { useProjectStore } from '@/store/projectStore';
import { projectService } from '@/services/firebaseService';
import type { VercelConnection } from '@/types';

interface VercelConnectProps {
  githubRepository?: GitHubRepository;
  onProjectCreated?: (project: VercelProject) => void;
  className?: string;
}

export default function VercelConnect({ githubRepository, onProjectCreated, className }: VercelConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<VercelUser | null>(null);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<VercelProject | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCheckingDeployment, setIsCheckingDeployment] = useState(false);
  const [currentDeployment, setCurrentDeployment] = useState<VercelDeployment | null>(null);
  const [patToken, setPatToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { currentProject } = useProjectStore();

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected && projects.length > 0 && githubRepository) {
      // Try to find existing project that matches the GitHub repo
      const matchingProject = projects.find(p => 
        p.gitRepository?.repo === `${githubRepository.owner?.login || githubRepository.full_name.split('/')[0]}/${githubRepository.name}`
      );
      if (matchingProject) {
        setSelectedProject(matchingProject);
        onProjectCreated?.(matchingProject);
      }
    }
  }, [projects, githubRepository, isConnected, onProjectCreated]);

  // Check for existing Vercel connection from current project
  useEffect(() => {
    if (currentProject?.vercelConnection && !selectedProject && projects.length > 0) {
      const connectedProject = projects.find(p => p.id === currentProject.vercelConnection?.projectId);
      if (connectedProject) {
        setSelectedProject(connectedProject);
        // Check deployment status if we have a deployment ID
        if (currentProject.vercelConnection.lastDeploymentId) {
          checkDeploymentStatus(currentProject.vercelConnection.lastDeploymentId);
        }
      }
    }
  }, [currentProject?.vercelConnection, projects, selectedProject]);

  const checkConnection = async () => {
    const connected = await vercelService.isConnected();
    if (connected) {
      setIsLoading(true);
      try {
        const userData = await vercelService.getCurrentUser();
        setUser(userData);
        setIsConnected(true);
        await loadProjects();
      } catch (error) {
        console.error('Failed to check Vercel connection:', error);
        await vercelService.clearToken();
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }
  };


  const loadProjects = async () => {
    try {
      const projectList = await vercelService.getProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "Nepodařilo se načíst projekty",
        description: "Zkuste to prosím později",
        variant: "destructive",
      });
    }
  };

  const checkDeploymentStatus = async (deploymentId: string) => {
    setIsCheckingDeployment(true);
    try {
      const deployment = await vercelService.getDeployment(deploymentId);
      setCurrentDeployment(deployment);
      
      // Update Firebase with latest deployment info
      if (currentProject) {
        await projectService.updateVercelDeployment(
          currentProject.id,
          deployment.uid,
          deployment.url,
          deployment.state
        );
      }
    } catch (error) {
      console.error('Failed to check deployment status:', error);
    } finally {
      setIsCheckingDeployment(false);
    }
  };

  const getDeploymentStatusIcon = (state: string) => {
    switch (state) {
      case 'BUILDING':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'READY':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDeploymentStatusText = (state: string) => {
    switch (state) {
      case 'BUILDING':
        return 'Staví se...';
      case 'READY':
        return 'Připraveno';
      case 'ERROR':
        return 'Chyba';
      case 'CANCELED':
        return 'Zrušeno';
      default:
        return 'Neznámý stav';
    }
  };

  const handleConnect = async () => {
    if (!patToken.trim()) {
      toast({
        title: "Token je požadován",
        description: "Prosím zadejte váš Vercel Personal Access Token",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      const userData = await vercelService.connectWithPAT(patToken);
      setUser(userData);
      setIsConnected(true);
      setPatToken(''); // Clear token from input
      await loadProjects();
      toast({
        title: "Vercel připojen!",
        description: `Úspěšně připojen jako ${userData.username || userData.email}`,
      });
    } catch (error) {
      console.error('Failed to connect with PAT:', error);
      toast({
        title: "Připojení selhalo",
        description: error instanceof Error ? error.message : "Nepodařilo se připojit k Vercelu. Zkontrolujte váš token.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDisconnect = async () => {
    await vercelService.clearToken();
    setIsConnected(false);
    setUser(null);
    setProjects([]);
    setSelectedProject(null);
    toast({
      title: "Vercel odpojen",
      description: "Úspěšně odpojeno od Vercelu",
    });
  };

  const handleCreateProject = async () => {
    if (!githubRepository) {
      toast({
        title: "GitHub repozitář je požadován",
        description: "Nejdříve prosím vyberte GitHub repozitář",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProject(true);
    try {
      const projectName = githubRepository.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const repoOwner = githubRepository.owner?.login || githubRepository.full_name.split('/')[0];
      
      const project = await vercelService.createProject(projectName, {
        type: 'github',
        repo: `${repoOwner}/${githubRepository.name}`,
      });

      setSelectedProject(project);
      onProjectCreated?.(project);
      
      // Save Vercel connection to Firebase
      if (currentProject) {
        const vercelConnection: VercelConnection = {
          projectId: project.id,
          projectName: project.name,
          productionUrl: project.targets?.production?.url || `https://${project.targets?.production?.domain}`,
          framework: project.framework,
          autoDeployOnPush: true,
          connected: true
        };
        
        await projectService.connectVercelProject(currentProject.id, vercelConnection);
      }
      
      await loadProjects(); // Refresh projects list

      toast({
        title: "Projekt vytvořen!",
        description: `Vercel projekt "${project.name}" byl vytvořen a připojen k vašemu GitHub repozitáři.`,
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Nepodařilo se vytvořit projekt",
        description: error instanceof Error ? error.message : "Zkuste to prosím později",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleProjectSelect = async (project: VercelProject) => {
    setSelectedProject(project);
    onProjectCreated?.(project);
    
    // Save Vercel connection to Firebase
    if (currentProject) {
      const vercelConnection: VercelConnection = {
        projectId: project.id,
        projectName: project.name,
        productionUrl: project.targets?.production?.url || `https://${project.targets?.production?.domain}`,
        framework: project.framework,
        autoDeployOnPush: true,
        connected: true
      };
      
      try {
        await projectService.connectVercelProject(currentProject.id, vercelConnection);
      } catch (error) {
        console.error('Failed to save Vercel connection:', error);
      }
    }
    
    toast({
      title: "Projekt vybrán",
      description: `Připojeno k ${project.name}`,
    });
  };


  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {!isConnected ? "Připojit Vercel" : "Vercel projekt"}
          </div>
          {isConnected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Odpojit
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {!isConnected 
            ? "Připojte svůj Vercel účet pomocí Personal Access Tokenu pro nasazení projektů."
            : githubRepository 
              ? `Připojte se k Vercel projektu pro ${githubRepository.full_name}`
              : "Nejdříve vyberte GitHub repozitář pro vytvoření nebo připojení Vercel projektu"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          // Connection Form
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Potřebujete Vercel Personal Access Token pro připojení. <a 
                  href="https://vercel.com/account/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Vytvořte si ho zde
                </a>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="pat-token">Personal Access Token</Label>
              <Input
                id="pat-token"
                type="password"
                placeholder="Zadejte váš Vercel Personal Access Token"
                value={patToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatToken(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && !isValidating) {
                    handleConnect();
                  }
                }}
              />
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isValidating || !patToken.trim() || isLoading}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ověřuji...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Připojit pomocí tokenu
                </>
              )}
            </Button>
          </>
        ) : (
          // Connected State
          <>
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img 
                  src={user.avatar} 
                  alt={user.name || user.username}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name || user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {projects.length} projektů
                  </p>
                </div>
              </div>
            )}

            {/* Project Content */}
            {!githubRepository ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nejdříve vyberte GitHub repozitář</p>
              </div>
            ) : selectedProject ? (
              // Selected Project
              <div className="p-4 border rounded-lg bg-primary/5 border-primary">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{selectedProject.name}</p>
                      <Badge className="text-primary border-primary">
                        {selectedProject.framework}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedProject.targets?.production?.domain || selectedProject.targets?.production?.url}
                    </p>
                    
                    {/* Deployment Status */}
                    {(currentDeployment || currentProject?.vercelConnection?.lastDeploymentState) && (
                      <div className="flex items-center gap-2 mt-2">
                        {getDeploymentStatusIcon(
                          currentDeployment?.state || currentProject?.vercelConnection?.lastDeploymentState || 'READY'
                        )}
                        <span className="text-sm">
                          {getDeploymentStatusText(
                            currentDeployment?.state || currentProject?.vercelConnection?.lastDeploymentState || 'READY'
                          )}
                        </span>
                        {isCheckingDeployment && (
                          <Loader2 className="w-3 h-3 animate-spin ml-1" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Refresh deployment status */}
                    {currentProject?.vercelConnection?.lastDeploymentId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => checkDeploymentStatus(currentProject.vercelConnection!.lastDeploymentId!)}
                        disabled={isCheckingDeployment}
                      >
                        <Loader2 className={`w-4 h-4 ${isCheckingDeployment ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    
                    {/* Open live site */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = currentDeployment?.url || 
                                  currentProject?.vercelConnection?.lastDeploymentUrl ||
                                  selectedProject.targets?.production?.url || 
                                  `https://${selectedProject.targets?.production?.domain}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Project Creation/Selection
              <>
                <Button 
                  onClick={handleCreateProject}
                  disabled={isCreatingProject}
                  className="w-full"
                >
                  {isCreatingProject ? (
                    "Vytvářím projekt..."
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Vytvořit nový Vercel projekt
                    </>
                  )}
                </Button>

                {projects.length > 0 && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Nebo vyberte existující
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {projects.slice(0, 5).map((project) => (
                        <div
                          key={project.id}
                          className="p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => handleProjectSelect(project)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{project.name}</p>
                                <Badge className="text-xs">
                                  {project.framework}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {project.targets?.production?.domain}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}