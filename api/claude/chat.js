module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { prompt, projectContext, currentFiles, conversationContext, userId, model = 'sonnet' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check subscription requirement
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required', requiresUpgrade: true });
    }

    // Initialize Firestore
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }
    const db = admin.firestore();

    // Check subscription
    try {
      const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
      const subscriptionDoc = await subscriptionRef.get();
      
      if (!subscriptionDoc.exists) {
        return res.status(403).json({ error: 'Předplatné je vyžadováno', requiresUpgrade: true });
      }
      
      const subscription = subscriptionDoc.data();
      
      if (subscription.status !== 'active') {
        return res.status(403).json({ error: 'Předplatné není aktivní', requiresUpgrade: true });
      }
      
      // BLOCK free plan users - no AI generation for free
      if (subscription.plan === 'free' || !subscription.plan) {
        return res.status(403).json({ error: 'Pro použití AI je potřeba placené předplatné', requiresUpgrade: true });
      }
      
      if (subscription.plan !== 'unlimited') {
        const tokensUsed = subscription.tokensUsed || 0;
        const tokensLimit = subscription.tokensLimit || 0;
        
        if (tokensUsed >= tokensLimit) {
          return res.status(403).json({ error: 'Vyčerpáno tokenů - upgradujte plán', requiresUpgrade: true });
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // BLOCK request if subscription check fails - no free access allowed
      return res.status(500).json({ 
        error: 'Nepodařilo se ověřit předplatné. Prosím obnovte stránku nebo kontaktujte podporu.',
        requiresUpgrade: true 
      });
    }

    // Build context for Claude - Chat mode (different from code generation)
    let contextPrompt = `Jsi užitečný AI asistent pro podporu při vývoji webových aplikací. Komunikuješ v češtině a pomáháš uživatelům s dotazy týkajícími se jejich projektů.

TVOJE ROLE:
- Odpovídáš na dotazy o kódu, architektuře, best practices
- Vysvětluješ problémy a navrhněš řešení
- Poskytneš rady ohledně technologií a nástrojů
- Pomáháš s debugováním a optimalizací
- Nepiš kód, pouze radíš a vysvětluješ

KONTEXT PROJEKTU:
`;
    
    if (projectContext) {
      contextPrompt += `Popis projektu: ${projectContext}\n\n`;
    }
    
    // Add project files context for better understanding
    if (currentFiles && currentFiles.length > 0) {
      contextPrompt += `SOUBORY V PROJEKTU (${currentFiles.length} souborů):\n`;
      contextPrompt += `Pro lepší porozumění tvému projektu zde jsou současné soubory:\n\n`;
      
      currentFiles.forEach(file => {
        // Show file structure but limit content for chat context
        const contentPreview = file.content.length > 500 
          ? file.content.substring(0, 500) + '...\n[obsah zkrácen pro přehlednost]'
          : file.content;
          
        contextPrompt += `📄 ${file.name} (${file.language}):\n`;
        contextPrompt += `${contentPreview}\n\n`;
      });
    } else {
      contextPrompt += `STAV PROJEKTU: Nový projekt bez existujících souborů.\n\n`;
    }
    
    contextPrompt += `UŽIVATELŮV DOTAZ: ${prompt}\n\n`;
    contextPrompt += `Odpovídej v češtině, buď konkrétní a užitečný. Pokud uživatel potřebuje kód, doporuč mu přepnout do režimu "Kódování".`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model === 'haiku' ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514',
        max_tokens: 4000, // Lower token limit for chat responses
        messages: (() => {
          let messages = [];
          
          // Add conversation context if available
          if (conversationContext && conversationContext.length > 0) {
            conversationContext.forEach(msg => {
              messages.push({
                role: msg.role,
                content: msg.content
              });
            });
          }
          
          // Add current prompt with context
          messages.push({ role: 'user', content: contextPrompt });
          
          return messages;
        })(),
        system: `Jsi zkušený AI asistent pro vývoj webových aplikací. Tvým úkolem je poskytovat užitečné rady, vysvětlení a podporu vývojářům.

PRAVIDLA KOMUNIKACE:
- Vždy odpovídáš v češtině
- Buď konkrétní a praktický
- Vysvětluj složité koncepty jednoduše
- Poskytni příklady když je to užitečné
- Nepiš kompletní kód - to je pro režim "Kódování"
- Můžeš ukázat malé úryvky kódu jako příklady

OBLASTI EXPERTÍZY:
- React, TypeScript, JavaScript
- Tailwind CSS, shadcn/ui
- Vite, Node.js
- Best practices pro webový vývoj
- Debugging a optimalizace
- Architektura aplikací

STYL ODPOVĚDI:
- Přívětivý a trpělivý tón
- Strukturované odpovědi s odrážkami či číslovanými seznamy
- Praktické tipy a doporučení
- Odkazy na relevantní dokumentaci když je to užitečné`
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error:', errorData);
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.statusText}`,
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Extract response content
    let content = '';
    if (data.content && data.content[0] && data.content[0].text) {
      content = data.content[0].text;
    }
    
    // Extract actual token usage from Claude response
    const actualTokenUsage = data.usage || null;
    
    // Return simple chat response (no structured format)
    res.status(200).json({ 
      content: content,
      isChat: true, // Flag to distinguish from code generation
      usage: actualTokenUsage
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
}