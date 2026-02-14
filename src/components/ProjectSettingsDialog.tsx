import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/Input'
import { Button } from '@/components/ui/Button'

import { useProjectStore } from '@/store/projectStore'
import { Project } from '@/types'
import { Settings, Globe, Lock, Save, Copy } from 'lucide-react'

interface ProjectSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

export default function ProjectSettingsDialog({ open, onOpenChange, project }: ProjectSettingsDialogProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [isPublic, setIsPublic] = useState(project.isPublic || false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const { updateProject } = useProjectStore()

  const handleSave = async () => {
    if (!name.trim()) return

    setIsSaving(true)
    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setName(project.name)
    setDescription(project.description || '')
    setIsPublic(project.isPublic || false)
    onOpenChange(false)
  }

  const copyProjectId = async () => {
    try {
      await navigator.clipboard.writeText(project.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy project ID:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-naklikam-pink-500" />
            Nastavení projektu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Název projektu
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zadejte název projektu"
              className="w-full"
            />
          </div>

          {/* Project ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              ID projektu
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 border border-input bg-muted rounded-md font-mono text-sm text-muted-foreground">
                {project.id}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyProjectId}
                className="px-3"
              >
                <Copy className="h-4 w-4" />
                {copied && <span className="ml-2 text-xs">Zkopírováno!</span>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pro podporu uveďte toto ID při hledání problémů s projektem
            </p>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Popis projektu
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Volitelný popis projektu"
              className="w-full px-3 py-2 border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          {/* Public/Private Setting */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Viditelnost projektu
            </label>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  !isPublic 
                    ? 'border-naklikam-pink-500 bg-naklikam-pink-50 text-naklikam-pink-700' 
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  !isPublic ? 'border-naklikam-pink-500 bg-naklikam-pink-500' : 'border-muted-foreground'
                }`}>
                  {!isPublic && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                </div>
                <Lock className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Soukromý</div>
                  <div className="text-xs text-muted-foreground">Pouze vy můžete projekt vidět</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isPublic 
                    ? 'border-naklikam-pink-500 bg-naklikam-pink-50 text-naklikam-pink-700' 
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 ${
                  isPublic ? 'border-naklikam-pink-500 bg-naklikam-pink-500' : 'border-muted-foreground'
                }`}>
                  {isPublic && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                </div>
                <Globe className="h-4 w-4" />
                <div className="text-left">
                  <div className="font-medium">Veřejný</div>
                  <div className="text-xs text-muted-foreground">Projekt se zobrazí na hlavní stránce</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="bg-naklikam-gradient hover:bg-naklikam-gradient-dark"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Ukládám...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Uložit změny
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}