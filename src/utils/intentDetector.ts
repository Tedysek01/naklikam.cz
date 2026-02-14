/**
 * Intent Detection Utility
 * Analyzes user prompts and AI responses to determine update vs create intent
 */

export interface IntentAnalysis {
  intent: 'update' | 'create' | 'mixed' | 'unclear'
  confidence: number // 0-1 scale
  reasons: string[]
  affectedFiles?: string[]
}

export class IntentDetector {
  
  // Keywords that strongly suggest update intent
  private static UPDATE_KEYWORDS = [
    // Czech
    'změň', 'uprav', 'oprav', 'modifikuj', 'aktualizuj', 'vylepši', 'přidej do', 'zruš z',
    'přepracuj', 'předělej', 'přepiš', 'odstraň', 'smaž', 'vymaž', 'nahraď', 'přesuň',
    'přemísti', 'přejmenuj', 'rozšiř', 'zkrať', 'prodluž', 'zmenši', 'zvětši', 'posuň',
    'nastav', 'přizpůsob', 'dolaď', 'vylad', 'přeformátuj', 'přeskup', 'reorganizuj',
    'přetřiď', 'seřaď', 'uspořádej', 'přestyluj', 'převeď', 'transformuj', 'předělej na',
    'doplň', 'dopln', 'uber', 'ubrat', 'přidat k', 'odebrat z', 'vyhoď', 'vyjmi',
    // English  
    'change', 'modify', 'update', 'edit', 'fix', 'improve', 'enhance', 'adjust',
    'alter', 'refactor', 'optimize', 'correct', 'revise', 'tweak', 'patch',
    'rework', 'rewrite', 'reorganize', 'restructure', 'reformat', 'rename', 'move',
    'delete', 'remove', 'eliminate', 'replace', 'substitute', 'swap', 'switch',
    'convert', 'transform', 'migrate', 'port', 'adapt', 'customize', 'configure',
    'fine-tune', 'debug', 'troubleshoot', 'repair', 'restore', 'recover', 'revert',
    'undo', 'redo', 'rollback', 'upgrade', 'downgrade', 'scale', 'resize', 'extend',
    'shorten', 'expand', 'reduce', 'simplify', 'complicate', 'clarify', 'clean',
    'polish', 'prettify', 'beautify', 'uglify', 'minify', 'compress', 'decompress',
    'append', 'prepend', 'insert', 'inject', 'extract', 'exclude', 'filter',
    // Action phrases
    'add to', 'remove from', 'replace in', 'update the', 'change the', 'fix the',
    'modify the', 'improve the', 'enhance the', 'delete from', 'move to', 'copy to',
    'rename to', 'convert to', 'transform into', 'migrate from', 'switch from',
    'upgrade to', 'downgrade to', 'revert to', 'rollback to', 'restore to',
    'append to', 'prepend to', 'insert into', 'extract from', 'clean up'
  ]

  // Keywords that suggest create intent
  private static CREATE_KEYWORDS = [
    // Czech
    'vytvoř', 'přidej', 'nový', 'nová', 'nove', 'udělej', 'postav', 'navrhni',
    'vygeneruj', 'sestav', 'zkonstruuj', 'založ', 'začni', 'iniciuj', 'nastartuj',
    'spusť', 'instaluj', 'nasaď', 'napiš', 'nakóduj', 'naprogramuj', 'vyviň',
    'vymysli', 'navrhuj', 'naplánuj', 'připrav', 'vytvoř mi', 'udělej mi',
    'chci', 'potřebuju', 'chtěl bych', 'potřeboval bych', 'měl bys vytvořit',
    'vytvoř nový', 'vytvoř novou', 'vytvoř nové', 'přidej nový', 'přidej novou',
    // English
    'create', 'add', 'new', 'build', 'make', 'generate', 'implement', 'develop',
    'design', 'construct', 'establish', 'setup', 'initialize', 'start', 'begin',
    'launch', 'introduce', 'produce', 'compose', 'craft', 'forge', 'form',
    'originate', 'invent', 'devise', 'conceive', 'formulate', 'draft', 'prepare',
    'install', 'deploy', 'scaffold', 'bootstrap', 'kickstart', 'spawn', 'instantiate',
    'provision', 'allocate', 'register', 'define', 'declare', 'specify', 'outline',
    'sketch', 'blueprint', 'architect', 'engineer', 'assemble', 'fabricate',
    'manufacture', 'synthesize', 'integrate', 'incorporate', 'include',
    'write', 'code', 'program', 'script', 'author', 'pen', 'type', 'enter',
    'create new', 'add new', 'build new', 'make new', 'generate new'
  ]

