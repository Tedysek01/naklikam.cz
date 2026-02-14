import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Github, 
  Zap, 
  Globe, 
  CheckCircle, 
  Loader2, 
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { vercelService } from '@/services/VercelService';
import { githubService } from '@/services/GitHubService';
import { useProjectStore } from '@/store/projectStore';
import type { GitHubRepository } from '@/services/GitHubService';
import type { VercelProject, VercelDeployment } from '@/services/VercelService';

interface DeploymentStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

interface UnifiedDeployButtonProps {
  githubRepo: GitHubRepository;
  onDeploymentComplete?: (project: VercelProject, deployment?: VercelDeployment) => void;
  className?: string;
}

export default function UnifiedDeployButton({ 
  githubRepo, 
  onDeploymentComplete,
  className 
}: UnifiedDeployButtonProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);
  const [finalResult, setFinalResult] = useState<{
    project?: VercelProject;
    deployment?: VercelDeployment;
    liveUrl?: string;
    error?: string;
  } | null>(null);

  const { currentProject, updateProject } = useProjectStore();

  const updateStep = (stepId: string, status: DeploymentStep['status'], message?: string) => {
    setDeploymentSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const initializeSteps = (): DeploymentStep[] => [
    {
      id: 'github-push',
      title: 'Nahrání na GitHub',
      icon: <Github className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'vercel-project',
      title: 'Vytvoření Vercel projektu',
      icon: <Zap className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'initial-deploy',
      title: 'Spuštění prvního deploye',
      icon: <Rocket className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'build',
      title: 'Build projektu',
      icon: <Loader2 className="w-4 h-4" />,
      status: 'pending'
    },
    {
      id: 'live',
      title: 'Publikování na web',
      icon: <Globe className="w-4 h-4" />,
      status: 'pending'
    }
  ];

  const handleDeploy = async () => {
    if (!currentProject) return;

    setIsDeploying(true);
    setFinalResult(null);
    const steps = initializeSteps();
    setDeploymentSteps(steps);

    try {
      // Step 1: Push to GitHub
      updateStep('github-push', 'running', 'Nahrávání souborů...');
      
      await githubService.syncProjectToGitHub(
        githubRepo,
        currentProject.files,
        'Deploy project files'
      );
      
      updateStep('github-push', 'completed', 'Soubory úspěšně nahrány');

      // Step 2: Create Vercel project with GitHub integration
      updateStep('vercel-project', 'running', 'Vytváření projektu...');
      
      const result = await vercelService.createProjectWithGitHub(
        currentProject.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        {
          owner: githubRepo.owner?.login || '',
          name: githubRepo.name,
          branch: 'main'
        },
        {
          triggerInitialDeploy: true
        }
      );

      updateStep('vercel-project', 'completed', 'Projekt vytvořen');

      // Step 3: Initial deployment triggered
      if (result.deployment) {
        updateStep('initial-deploy', 'completed', 'Deploy spuštěn');
        updateStep('build', 'running', 'Projekt se builduje...');

        // Wait for deployment to complete
        const finalDeployment = await vercelService.waitForDeployment(result.deployment.uid);
        
        if (finalDeployment.state === 'READY') {
          updateStep('build', 'completed', 'Build dokončen');
          updateStep('live', 'completed', 'Projekt je live!');
          
          const liveUrl = `https://${finalDeployment.url}`;
          
          setFinalResult({
            project: result.project,
            deployment: finalDeployment,
            liveUrl
          });

          // Update project with Vercel connection
          await updateProject(currentProject.id, {
            vercelConnection: {
              projectId: result.project.id,
              projectName: result.project.name,
              productionUrl: liveUrl,
              connected: true
            }
          });

          onDeploymentComplete?.(result.project, finalDeployment);
        } else {
          throw new Error(`Deployment failed with state: ${finalDeployment.state}`);
        }
      } else {
        updateStep('initial-deploy', 'error', 'Deploy se nepodařilo spustit');
        throw new Error('Failed to create initial deployment');
      }

    } catch (error) {
      console.error('Deployment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Neznámá chyba';
      
      // Mark current step as error
      const currentStepId = deploymentSteps.find(s => s.status === 'running')?.id;
      if (currentStepId) {
        updateStep(currentStepId, 'error', errorMessage);
      }
      
      setFinalResult({ error: errorMessage });
    } finally {
      setIsDeploying(false);
    }
  };

  const getStepIcon = (step: DeploymentStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return step.icon;
    }
  };

  const getStepColor = (step: DeploymentStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  if (deploymentSteps.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Button
              size="lg"
              onClick={handleDeploy}
              disabled={isDeploying}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Deploy Project to Web
            </Button>
            <p className="text-sm text-gray-600">
              Jeden klik pro nahrání na GitHub a publikování na Vercel
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Progress Steps */}
        <div className="space-y-4 mb-6">
          {deploymentSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`flex-shrink-0 ${getStepColor(step)}`}>
                {getStepIcon(step)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getStepColor(step)}`}>
                    {step.title}
                  </span>
                  <Badge 
                    variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'running' ? 'secondary' :
                      step.status === 'error' ? 'destructive' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {step.status === 'pending' ? 'Čekání' :
                     step.status === 'running' ? 'Probíhá' :
                     step.status === 'completed' ? 'Hotovo' :
                     'Chyba'}
                  </Badge>
                </div>
                {step.message && (
                  <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Final Result */}
        {finalResult && (
          <div className="border-t pt-6">
            {finalResult.error ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-800">
                      Deployment se nezdařil
                    </span>
                  </div>
                  <p className="text-sm text-red-700">{finalResult.error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeploymentSteps([]);
                    setFinalResult(null);
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Zkusit znovu
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-800">
                      🎉 Deployment úspěšný!
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Váš projekt je nyní živý na webu
                  </p>
                  {finalResult.liveUrl && (
                    <Button
                      onClick={() => window.open(finalResult.liveUrl, '_blank')}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Zobrazit live web
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}