import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { RefreshCw, ExternalLink, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { vercelService } from '@/services/VercelService';
import { useProjectStore } from '@/store/projectStore';
import type { VercelDeployment } from '@/services/VercelService';

export default function DeploymentStatus() {
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentProject } = useProjectStore();

  const fetchDeployments = useCallback(async () => {
    if (!currentProject?.vercelConnection?.projectId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectDeployments = await vercelService.getProjectDeployments(
        currentProject.vercelConnection.projectId
      );
      setDeployments(projectDeployments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployments');
    } finally {
      setLoading(false);
    }
  }, [currentProject?.vercelConnection?.projectId]);

  useEffect(() => {
    fetchDeployments();
    
    // Refresh deployments every 30 seconds
    const interval = setInterval(fetchDeployments, 30000);
    
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  const getStatusIcon = (state: VercelDeployment['state']) => {
    switch (state) {
      case 'READY':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'BUILDING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (state: VercelDeployment['state']) => {
    switch (state) {
      case 'READY':
        return 'success';
      case 'ERROR':
        return 'destructive';
      case 'BUILDING':
        return 'default';
      case 'CANCELED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!currentProject?.vercelConnection) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deployment Status</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchDeployments}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-500 mb-4">
            {error}
          </div>
        )}

        {deployments.length === 0 && !loading && !error && (
          <div className="text-sm text-gray-500">
            No deployments found
          </div>
        )}

        <div className="space-y-3">
          {deployments.map((deployment) => (
            <div
              key={deployment.uid}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(deployment.state)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{deployment.name}</span>
                    <Badge variant={getStatusColor(deployment.state) as any}>
                      {deployment.state}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(deployment.createdAt)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {deployment.target}
                </Badge>
                <a
                  href={`https://${deployment.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}