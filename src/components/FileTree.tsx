import { useState, useMemo, Fragment } from 'react'
import { Input } from './ui/Input'
import { useAuthStore } from '@/store/authStore'
import { canViewCode } from '@/utils/subscriptionUtils'

// Inline UI Components
const Button = ({ children, onClick, className = '', variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${
      size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2'
    } ${
      variant === 'outline' ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' :
      variant === 'ghost' ? 'text-gray-700 hover:bg-gray-100' :
      'bg-blue-600 text-white hover:bg-blue-700'
    } ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
)
import { useProjectStore } from '@/store/projectStore'
import { ProjectFile } from '@/types'
import { 
  File, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus, 
  Trash2, 
  FileText,
  Code,
  Image,
  FileJson
} from 'lucide-react'

interface FileTreeProps {
  onFileSelect: (file: ProjectFile) => void
  selectedFileId?: string
}

interface TreeNode {
  file: ProjectFile
  children: TreeNode[]
  level: number
}

export default function FileTree({ onFileSelect, selectedFileId }: FileTreeProps) {
  const { user } = useAuthStore()
  const [showAddFile, setShowAddFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const { currentProject, addProjectFile, deleteProjectFile } = useProjectStore()

  // Build hierarchical tree structure
  const fileTree = useMemo(() => {
    if (!currentProject?.files) return []
    
    // Limit debugging to prevent spam
    if (Math.random() < 0.1) { // Only log 10% of renders
      console.log('[FileTree] Building tree from', currentProject.files.length, 'files:')
      console.log('[FileTree] Files:', currentProject.files.map(f => ({ path: f.path, name: f.name, isDir: f.isDirectory })))
    }
    
    const tree: TreeNode[] = []
    const pathMap = new Map<string, TreeNode>()
    const processedPaths = new Set<string>()
    
    // Sort files: directories first, then by name
    const sortedFiles = [...currentProject.files].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    
    for (const file of sortedFiles) {
      // Skip if we've already processed this exact file
      const fileKey = `${file.path}-${file.isDirectory ? 'dir' : 'file'}`
      if (processedPaths.has(fileKey)) {
        console.log('[FileTree] SKIPPING DUPLICATE:', fileKey)
        continue
      }
      processedPaths.add(fileKey)
      
      // Reduced logging
      if (Math.random() < 0.1) {
        console.log('[FileTree] Processing:', file.path, file.isDirectory ? '(directory)' : '(file)')
      }
      
      const pathParts = file.path.split('/').filter(Boolean)
      let currentLevel = tree
      let currentPath = ''
      
      for (let i = 0; i < pathParts.length; i++) {
        currentPath += '/' + pathParts[i]
        const isLastPart = i === pathParts.length - 1
        
        if (isLastPart) {
          // This is the actual file/folder
          const node: TreeNode = {
            file,
            children: [],
            level: i
          }
          currentLevel.push(node)
          pathMap.set(file.path, node)
          // Minimal logging
          if (Math.random() < 0.05) {
            console.log('[FileTree] Added node:', currentPath, 'at level', i)
          }
        } else {
          // This is a parent directory - find or create it
          const existingDir = currentLevel.find(node => 
            node.file.path === currentPath && node.file.isDirectory
          )
          
          if (existingDir) {
            currentLevel = existingDir.children
            if (Math.random() < 0.05) {
              console.log('[FileTree] Using existing directory:', currentPath)
            }
          } else {
            // Directory should exist in files array
            const dirFile = sortedFiles.find(f => f.path === currentPath && f.isDirectory)
            if (dirFile && !pathMap.has(dirFile.path)) {
              const dirNode: TreeNode = {
                file: dirFile,
                children: [],
                level: i
              }
              currentLevel.push(dirNode)
              pathMap.set(dirFile.path, dirNode)
              currentLevel = dirNode.children
              if (Math.random() < 0.05) {
                console.log('[FileTree] Created directory node:', currentPath)
              }
            }
          }
        }
      }
    }
    
    // Final stats (limited logging)
    if (Math.random() < 0.05) {
      console.log('[FileTree] Final tree structure:', tree.length, 'root nodes')
      console.log('[FileTree] PathMap size:', pathMap.size)
    }
    
    return tree
  }, [currentProject?.files]) // Watch the files array directly

  const getFileIcon = (fileName: string, isDirectory: boolean, isExpanded?: boolean) => {
    if (isDirectory) {
      return isExpanded ? <FolderOpen className="h-4 w-4 text-blue-600" /> : <Folder className="h-4 w-4 text-blue-600" />
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx':
      case 'jsx':
      case 'ts':
      case 'js':
        return <Code className="h-4 w-4 text-blue-500" />
      case 'json':
        return <FileJson className="h-4 w-4 text-yellow-500" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image className="h-4 w-4 text-purple-500" />
      case 'md':
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const isImageFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')
  }

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath)
      } else {
        newSet.add(folderPath)
      }
      return newSet
    })
  }

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'typescript'
      case 'ts':
        return 'typescript'
      case 'js':
        return 'javascript'
      case 'json':
        return 'json'
      case 'css':
        return 'css'
      case 'html':
        return 'html'
      case 'md':
        return 'markdown'
      default:
        return 'plaintext'
    }
  }

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileName.trim()) return

    const newFile: Omit<ProjectFile, 'id'> = {
      name: newFileName.includes('/') ? newFileName.split('/').pop() || newFileName : newFileName,
      path: newFileName.startsWith('/') ? newFileName : `/${newFileName}`,
      content: '',
      language: getLanguageFromFileName(newFileName),
      isDirectory: false
    }

    addProjectFile(newFile)
    setNewFileName('')
    setShowAddFile(false)
  }

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedFolders.has(node.file.path)
    const hasChildren = node.children.length > 0
    
    // Create unique key using path + isDirectory to prevent conflicts
    const uniqueKey = `${node.file.path}-${node.file.isDirectory ? 'dir' : 'file'}`
    
    return (
      <div key={uniqueKey}>
        <div
          className={`flex items-center justify-between p-2 md:p-2 py-3 md:py-2 rounded hover:bg-accent cursor-pointer group ${
            selectedFileId === node.file.id ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${(node.level * 16) + 8}px` }}
          onClick={() => {
            if (node.file.isDirectory) {
              toggleFolder(node.file.path)
            } else {
              // Only allow file selection if user can view code
              if (canViewCode(user)) {
                onFileSelect(node.file)
              } else {
                // Show a message or do nothing for free users
                alert('Pro zobrazení kódu je potřeba předplatné. Získej Starter plán!')
              }
            }
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {node.file.isDirectory && hasChildren && (
              <div className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            )}
            {node.file.isDirectory && !hasChildren && (
              <div className="w-4 h-4" />
            )}
            {!node.file.isDirectory && (
              <div className="w-4 h-4" />
            )}
            {getFileIcon(node.file.name, node.file.isDirectory, isExpanded)}
            <span className="text-sm md:text-sm truncate">{node.file.name}</span>
            {/* Show image preview on hover */}
            {!node.file.isDirectory && isImageFile(node.file.name) && node.file.content && (
              <div className="absolute left-full ml-2 top-0 z-50 hidden group-hover:block">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
                  <img 
                    src={node.file.content} 
                    alt={node.file.name}
                    className="max-w-[200px] max-h-[200px] object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 h-auto"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              deleteProjectFile(node.file.id)
            }}
          >
            <Trash2 className="h-3 w-3 md:h-3 md:w-3" />
          </Button>
        </div>
        
        {node.file.isDirectory && isExpanded && (
          <div>
            {node.children.map((child, index) => {
              const childKey = `${child.file.path}-${child.file.isDirectory ? 'dir' : 'file'}-${index}`
              return <Fragment key={childKey}>{renderTreeNode(child)}</Fragment>
            })}
          </div>
        )}
      </div>
    )
  }

  if (!currentProject) return null

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold font-display">Files</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddFile(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {showAddFile && (
          <form onSubmit={handleAddFile} className="mt-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="components/Button.tsx"
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-1 mt-2">
              <Button type="submit" size="sm">Add</Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddFile(false)
                  setNewFileName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 md:p-2">
        {fileTree.map((node, index) => {
          const nodeKey = `${node.file.path}-${node.file.isDirectory ? 'dir' : 'file'}-${index}`
          return <Fragment key={nodeKey}>{renderTreeNode(node)}</Fragment>
        })}
      </div>
    </div>
  )
}