import UnifiedDeployFlow from './deployment/UnifiedDeployFlow'
import DeploymentStatus from './deployment/DeploymentStatus'

interface DeploymentPanelProps {
  projectId: string
}

export default function DeploymentPanel({}: DeploymentPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <UnifiedDeployFlow />
        <DeploymentStatus />
      </div>
    </div>
  )
}