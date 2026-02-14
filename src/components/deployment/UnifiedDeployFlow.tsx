import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '../ui/badge';
import { ArrowRight, Github, Zap, Globe, CheckCircle, AlertCircle, Loader2, Upload, ExternalLink } from 'lucide-react';
import GitHubConnect from './GitHubConnect';
import UnifiedDeployButton from './UnifiedDeployButton';
import { useProjectStore } from '@/store/projectStore';
import type { GitHubRepository } from '@/services/GitHubService';
import type { VercelProject } from '@/services/VercelService';

interface UnifiedDeployFlowProps {
  className?: string;
}

export default function UnifiedDeployFlow({ className }: UnifiedDeployFlowProps) {
  const [deploymentStep, setDeploymentStep] = useState<'github' | 'vercel' | 'deploy' | 'complete'>('github');
  const { currentProject } = useProjectStore();

  // Determine current step based on connections
  useEffect(() => {
    if (!currentProject?.githubConnection && !currentProject?.vercelConnection) {
      setDeploymentStep('github');
    } else if (currentProject?.githubConnection && !currentProject?.vercelConnection) {
      setDeploymentStep('deploy'); // Skip direct Vercel setup, go to unified deploy
    } else if (currentProject?.githubConnection && currentProject?.vercelConnection) {
      setDeploymentStep('complete');
    }
  }, [currentProject?.githubConnection, currentProject?.vercelConnection]);

  const handleGitHubRepoSelected = (_repo: GitHubRepository) => {
    if (deploymentStep === 'github') {
      setDeploymentStep('deploy'); // Go to unified deploy step
    }
  };

  const handleDeploymentComplete = (_project: VercelProject) => {
    setDeploymentStep('complete');
  };

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'github':
        return currentProject?.githubConnection ? 'completed' : deploymentStep === 'github' ? 'active' : 'pending';
      case 'deploy':
        return currentProject?.vercelConnection ? 'completed' : deploymentStep === 'deploy' ? 'active' : 'pending';
      case 'complete':
        return (currentProject?.githubConnection && currentProject?.vercelConnection) ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStepIcon = (step: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status === 'active') {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
    }
    
    switch (step) {
      case 'github':
        return <Github className="w-5 h-5 text-muted-foreground" />;
      case 'deploy':
        return <Zap className="w-5 h-5 text-muted-foreground" />;
      case 'complete':
        return <Globe className="w-5 h-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const isFlowComplete = currentProject?.githubConnection && currentProject?.vercelConnection;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Flow Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Pipeline publikování
          </CardTitle>
          <CardDescription>
            Nastavte kompletní deployment pipeline: Projekt → GitHub → Vercel → Live Web
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Step 1: GitHub */}
            <div className="flex flex-col items-center space-y-2">
              {getStepIcon('github', getStepStatus('github'))}
              <span className={`text-sm font-medium ${
                getStepStatus('github') === 'completed' ? 'text-green-600' :
                getStepStatus('github') === 'active' ? 'text-blue-600' :
                'text-muted-foreground'
              }`}>
                GitHub
              </span>
              {currentProject?.githubConnection && (
                <Badge className="text-xs bg-green-100 text-green-800">
                  Připojeno
                </Badge>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />

            {/* Step 2: Deploy */}
            <div className="flex flex-col items-center space-y-2">
              {getStepIcon('deploy', getStepStatus('deploy'))}
              <span className={`text-sm font-medium ${
                getStepStatus('deploy') === 'completed' ? 'text-green-600' :
                getStepStatus('deploy') === 'active' ? 'text-blue-600' :
                'text-muted-foreground'
              }`}>
                Deploy
              </span>
              {currentProject?.vercelConnection && (
                <Badge className="text-xs bg-green-100 text-green-800">
                  Nasazeno
                </Badge>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />

            {/* Step 3: Live */}
            <div className="flex flex-col items-center space-y-2">
              {getStepIcon('complete', getStepStatus('complete'))}
              <span className={`text-sm font-medium ${
                getStepStatus('complete') === 'completed' ? 'text-green-600' :
                'text-muted-foreground'
              }`}>
                Živá stránka
              </span>
              {isFlowComplete && (
                <div className="flex flex-col items-center gap-1">
                  <Badge className="text-xs bg-green-100 text-green-800">
                    Aktivní
                  </Badge>
                  {currentProject?.vercelConnection?.productionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(currentProject.vercelConnection!.productionUrl!, '_blank')}
                      className="text-xs p-1 h-auto"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Otevřít
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flow Summary */}
          {isFlowComplete && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Deployment pipeline je aktivní!
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Každá změna nahraná na GitHub se automaticky deployuje na Vercel.
                Použijte tlačítko "Nahrát změny na GitHub" výše pro upload změn.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Content */}
      {deploymentStep === 'github' || !currentProject?.githubConnection ? (
        <GitHubConnect 
          onRepositorySelected={handleGitHubRepoSelected}
          className="w-full"
        />
      ) : null}

      {deploymentStep === 'deploy' && currentProject?.githubConnection && (
        <UnifiedDeployButton
          githubRepo={{
            id: currentProject.githubConnection.repositoryId,
            owner: { login: currentProject.githubConnection.repoOwner, avatar_url: '' },
            name: currentProject.githubConnection.repoName,
            full_name: `${currentProject.githubConnection.repoOwner}/${currentProject.githubConnection.repoName}`,
            description: '',
            private: false,
            html_url: `https://github.com/${currentProject.githubConnection.repoOwner}/${currentProject.githubConnection.repoName}`,
            clone_url: '',
            updated_at: '',
            default_branch: 'main'
          }}
          onDeploymentComplete={handleDeploymentComplete}
          className="w-full"
        />
      )}

      {/* Help Section */}
      {!isFlowComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Jak to funguje?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Připojte GitHub repository</p>
                <p className="text-sm text-muted-foreground">
                  Vyberte nebo vytvořte GitHub repository, kam se budou nahrávat vaše soubory.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Připojte Vercel projekt</p>
                <p className="text-sm text-muted-foreground">
                  Vercel automaticky vytvoří projekt připojený k vašemu GitHub repository.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Automatické publikování</p>
                <p className="text-sm text-muted-foreground">
                  Každý commit na GitHub se automaticky publikuje na Vercel a vaše stránka je hned živá!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}