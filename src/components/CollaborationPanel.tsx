import { useState } from 'react'
import { Input } from './ui/Input'

// Inline UI Components
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' :
      variant === 'ghost' ? 'text-gray-700 hover:bg-gray-100' :
      'bg-naklikam-gradient text-white hover:bg-naklikam-gradient-dark'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)

const Card = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`} {...props}>
    {children}
  </div>
)

const CardContent = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`pt-0 ${className}`} {...props}>
    {children}
  </div>
)
import { useAuthStore } from '@/store/authStore'
import { 
  Users, 
  UserPlus, 
  Crown, 
  Mail,
  Trash2,
  Copy,
  CheckCircle
} from 'lucide-react'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'active' | 'invited'
}

interface CollaborationPanelProps {
  projectId: string
}

export default function CollaborationPanel({ projectId }: CollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      role: 'owner',
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      role: 'editor',
      status: 'active'
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      role: 'viewer',
      status: 'invited'
    }
  ])
  
  const [inviteEmail, setInviteEmail] = useState('')
  const [shareUrl] = useState(`https://lovable-clone.com/project/${projectId}`)
  const [copied, setCopied] = useState(false)
  const { user } = useAuthStore()

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteEmail}`,
      role: 'editor',
      status: 'invited'
    }

    setCollaborators(prev => [...prev, newCollaborator])
    setInviteEmail('')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const removeCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />
      default:
        return null
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-600 bg-yellow-50'
      case 'editor':
        return 'text-purple-600 bg-purple-50'
      case 'viewer':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <h3 className="font-semibold font-display flex items-center mb-4">
          <Users className="h-5 w-5 mr-2 text-purple-600" />
          Collaboration
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Share Project Link
            </label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleInvite}>
            <label className="block text-sm font-medium mb-2">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="text-sm"
              />
              <Button type="submit" size="sm">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {collaborators.map((collaborator) => (
            <Card key={collaborator.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={collaborator.avatar}
                      alt={collaborator.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">
                          {collaborator.name}
                          {collaborator.id === user?.id && ' (You)'}
                        </p>
                        {getRoleIcon(collaborator.role)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {collaborator.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(
                        collaborator.role
                      )}`}
                    >
                      {collaborator.role}
                    </span>
                    
                    {collaborator.status === 'invited' && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        <Mail className="h-3 w-3 inline mr-1" />
                        Invited
                      </span>
                    )}

                    {collaborator.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(collaborator.id)}
                        className="p-1 h-auto text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {collaborators.length === 1 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold font-display mb-2">Start collaborating</h3>
            <p className="text-muted-foreground mb-4">
              Invite team members to work on this project together
            </p>
          </div>
        )}
      </div>
    </div>
  )
}