  // File reference patterns that suggest update intent
  private static FILE_REFERENCE_PATTERNS = [
    /(?:v|in|ve|do)\s+(?:souboru|file)?\s*([^\s]+\.(?:css|js|tsx?|html|json))/gi,
    /(?:změň|uprav|oprav)\s+([^\s]+\.(?:css|js|tsx?|html|json))/gi,
    /([^\s]+\.(?:css|js|tsx?|html|json))\s+(?:soubor|file)/gi
  ]

  /**
   * Analyze user prompt for intent
   */
  static analyzeUserPrompt(prompt: string, existingFiles: string[] = []): IntentAnalysis {
    const normalizedPrompt = prompt.toLowerCase()
    const reasons: string[] = []
    let updateScore = 0
    let createScore = 0

    // Check for update keywords
    for (const keyword of this.UPDATE_KEYWORDS) {
      if (normalizedPrompt.includes(keyword.toLowerCase())) {
        updateScore += keyword.length > 4 ? 2 : 1 // Longer keywords are more specific
        reasons.push(`Update keyword: "${keyword}"`)
      }
    }

    // Check for create keywords
    for (const keyword of this.CREATE_KEYWORDS) {
      if (normalizedPrompt.includes(keyword.toLowerCase())) {
        createScore += keyword.length > 4 ? 2 : 1
        reasons.push(`Create keyword: "${keyword}"`)
      }
    }

    // Check for existing file references
    const affectedFiles: string[] = []
    for (const pattern of this.FILE_REFERENCE_PATTERNS) {
      const matches = prompt.matchAll(pattern)
      for (const match of matches) {
        const fileName = match[1]
        if (existingFiles.some(f => f.includes(fileName))) {
          updateScore += 3 // Strong indicator of update intent
          affectedFiles.push(fileName)
          reasons.push(`References existing file: "${fileName}"`)
        }
      }
    }

    // Check for existing file names mentioned
    for (const fileName of existingFiles) {
      const baseName = fileName.split('/').pop() || fileName
      if (normalizedPrompt.includes(baseName.toLowerCase())) {
        updateScore += 2
        affectedFiles.push(fileName)
        reasons.push(`Mentions existing file: "${baseName}"`)
      }
    }

    // Determine intent and confidence
    const totalScore = updateScore + createScore
    let intent: IntentAnalysis['intent']
    let confidence: number

    if (totalScore === 0) {
      intent = 'unclear'
      confidence = 0
      reasons.push('No clear intent indicators found')
    } else if (updateScore > createScore * 1.5) {
      intent = 'update'
      confidence = Math.min(updateScore / (totalScore + 2), 0.95)
    } else if (createScore > updateScore * 1.5) {
      intent = 'create'  
      confidence = Math.min(createScore / (totalScore + 2), 0.95)
    } else {
      intent = 'mixed'
      confidence = Math.abs(updateScore - createScore) / totalScore
      reasons.push('Mixed signals - both update and create indicators present')
    }

    return {
      intent,
      confidence,
      reasons,
      affectedFiles: affectedFiles.length > 0 ? affectedFiles : undefined
    }
  }

  /**
   * Analyze AI response for explicit intent markers
   */
  static analyzeAIResponse(response: string): IntentAnalysis {
    const reasons: string[] = []
    const affectedFiles: string[] = []
    
    // Look for our explicit markers
    const updateMarkers = response.match(/\/\*\s*UPDATE:\s*([^*]+)\s*\*\//gi) || []
    const createMarkers = response.match(/\/\*\s*CREATE:\s*([^*]+)\s*\*\//gi) || []

    // Also check HTML and other comment styles
    const htmlUpdateMarkers = response.match(/<!--\s*UPDATE:\s*([^-]+)\s*-->/gi) || []
    const htmlCreateMarkers = response.match(/<!--\s*CREATE:\s*([^-]+)\s*-->/gi) || []

    // Combine all markers
    const allUpdateMarkers = [...updateMarkers, ...htmlUpdateMarkers]
    const allCreateMarkers = [...createMarkers, ...htmlCreateMarkers]

    // Extract file names from markers
    allUpdateMarkers.forEach(marker => {
      const match = marker.match(/(?:UPDATE:\s*)([^*\-]+)/i)
      if (match) {
        const fileName = match[1].trim()
        affectedFiles.push(fileName)
        reasons.push(`AI marked for update: "${fileName}"`)
      }
    })

    allCreateMarkers.forEach(marker => {
      const match = marker.match(/(?:CREATE:\s*)([^*\-]+)/i)
      if (match) {
        const fileName = match[1].trim()
        affectedFiles.push(fileName)
        reasons.push(`AI marked for creation: "${fileName}"`)
      }
    })

    // Determine intent based on markers
    let intent: IntentAnalysis['intent']
    let confidence: number

    if (allUpdateMarkers.length > 0 && allCreateMarkers.length === 0) {
      intent = 'update'
      confidence = 0.95
    } else if (allCreateMarkers.length > 0 && allUpdateMarkers.length === 0) {
      intent = 'create'
      confidence = 0.95
    } else if (allUpdateMarkers.length > 0 && allCreateMarkers.length > 0) {
      intent = 'mixed'
      confidence = 0.9
    } else {
      intent = 'unclear'
      confidence = 0
      reasons.push('No explicit UPDATE/CREATE markers found in AI response')
    }

    return {
      intent,
      confidence,
      reasons,
      affectedFiles: affectedFiles.length > 0 ? affectedFiles : undefined
    }
  }

  /**
   * Combine user prompt and AI response analysis for final decision
   */
  static combineAnalysis(
    userAnalysis: IntentAnalysis, 
    aiAnalysis: IntentAnalysis
  ): IntentAnalysis {
    const reasons = [...userAnalysis.reasons, ...aiAnalysis.reasons]
    const affectedFiles = [
      ...(userAnalysis.affectedFiles || []),
      ...(aiAnalysis.affectedFiles || [])
    ]

    // AI markers have highest priority
    if (aiAnalysis.confidence > 0.8) {
      return {
        intent: aiAnalysis.intent,
        confidence: aiAnalysis.confidence,
        reasons,
        affectedFiles: affectedFiles.length > 0 ? [...new Set(affectedFiles)] : undefined
      }
    }

    // If AI is unclear but user intent is clear, use user intent
    if (aiAnalysis.confidence < 0.3 && userAnalysis.confidence > 0.6) {
      return {
        intent: userAnalysis.intent,
        confidence: userAnalysis.confidence * 0.8, // Slightly lower confidence
        reasons,
        affectedFiles: affectedFiles.length > 0 ? [...new Set(affectedFiles)] : undefined
      }
    }

    // Combine confidence scores
    const combinedConfidence = (userAnalysis.confidence + aiAnalysis.confidence) / 2

    // Determine final intent
    let finalIntent: IntentAnalysis['intent']
    if (userAnalysis.intent === aiAnalysis.intent) {
      finalIntent = userAnalysis.intent
    } else if (userAnalysis.intent === 'mixed' || aiAnalysis.intent === 'mixed') {
      finalIntent = 'mixed'
    } else {
      finalIntent = 'unclear'
    }

    return {
      intent: finalIntent,
      confidence: combinedConfidence,
      reasons,
      affectedFiles: affectedFiles.length > 0 ? [...new Set(affectedFiles)] : undefined
    }
  }
}