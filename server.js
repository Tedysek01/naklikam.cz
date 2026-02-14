import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import userListHandler from './api/admin/user-list.js';
import paymentHistoryHandler from './api/admin/payment-history.js';
import userStatsHandler from './api/admin/user-stats.js';

dotenv.config();

// Initialize Stripe with secret key (same as webové balíčky - no API version)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    // Try to use service account from individual environment variables first
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escaped newlines
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
        universe_domain: "googleapis.com"
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('Firebase Admin initialized with service account from individual .env variables');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Fallback to single JSON key
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'naklikej-cf435'
      });
      console.log('Firebase Admin initialized with service account JSON from .env');
    } else {
      // Fallback to application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'naklikej-cf435'
      });
      console.log('Firebase Admin initialized with application default credentials');
    }
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error.message);
  // Last fallback - basic initialization
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'naklikej-cf435'
    });
    console.log('Firebase Admin initialized with basic config (limited functionality)');
  }
}

const db = admin.firestore();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());

// Import content generation handlers
import generateTextHandler from './api/content/generate-text.js';
import generateImageHandler from './api/content/generate-image.js';
import generateVideoHandler from './api/content/generate-video.js';

// Stripe webhook endpoint MUST be before express.json middleware
// because Stripe needs raw body for signature verification
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    console.error('Stripe not initialized - missing STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Stripe webhook signature verified:', event.type);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        await handlePaymentSucceeded(paymentIntent);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('📄 Invoice payment succeeded:', invoice.id);
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('❌ Invoice payment failed:', failedInvoice.id);
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('🎉 Subscription created:', subscription.id);
        await handleSubscriptionCreated(subscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('🔄 Subscription updated:', updatedSubscription.id);
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('🗑️ Subscription deleted:', deletedSubscription.id);
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.use(express.json({ limit: '10mb' }));

// Content generation API routes
app.post('/api/content/generate-text', generateTextHandler);
app.post('/api/content/generate-image', generateImageHandler);
app.post('/api/content/generate-video', generateVideoHandler);

// Streaming Claude API endpoint for long-running tasks
app.post('/api/claude/stream', async (req, res) => {
  try {
    console.log('Received streaming request:', req.body);
    
    const { prompt, projectContext, currentFiles, uploadedImages, conversationContext, userId, model = 'sonnet' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Send initial progress
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Ov\u011b\u0159uji subscripci...', progress: 10 })}\n\n`);
    
    // Check subscription (same logic as before)
    if (userId) {
      try {
        const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
        const subscriptionDoc = await subscriptionRef.get();
        
        if (!subscriptionDoc.exists) {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Subscription required', requiresUpgrade: true })}\n\n`);
          res.end();
          return;
        }
        
        const subscription = subscriptionDoc.data();
        
        if (subscription.status !== 'active') {
          res.write(`data: ${JSON.stringify({ type: 'error', error: 'Subscription inactive', requiresUpgrade: true })}\n\n`);
          res.end();
          return;
        }
        
        if (subscription.plan !== 'unlimited') {
          const tokensUsed = subscription.tokensUsed || 0;
          const tokensLimit = subscription.tokensLimit || 0;
          
          if (tokensUsed >= tokensLimit) {
            res.write(`data: ${JSON.stringify({ type: 'error', error: 'Token limit exceeded', requiresUpgrade: true })}\n\n`);
            res.end();
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
    
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'P\u0159ipravuji kontext...', progress: 20 })}\n\n`);
    
    // Build context with enhanced design requirements
    let contextPrompt = `You are an AI coding assistant helping build modern React web applications using the EXACT same stack as Lovable.

REQUIRED TECH STACK:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components
- Routing: React Router v6
- State/Data: React Query (@tanstack/react-query)
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- Icons: Lucide React
- Charts: Recharts
- Animations: tailwindcss-animate

NEVER generate basic HTML/CSS/JS. ALWAYS use this modern stack.

🎨 DESIGN PHILOSOPHY: You are a WORLD-CLASS UI/UX DESIGNER creating stunning, modern interfaces.
🚫 NO generic wireframes, templates, or boring designs.
✨ CREATE visually striking, professionally designed applications with:
- Generous spacing and perfect typography
- Beautiful color palettes and gradients
- Smooth animations and hover effects
- Modern UI patterns (glassmorphism, depth, shadows)
- Engaging content and meaningful interactions

FORBIDDEN: Basic layouts, gray boxes, plain forms, cramped spacing.
INSPIRATION: Apple, Stripe, Linear, Figma, modern SaaS apps.
`;
    
    if (projectContext) {
      contextPrompt += `Project context: ${projectContext}\n\n`;
    }
    
    if (currentFiles && currentFiles.length > 0) {
      contextPrompt += `\ud83d\uddc2\ufe0f EXISTING PROJECT FILES (${currentFiles.length} files):\n`;
      contextPrompt += `These files already exist in the project and can be UPDATED if needed:\n\n`;
      
      currentFiles.forEach(file => {
        contextPrompt += `\ud83d\udcc4 EXISTING FILE: ${file.name} (${file.language}) at ${file.path || '/' + file.name}\n`;
        contextPrompt += `Content (${file.content.length} chars):\n${file.content}\n\n`;
      });
    } else {
      contextPrompt += `\ud83d\uddc2\ufe0f PROJECT STATUS: This is a new project with no existing files.\n\n`;
    }
    
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Vol\u00e1m Claude API...', progress: 30 })}\n\n`);
    
    // Build conversation messages array with context
    let messages = [];
    
    // Add conversation context if available
    if (conversationContext && conversationContext.length > 0) {
      console.log(`Adding ${conversationContext.length} context messages to conversation`);
      // Add previous messages to provide context
      conversationContext.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Add current prompt with context
    messages.push({ role: 'user', content: contextPrompt });
    
    console.log(`Sending ${messages.length} messages to Claude API (${conversationContext?.length || 0} context + 1 current)`);
    
    // Make streaming request to Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-14'
      },
      body: JSON.stringify({
        model: model === 'haiku' ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514',
        max_tokens: 64000,
        stream: true, // Enable streaming
        messages: messages,
        system: `You are an AI coding assistant that creates modern React web applications using the EXACT same technology stack as Lovable. You NEVER generate basic HTML/CSS/JS - only modern React components.

MANDATORY TECHNOLOGY STACK:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components (Card, Button, Dialog, Tabs, etc.)
- Routing: React Router v6
- State/Data: React Query (@tanstack/react-query) for server state
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- Icons: Lucide React (NEVER use other icon libraries)
- Charts: Recharts for data visualization
- Animations: tailwindcss-animate

COMPONENT ARCHITECTURE:
1. File Structure:
   - components/ for reusable UI components
   - pages/ for route components
   - hooks/ for custom React hooks
   - utils/ for utility functions
   - types/ for TypeScript interfaces

2. File Naming Rules:
   - ALWAYS use lowercase file names with kebab-case
   - Examples: user-dashboard.tsx, api-client.ts, task-list.tsx
   - NEVER use PascalCase in file names (avoid UserDashboard.tsx, ApiClient.ts)
   - Import paths should match the lowercase file names

3. React Patterns:
   - Functional components with hooks
   - Custom hooks for logic extraction
   - React Query for data fetching and caching
   - Context API for global state
   - Proper TypeScript types for all props

4. Styling Standards:
   - Tailwind CSS classes exclusively
   - shadcn/ui component library
   - Responsive design by default
   - Consistent design tokens
   - Dark mode support when applicable

DESIGN PHILOSOPHY - CREATE STUNNING, WORLD-CLASS UIs:
🎨 You are not just a coder - you are a WORLD-CLASS UI/UX DESIGNER with exceptional aesthetic sense.
🚫 NEVER create generic, wireframe-style, or template-looking designs.
✨ ALWAYS create visually stunning, modern, and professionally designed interfaces.

MANDATORY DESIGN PRINCIPLES:
1. VISUAL HIERARCHY & SPACING:
   - Use generous white space (py-12, px-8, gap-8)
   - Create clear visual hierarchy with proper font sizes (text-3xl, text-xl, text-lg)
   - Strategic use of shadows (shadow-lg, shadow-xl) and subtle borders
   - Proper component spacing and breathing room

2. COLOR & AESTHETICS:
   - Use sophisticated color palettes beyond basic grays
   - Implement gradients and subtle color transitions (bg-gradient-to-r)
   - Add accent colors that complement the overall design
   - Use color psychology to enhance user experience

3. TYPOGRAPHY & CONTENT:
   - Mix font weights for visual interest (font-light, font-medium, font-bold)
   - Use proper text hierarchy (text-4xl for heroes, text-xl for sections)
   - Add engaging, meaningful content - not generic placeholder text
   - Ensure excellent readability and contrast

4. INTERACTIVE ELEMENTS:
   - Add hover effects and smooth transitions (hover:scale-105, transition-all)
   - Use subtle animations and micro-interactions
   - Implement proper focus states and accessibility
   - Create buttons that feel premium and engaging

5. LAYOUT & COMPOSITION:
   - Use asymmetric layouts when appropriate
   - Implement proper grid systems and flexbox mastery
   - Add visual elements like cards, panels, and containers
   - Create depth with layering and z-index management

6. MODERN UI PATTERNS:
   - Implement glassmorphism effects (backdrop-blur-sm, bg-white/10)
   - Use modern card designs with proper shadows and borders
   - Add icons strategically to enhance usability
   - Create engaging hero sections and call-to-action areas

INSPIRATION SOURCES:
- Apple's design language (clean, minimal, premium)
- Stripe's dashboard aesthetics (sophisticated, professional)
- Linear's modern interface (sleek, efficient, beautiful)
- Figma's design patterns (intuitive, well-crafted)
- Modern SaaS applications (Notion, Airtable, etc.)

FORBIDDEN DESIGN PATTERNS:
❌ Basic wireframe layouts
❌ Generic gray boxes and placeholders
❌ Plain, unstyled forms
❌ Boring, template-like designs
❌ Poor spacing and cramped layouts
❌ Monotonous color schemes

5. Data Management:
   - React Query for server state
   - useState for local component state
   - Supabase client for backend operations
   - Proper loading and error states

6. Performance & Quality:
   - TypeScript for type safety
   - Proper component composition
   - Memoization when needed
   - Accessible component design
   - Console logging for debugging

CRITICAL RULES:
- NEVER create .html, .css, or .js files
- ALWAYS use .tsx for React components
- ALWAYS use .ts for utilities and types
- ALWAYS use lowercase file names with kebab-case (user-profile.tsx, NOT UserProfile.tsx)
- ALWAYS import from correct paths (@/ for src)
- ALWAYS use shadcn/ui components when applicable
- ALWAYS use Lucide React for icons
- ALWAYS include proper TypeScript types
- NEVER import modules that don't exist (prevents WebContainer MIME errors)
- ALWAYS validate imports before generating code
- If using custom hooks/components, provide full implementation in the same response

You provide complete, production-ready React components that follow modern best practices and integrate seamlessly with the specified technology stack.

REMEMBER: For ANY React project response, you MUST include ALL 9 essential files:
1. package.json (with all dependencies)
2. vite.config.ts
3. tsconfig.json
4. tsconfig.node.json
5. index.html
6. src/main.tsx
7. tailwind.config.js
8. postcss.config.js
9. src/app.tsx (or the main component file)`,
        thinking: { type: "enabled", budget_tokens: 2000 }
      })
    });
    
    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      res.write(`data: ${JSON.stringify({ type: 'error', error: `Claude API error: ${claudeResponse.status}` })}\n\n`);
      res.end();
      return;
    }
    
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Generuji obsah...', progress: 40 })}\n\n`);
    
    // Stream the response
    const reader = claudeResponse.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let progress = 40;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                accumulatedContent += parsed.delta.text;
                progress = Math.min(95, progress + 0.5);
                
                // Send progress update every 50 characters
                if (accumulatedContent.length % 50 === 0) {
                  res.write(`data: ${JSON.stringify({ 
                    type: 'progress', 
                    message: `Generov\u00e1no ${accumulatedContent.length} znak\u016f...`, 
                    progress: Math.floor(progress),
                    partialContent: accumulatedContent.slice(-100) // Last 100 chars as preview
                  })}\n\n`);
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Zpracov\u00e1v\u00e1m v\u00fdsledek...', progress: 95 })}\n\n`);
      
      // Process final content (same parsing logic as original)
      let thinking = '';
      let finalContent = accumulatedContent;
      
      // ... (same content processing logic)
      
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        content: finalContent,
        thinking: thinking,
        hasThinking: thinking.length > 0,
        progress: 100
      })}\n\n`);
      
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Streaming failed' })}\n\n`);
    } finally {
      res.end();
    }
    
  } catch (error) {
    console.error('Claude streaming API error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Claude Chat API endpoint - for conversational responses (not code generation)  
app.post('/api/claude/chat', async (req, res) => {
  console.log('Chat endpoint called');
  try {
    const { prompt, projectContext, currentFiles, conversationContext, userId, model = 'sonnet' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check subscription requirement
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required', requiresUpgrade: true });
    }

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
    let contextPrompt = 'Jsi užitečný AI asistent pro podporu při vývoji webových aplikací. Komunikuješ v češtině a pomáháš uživatelům s dotazy týkajícími se jejich projektů.\n\nTVOJE ROLE:\n- Odpovídáš na dotazy o kódu, architektuře, best practices\n- Vysvětluješ problémy a navrhněš řešení\n- Poskytneš rady ohledně technologií a nástrojů\n- Pomáháš s debugováním a optimalizací\n- Nepiš kód, pouze radíš a vysvětluješ\n\nKONTEXT PROJEKTU:\n';
    
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
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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
        system: 'Jsi zkušený AI asistent pro vývoj webových aplikací. Tvým úkolem je poskytovat užitečné rady, vysvětlení a podporu vývojářům.\n\nPRAVIDLA KOMUNIKACE:\n- Vždy odpovídáš v češtině\n- Buď konkrétní a praktický\n- Vysvětluj složité koncepty jednoduše\n- Poskytni příklady když je to užitečné\n- Nepiš kompletní kód - to je pro režim "Kódování"\n- Můžeš ukázat malé úryvky kódu jako příklady\n\nOBLASTI EXPERTÍZY:\n- React, TypeScript, JavaScript\n- Tailwind CSS, shadcn/ui\n- Vite, Node.js\n- Best practices pro webový vývoj\n- Debugging a optimalizace\n- Architektura aplikací\n\nSTYL ODPOVĚDI:\n- Přívětivý a trpělivý tón\n- Strukturované odpovědi s odrážkami či číslovanými seznamy\n- Praktické tipy a doporučení\n- Odkazy na relevantní dokumentaci když je to užitečné'
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
});

// Original Claude API proxy endpoint (keep for compatibility)
app.post('/api/claude', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    const { prompt, projectContext, currentFiles, uploadedImages, conversationContext, userId, model = 'sonnet', chatMode } = req.body;
    
    console.log('CHAT MODE DEBUG:', {
      chatMode,
      chatModeType: typeof chatMode,
      hasPrompt: !!prompt
    });
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Check subscription status if userId is provided
    if (userId) {
      try {
        const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
        const subscriptionDoc = await subscriptionRef.get();
        
        if (!subscriptionDoc.exists) {
          return res.status(402).json({ 
            error: 'Subscription required',
            message: 'Please upgrade to a paid plan to use AI features',
            requiresUpgrade: true
          });
        }
        
        const subscription = subscriptionDoc.data();
        
        // Check if subscription is active
        if (subscription.status !== 'active') {
          return res.status(402).json({ 
            error: 'Subscription inactive',
            message: 'Your subscription is not active. Please update your payment method.',
            requiresUpgrade: true
          });
        }
        
        // Check token limits (skip for unlimited plan)
        if (subscription.plan !== 'unlimited') {
          const tokensUsed = subscription.tokensUsed || 0;
          const tokensLimit = subscription.tokensLimit || 0;
          
          if (tokensUsed >= tokensLimit) {
            return res.status(429).json({
              error: 'Token limit exceeded',
              message: 'You have reached your monthly token limit. Please upgrade your plan.',
              tokensUsed,
              tokensLimit,
              requiresUpgrade: true
            });
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // Continue without subscription check if there's an error
      }
    }
    
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('No ANTHROPIC_API_KEY found in environment');
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'ANTHROPIC_API_KEY environment variable is missing'
      });
    }
    
    console.log('API key available:', process.env.ANTHROPIC_API_KEY ? 'Yes' : 'No');
    
    // Build context for Claude
    let contextPrompt = '';
    
    // Different prompts for chat vs code generation
    if (chatMode) {
      contextPrompt = 'Jsi užitečný AI asistent pro podporu při vývoji webových aplikací. Komunikuješ v češtině a pomáháš uživatelům s dotazy týkajícími se jejich projektů.\n\nTVOJE ROLE:\n- Odpovídáš na dotazy o kódu, architektuře, best practices\n- Vysvětluješ problémy a navrhněš řešení\n- Poskytneš rady ohledně technologií a nástrojů\n- Pomáháš s debugováním a optimalizací\n- Nepiš kód, pouze radíš a vysvětluješ\n\nKONTEXT PROJEKTU:\n';
    } else {
      contextPrompt = `You are an AI coding assistant helping build modern React web applications using the EXACT same stack as Lovable.

REQUIRED TECH STACK:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components
- Routing: React Router v6  
- State/Data: React Query (@tanstack/react-query)
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- Icons: Lucide React
- Charts: Recharts
- Animations: tailwindcss-animate

NEVER generate basic HTML/CSS/JS. ALWAYS use this modern stack.

🎨 DESIGN PHILOSOPHY: You are a WORLD-CLASS UI/UX DESIGNER creating stunning, modern interfaces.
🚫 NO generic wireframes, templates, or boring designs.
✨ CREATE visually striking, professionally designed applications with:
- Generous spacing and perfect typography
- Beautiful color palettes and gradients
- Smooth animations and hover effects
- Modern UI patterns (glassmorphism, depth, shadows)
- Engaging content and meaningful interactions

FORBIDDEN: Basic layouts, gray boxes, plain forms, cramped spacing.
INSPIRATION: Apple, Stripe, Linear, Figma, modern SaaS apps.
`;
    }
    
    if (projectContext) {
      contextPrompt += chatMode ? `Popis projektu: ${projectContext}\n\n` : `Project context: ${projectContext}\n\n`;
    }
    
    // Enhanced existing files context
    if (currentFiles && currentFiles.length > 0) {
      contextPrompt += `🗂️ EXISTING PROJECT FILES (${currentFiles.length} files):\n`;
      contextPrompt += `These files already exist in the project and can be UPDATED if needed:\n\n`;
      
      currentFiles.forEach(file => {
        contextPrompt += `📄 EXISTING FILE: ${file.name} (${file.language}) at ${file.path || '/' + file.name}\n`;
        contextPrompt += `Content (${file.content.length} chars):\n${file.content}\n\n`;
      });
    } else {
      contextPrompt += `🗂️ PROJECT STATUS: This is a new project with no existing files.\n\n`;
    }
    
    // Add uploaded images context
    if (uploadedImages && uploadedImages.length > 0) {
      contextPrompt += `🖼️ UPLOADED IMAGES (${uploadedImages.length} images):\n`;
      contextPrompt += `These images are available in the project and should be used in generated code:\n\n`;
      
      uploadedImages.forEach(image => {
        contextPrompt += `📷 IMAGE: ${image.name} (stored at ${image.path})\n`;
        contextPrompt += `   Firebase URL to use in HTML/React: "${image.url}"\n`;
        contextPrompt += `   Example usage: <img src="${image.url}" alt="${image.name.replace(/\.\w+$/, '')}" />\n\n`;
      });
      
      contextPrompt += `IMPORTANT: When generating code that needs images, ALWAYS use the Firebase URL (image.url) provided above, NOT the file path. The Firebase URLs are publicly accessible and will work in preview and production.\n\n`;
    }
    
    contextPrompt += `👤 USER REQUEST: ${prompt}\n\n`;
    contextPrompt += `🎯 CODING REQUIREMENTS:

COMPONENT STRUCTURE:
- Create React components using TypeScript (.tsx files)
- Use functional components with hooks
- Import types from separate .ts files when needed
- Follow shadcn/ui component patterns

FILE NAMING CONVENTIONS:
- ALWAYS use lowercase file names with kebab-case for multi-word files
- Examples: app.tsx, user-profile.tsx, task-list.tsx, api-client.ts
- NEVER use PascalCase in file names (avoid App.tsx, UserProfile.tsx, TaskList.tsx)
- Component names inside files should be PascalCase, but file names must be lowercase
- When importing components, use the lowercase file name: import App from './app'

STYLING APPROACH:
- Use Tailwind CSS classes exclusively
- Leverage shadcn/ui components (Button, Card, Dialog, Tabs, etc.)
- Implement responsive design with Tailwind breakpoints
- Use tailwindcss-animate for animations

DATA & STATE:
- Use React Query for server state and API calls
- Use useState/useContext for local state
- Connect to Supabase for backend operations
- Implement proper loading and error states

ICONS & VISUALS:
- Use Lucide React icons exclusively
- Use Recharts for any charts/graphs
- Use stock photos from Unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags
- Ensure accessibility with proper alt texts

DEPENDENCY MANAGEMENT & IMPORT VALIDATION:
- By default, use only Tailwind CSS classes, basic React hooks, and Lucide React for icons
- Do not install additional UI libraries (@radix-ui, @mui, etc.) unless absolutely necessary
- When you must add new dependencies, ALWAYS update the package.json file accordingly
- Prefer simple Tailwind-based solutions over external component libraries

CRITICAL IMPORT RULES:
- NEVER import modules that don't exist in package.json dependencies
- NEVER create custom hooks like useTheme without providing the implementation
- ALWAYS validate that every import has a corresponding file or package dependency
- If you need theme functionality, implement it with React context + useState, don't import external useTheme
- For components like theme-toggle, either create the full implementation or use simple Tailwind classes
- ALWAYS check: does this import exist? If not, either add to package.json or implement the module

ESSENTIAL PROJECT FILES:
ALWAYS include ALL of these essential files in your response when creating a React project:

1. **package.json** - REQUIRED - Main project configuration with all necessary dependencies
2. **vite.config.ts** - REQUIRED - Vite configuration with React plugin and path aliases (@/ -> src)
3. **tsconfig.json** - REQUIRED - TypeScript configuration with proper paths and React settings
4. **tsconfig.node.json** - REQUIRED - TypeScript configuration for Node/Vite
5. **index.html** - REQUIRED - Root HTML file with React root div and module script
6. **src/main.tsx** - REQUIRED - React application entry point with ReactDOM.createRoot
7. **tailwind.config.js** - REQUIRED - Tailwind CSS configuration
8. **postcss.config.js** - REQUIRED - PostCSS configuration for Tailwind
9. **src/app.tsx** - REQUIRED - Main React component - note lowercase naming

CRITICAL: For ANY React/TSX project, you MUST include a complete package.json file with:
- All React dependencies (react, react-dom, react-router-dom)
- All development dependencies (@types/react, vite, typescript, tailwindcss, etc.)
- All required scripts (dev, build, preview, lint)
- Proper versions that work together

When creating/updating these files:
- Use modern React 18 patterns (ReactDOM.createRoot, not ReactDOM.render)
- Configure proper TypeScript paths (@/ alias pointing to src)
- Include all required dependencies in package.json
- Use Vite as the build tool with proper React plugin configuration

🎯 RESPONSE FORMAT - IMPORTANT:

You MUST respond in this EXACT JSON structure:

{
  "type": "code_generation",
  "message": "User-friendly message explaining what you created/changed",
  "description": "Brief 1-2 sentence summary",
  "files": [
    {
      "operation": "create",
      "path": "components/my-component.tsx",
      "language": "typescript",
      "content": "COMPLETE React component using the required stack",
      "description": "What this component does"
    }
  ],
  "features": ["List of key features using modern React patterns"],
  "instructions": "How to use or integrate the components",
  "metadata": {
    "intent": "create",
    "complexity": "medium"
  }
}

📝 File Operation Rules:
- operation: "create" for new files, "update" for modifying existing files
- path: Use proper folder structure (components/, pages/, hooks/, utils/, types/)
- content: COMPLETE file contents using the required tech stack
- language: "typescript" for .tsx and .ts files

📋 Critical Guidelines:
- NEVER generate basic HTML/CSS/JS files
- ALWAYS use React components with TypeScript
- ALWAYS include package.json when creating React components
- ALWAYS use Tailwind CSS and shadcn/ui components
- ALWAYS use Lucide React for icons
- Include proper imports and exports
- Use modern React patterns (hooks, context, etc.)
- When creating ANY React component, MUST include all 9 essential files listed above

🚫 IMPORT VALIDATION CHECKLIST:
Before generating any code, validate EVERY import:
1. Does this import exist in standard React/DOM APIs? ✓
2. Does this import exist in package.json dependencies? ✓
3. Am I creating a file that provides this import? ✓
4. Is this a relative import to an existing project file? ✓

If ANY import fails validation → either add dependency to package.json OR implement the missing module
NEVER generate imports to non-existent modules (causes WebContainer MIME type errors)

🔧 Config Files Management:
- ALWAYS check and create/update these config files when creating React components:
  • package.json - with all required dependencies for Lovable stack
  • vite.config.ts - with proper React and path alias setup
  • tailwind.config.js - with shadcn/ui configuration
  • postcss.config.js - for Tailwind CSS
  • tsconfig.json - for TypeScript configuration
- If dependencies change in package.json, user will need to run npm install
- Use "operation": "update" if config file exists, "create" if it doesn't

Example valid response for the modern stack:
{
  "type": "code_generation",
  "message": "Created a beautiful task management dashboard with real-time updates!",
  "description": "Modern React dashboard with Supabase integration and shadcn/ui components",
  "files": [
    {"operation": "create", "path": "package.json", "language": "json", "content": "{\"name\":\"lovable-app\",\"version\":\"0.1.0\",\"scripts\":{\"dev\":\"vite\",\"build\":\"vite build\"},\"dependencies\":{\"react\":\"^18.2.0\",\"react-dom\":\"^18.2.0\",\"@tanstack/react-query\":\"^4.28.0\",\"lucide-react\":\"^0.220.0\"}}", "description": "Package configuration with all dependencies"},
    {"operation": "create", "path": "components/task-dashboard.tsx", "language": "typescript", "content": "import React from 'react';\nimport { Card } from '@/components/ui/card';\nimport { Button } from '@/components/ui/button';\nimport { Plus } from 'lucide-react';\n\nexport default function TaskDashboard() {\n  return (\n    <Card className=\"p-6\">\n      <Button><Plus className=\"w-4 h-4 mr-2\" />Add Task</Button>\n    </Card>\n  );\n}", "description": "Main dashboard component with shadcn/ui styling"}
  ],
  "features": ["Responsive design with Tailwind", "shadcn/ui components", "Lucide React icons", "Complete config files included"],
  "instructions": "Run npm install to install dependencies, then import and use the TaskDashboard component",
  "metadata": {"intent": "create", "complexity": "medium"}
}

CRITICAL: Your response must be ONLY this JSON structure, no other text before or after!`;

    console.log('Context summary:', {
      projectContext,
      filesCount: currentFiles?.length || 0,
      fileNames: currentFiles?.map(f => f.name) || [],
      conversationContextCount: conversationContext?.length || 0
    });
    
    // Build conversation messages array with context
    let messages = [];
    
    // Add conversation context if available
    if (conversationContext && conversationContext.length > 0) {
      console.log(`Adding ${conversationContext.length} context messages to conversation`);
      // Add previous messages to provide context
      conversationContext.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Add current prompt with context
    messages.push({ role: 'user', content: contextPrompt });
    
    console.log(`Sending ${messages.length} messages to Claude API (${conversationContext?.length || 0} context + 1 current)`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'interleaved-thinking-2025-05-14'
      },
      body: JSON.stringify({
        model: model === 'haiku' ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514',
        max_tokens: 64000,
        messages: messages,
        system: `You are an AI coding assistant that creates modern React web applications using the EXACT same technology stack as Lovable. You NEVER generate basic HTML/CSS/JS - only modern React components.

MANDATORY TECHNOLOGY STACK:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components (Card, Button, Dialog, Tabs, etc.)
- Routing: React Router v6
- State/Data: React Query (@tanstack/react-query) for server state
- Backend: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- Icons: Lucide React (NEVER use other icon libraries)
- Charts: Recharts for data visualization
- Animations: tailwindcss-animate

COMPONENT ARCHITECTURE:
1. File Structure:
   - components/ for reusable UI components
   - pages/ for route components
   - hooks/ for custom React hooks
   - utils/ for utility functions
   - types/ for TypeScript interfaces

2. File Naming Rules:
   - ALWAYS use lowercase file names with kebab-case
   - Examples: user-dashboard.tsx, api-client.ts, task-list.tsx
   - NEVER use PascalCase in file names (avoid UserDashboard.tsx, ApiClient.ts)
   - Import paths should match the lowercase file names

3. React Patterns:
   - Functional components with hooks
   - Custom hooks for logic extraction
   - React Query for data fetching and caching
   - Context API for global state
   - Proper TypeScript types for all props

4. Styling Standards:
   - Tailwind CSS classes exclusively
   - shadcn/ui component library
   - Responsive design by default
   - Consistent design tokens
   - Dark mode support when applicable

DESIGN PHILOSOPHY - CREATE STUNNING, WORLD-CLASS UIs:
🎨 You are not just a coder - you are a WORLD-CLASS UI/UX DESIGNER with exceptional aesthetic sense.
🚫 NEVER create generic, wireframe-style, or template-looking designs.
✨ ALWAYS create visually stunning, modern, and professionally designed interfaces.

MANDATORY DESIGN PRINCIPLES:
1. VISUAL HIERARCHY & SPACING:
   - Use generous white space (py-12, px-8, gap-8)
   - Create clear visual hierarchy with proper font sizes (text-3xl, text-xl, text-lg)
   - Strategic use of shadows (shadow-lg, shadow-xl) and subtle borders
   - Proper component spacing and breathing room

2. COLOR & AESTHETICS:
   - Use sophisticated color palettes beyond basic grays
   - Implement gradients and subtle color transitions (bg-gradient-to-r)
   - Add accent colors that complement the overall design
   - Use color psychology to enhance user experience

3. TYPOGRAPHY & CONTENT:
   - Mix font weights for visual interest (font-light, font-medium, font-bold)
   - Use proper text hierarchy (text-4xl for heroes, text-xl for sections)
   - Add engaging, meaningful content - not generic placeholder text
   - Ensure excellent readability and contrast

4. INTERACTIVE ELEMENTS:
   - Add hover effects and smooth transitions (hover:scale-105, transition-all)
   - Use subtle animations and micro-interactions
   - Implement proper focus states and accessibility
   - Create buttons that feel premium and engaging

5. LAYOUT & COMPOSITION:
   - Use asymmetric layouts when appropriate
   - Implement proper grid systems and flexbox mastery
   - Add visual elements like cards, panels, and containers
   - Create depth with layering and z-index management

6. MODERN UI PATTERNS:
   - Implement glassmorphism effects (backdrop-blur-sm, bg-white/10)
   - Use modern card designs with proper shadows and borders
   - Add icons strategically to enhance usability
   - Create engaging hero sections and call-to-action areas

INSPIRATION SOURCES:
- Apple's design language (clean, minimal, premium)
- Stripe's dashboard aesthetics (sophisticated, professional)
- Linear's modern interface (sleek, efficient, beautiful)
- Figma's design patterns (intuitive, well-crafted)
- Modern SaaS applications (Notion, Airtable, etc.)

FORBIDDEN DESIGN PATTERNS:
❌ Basic wireframe layouts
❌ Generic gray boxes and placeholders
❌ Plain, unstyled forms
❌ Boring, template-like designs
❌ Poor spacing and cramped layouts
❌ Monotonous color schemes

5. Data Management:
   - React Query for server state
   - useState for local component state
   - Supabase client for backend operations
   - Proper loading and error states

6. Performance & Quality:
   - TypeScript for type safety
   - Proper component composition
   - Memoization when needed
   - Accessible component design
   - Console logging for debugging

CRITICAL RULES:
- NEVER create .html, .css, or .js files
- ALWAYS use .tsx for React components
- ALWAYS use .ts for utilities and types
- ALWAYS use lowercase file names with kebab-case (user-profile.tsx, NOT UserProfile.tsx)
- ALWAYS import from correct paths (@/ for src)
- ALWAYS use shadcn/ui components when applicable
- ALWAYS use Lucide React for icons
- ALWAYS include proper TypeScript types
- NEVER import modules that don't exist (prevents WebContainer MIME errors)
- ALWAYS validate imports before generating code
- If using custom hooks/components, provide full implementation in the same response

You provide complete, production-ready React components that follow modern best practices and integrate seamlessly with the specified technology stack.

REMEMBER: For ANY React project response, you MUST include ALL 9 essential files:
1. package.json (with all dependencies)
2. vite.config.ts
3. tsconfig.json
4. tsconfig.node.json
5. index.html
6. src/main.tsx
7. tailwind.config.js
8. postcss.config.js
9. src/app.tsx (or the main component file)`,
        thinking: {
          type: "enabled",
          budget_tokens: 2000
        }
      })
    });

    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response received');
    
    // Extract thinking and final content
    let thinking = '';
    let finalContent = '';
    
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'thinking') {
          thinking = block.text || '';
        } else if (block.type === 'text') {
          finalContent = block.text || '';
        }
      }
    }
    
    console.log('Thinking length:', thinking.length);
    console.log('Final content length:', finalContent.length);
    
    // Track token usage if userId is provided
    let tokenUsageInfo = null;
    if (userId && data.usage) {
      try {
        const tokensUsed = data.usage.total_tokens || 0;
        console.log(`Tracking ${tokensUsed} tokens for user ${userId}`);
        tokenUsageInfo = await trackTokenUsage(userId, tokensUsed);
      } catch (error) {
        console.error('Error tracking token usage:', error);
        // Don't fail the request if token tracking fails
      }
    }
    
    // Try to parse response as JSON first
    let structuredResponse = null;
    let isStructured = false;
    
    try {
      // Clean up the response - remove any markdown formatting
      let cleanContent = finalContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      structuredResponse = JSON.parse(cleanContent);
      isStructured = true;
      console.log('Successfully parsed structured JSON response');
    } catch (error) {
      console.log('Response is not valid JSON, using fallback text format:', error.message);
    }
    
    if (isStructured && structuredResponse) {
      // Return structured response
      res.json({
        content: finalContent, // Keep original for fallback
        thinking: thinking,
        hasThinking: thinking.length > 0,
        structured: structuredResponse,
        isStructured: true,
        tokenUsage: tokenUsageInfo
      });
    } else {
      // Return traditional format
      res.json({ 
        content: finalContent,
        thinking: thinking,
        hasThinking: thinking.length > 0,
        isStructured: false,
        tokenUsage: tokenUsageInfo
      });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message,
      stack: error.stack
    });
  }
});

// Stripe checkout session endpoint
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { priceId, userId } = req.body;
    
    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create or retrieve customer
    let customer;
    const customers = await stripe.customers.list({
      email: userId, // Using userId as email for simplicity
      limit: 1
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userId,
        metadata: { userId }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:3000'}/dashboard?subscription=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/pricing?subscription=cancelled`,
      metadata: {
        userId
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Stripe customer portal session endpoint
app.post('/api/stripe/create-portal-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { customerId, userId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customer ID' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID for verification' });
    }

    // Verify customer exists
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      // Security check: verify the customer belongs to the requesting user
      if (customer.metadata?.userId && customer.metadata.userId !== userId) {
        console.error(`SECURITY WARNING: User ${userId} attempted to access portal for customer ${customerId} belonging to user ${customer.metadata.userId}`);
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to access this billing portal'
        });
      }
    } catch (error) {
      console.error(`Customer not found: ${customerId} for user ${userId}`);
      return res.status(404).json({ 
        error: 'Customer not found',
        message: 'No billing account found. Please contact support if you believe this is an error.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin || 'http://localhost:3000'}/dashboard`,
    });

    console.log(`Created portal session for customer ${customerId} (user: ${userId})`);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    res.status(500).json({ 
      error: 'Failed to create portal session',
      message: error.message 
    });
  }
});

// Content checkout session endpoint
app.post('/api/stripe/create-content-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { 
      priceId, 
      userId, 
      customerEmail, 
      isAddon, 
      planType,
      existingSubscriptionId
    } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing priceId or userId' });
    }

    // Content plan mapping
    const CONTENT_PRICE_TO_PLAN = {
      // Standalone Content Plans
      'price_1S4lrjLArwl6e4M5La8iWDSj': { type: 'content_starter', credits: 100, isAddon: false },
      'price_1S4lsZLArwl6e4M5BNvNzEkW': { type: 'content_pro', credits: 300, isAddon: false },
      'price_1S4ltFLArwl6e4M5xu17MKv8': { type: 'content_business', credits: 1000, isAddon: false },
      
      // Content Addons
      'price_1S4lu3LArwl6e4M5jZO0BUr5': { type: 'content_basic', credits: 100, isAddon: true },
      'price_1S4lvbLArwl6e4M5p8vOlX7i': { type: 'content_pro', credits: 300, isAddon: true },
      'price_1S4lwCLArwl6e4M5IA0MBFR6': { type: 'content_business', credits: 1000, isAddon: true }
    };

    // Get plan details from price ID
    const planDetails = CONTENT_PRICE_TO_PLAN[priceId];
    if (!planDetails) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Find or create customer
    let customerId = null;
    try {
      // Try to find existing customer by userId in metadata
      const customers = await stripe.customers.list({
        limit: 100,
      });
      
      const existingCustomer = customers.data.find(c => 
        c.metadata?.userId === userId || c.email === customerEmail
      );
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log(`Found existing customer: ${customerId} for user ${userId}`);
      } else {
        // Create new customer with userId in metadata
        const customerData = {
          metadata: {
            userId: userId,
            contentPlan: planDetails.type
          }
        };
        
        // Only add email if provided
        if (customerEmail) {
          customerData.email = customerEmail;
        }
        
        const newCustomer = await stripe.customers.create(customerData);
        customerId = newCustomer.id;
        console.log(`Created new customer: ${customerId} for user ${userId}`);
      }
    } catch (error) {
      console.error('Error handling customer:', error);
      // Continue without customer - let Stripe create one automatically
    }

    let sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${req.headers.origin || 'http://localhost:3000'}/content-marketing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/content-marketing`,
      ui_mode: 'hosted',
      locale: 'cs', // Czech language
      client_reference_id: userId,
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'required', // Collect billing address
      tax_id_collection: {
        enabled: true, // Automatically collect tax IDs (DIČ/IČO for Czech companies)
      },
      customer_update: {
        address: 'auto', // Save address from checkout to customer
        name: 'auto' // Save name from checkout to customer
      },
      metadata: {
        userId: userId,
        contentPlan: planDetails.type,
        priceId: priceId,
        isAddon: isAddon ? 'true' : 'false',
        credits: String(planDetails.credits)
      }
    };

    // Handle addon vs standalone subscription
    if (isAddon && existingSubscriptionId) {
      // For addons, we need to update the existing subscription
      // Create a checkout session that will add the addon to existing subscription
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        }
      ];
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
          contentAddon: planDetails.type,
          credits: String(planDetails.credits),
          isAddon: 'true'
        }
      };
      
      // If customer has existing subscription, we should link to it
      if (customerId) {
        sessionConfig.customer = customerId;
        
        // Get existing subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        });
        
        if (subscriptions.data.length > 0) {
          // Instead of modifying here, let webhook handle it after payment
          // Store the subscription ID to update in metadata
          sessionConfig.metadata.targetSubscriptionId = subscriptions.data[0].id;
        }
      }
    } else {
      // Standalone Content subscription
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        }
      ];
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
          contentPlan: planDetails.type,
          credits: String(planDetails.credits),
          isStandalone: 'true'
        }
      };
      
      if (customerId) {
        sessionConfig.customer = customerId;
      }
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`Created checkout session ${session.id} for user ${userId}, plan: ${planDetails.type}`);

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});


// GitHub OAuth endpoints
app.get('/auth/github', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub app not configured' });
  }
  
  const state = req.query.state || 'default';
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email&state=${state}`;
  
  console.log('Redirecting to GitHub OAuth:', githubAuthUrl);
  res.redirect(githubAuthUrl);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData);
      return res.status(400).json({ error: tokenData.error_description });
    }
    
    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    const userData = await userResponse.json();
    
    console.log('GitHub OAuth successful for user:', userData.login);
    
    // In a real app, you'd save the token securely per user
    // For now, we'll redirect back to frontend with success
    // Determine the correct frontend URL based on the request
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('host');
    const frontendHost = host?.includes('3002') ? host.replace('3002', '3000') : 'localhost:3000';
    const baseUrl = `${protocol}://${frontendHost}`;
    
    const redirectUrl = `${baseUrl}/dashboard?github_connected=true&github_user=${userData.login}&github_token=${tokenData.access_token}`;
    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GitHub API proxy endpoints
app.get('/api/github/user', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'GitHub token required' });
  }
  
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.get('/api/github/repos', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'GitHub token required' });
  }
  
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.post('/api/github/repos', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { name, description, private: isPrivate } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'GitHub token required' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Repository name required' });
  }
  
  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || `Created from Lovable IDE`,
        private: isPrivate || false,
        auto_init: true, // Initialize with README
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    console.log('Repository created:', data.full_name);
    res.json(data);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

app.put('/api/github/repos/:owner/:repo/contents/*filePath', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { owner, repo } = req.params;
  const filePath = req.params.filePath; // Will capture the rest of the path
  const { content, message, sha } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'GitHub token required' });
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message || `Update ${filePath}`,
        content: Buffer.from(content).toString('base64'),
        sha: sha, // Required for updates
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    console.log('File updated:', filePath);
    res.json(data);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Vercel OAuth endpoints removed - using Personal Access Tokens instead

// Vercel API proxy endpoints
app.get('/api/vercel/user', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Vercel token required' });
  }
  
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Vercel API error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

app.get('/api/vercel/projects', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Vercel token required' });
  }
  
  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Vercel API error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/vercel/projects', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { name, gitRepository } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Vercel token required' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Project name required' });
  }
  
  try {
    const projectData = {
      name,
      framework: 'nextjs',
      ...(gitRepository && { gitRepository })
    };
    
    const response = await fetch('https://api.vercel.com/v10/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    console.log('Vercel project created:', data.name);
    res.json(data);
  } catch (error) {
    console.error('Vercel API error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.post('/api/vercel/projects/:projectId/deployments', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { projectId } = req.params;
  const { gitSource } = req.body;
  
  if (!token) {
    return res.status(401).json({ error: 'Vercel token required' });
  }
  
  try {
    const deploymentData = {
      name: projectId,
      ...(gitSource && { gitSource })
    };
    
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    console.log('Vercel deployment created:', data.url);
    res.json(data);
  } catch (error) {
    console.error('Vercel API error:', error);
    res.status(500).json({ error: 'Failed to create deployment' });
  }
});

app.get('/api/vercel/deployments/:deploymentId', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { deploymentId } = req.params;
  
  if (!token) {
    return res.status(401).json({ error: 'Vercel token required' });
  }
  
  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Vercel API error:', error);
    res.status(500).json({ error: 'Failed to fetch deployment' });
  }
});

// GitHub webhook endpoint
app.post('/webhooks/github', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  
  if (webhookSecret && signature) {
    const crypto = await import('crypto');
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('GitHub webhook signature verification failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  const event = req.headers['x-github-event'];
  const payload = JSON.parse(req.body.toString());
  
  console.log('GitHub webhook received:', event, payload.repository?.full_name);
  
  // Handle different webhook events
  switch (event) {
    case 'push':
      console.log('Push event:', payload.commits?.length, 'commits');
      // Here you could notify connected users about changes
      break;
    case 'repository':
      console.log('Repository event:', payload.action);
      break;
    default:
      console.log('Unhandled webhook event:', event);
  }
  
  res.json({ received: true });
});

// Add basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    githubConfigured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    vercelConfigured: true, // PAT authentication doesn't require server config
    timestamp: new Date().toISOString()
  });
});

// Firebase helper functions
async function getUserByStripeCustomerId(customerId) {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).limit(1).get();
    
    if (snapshot.empty) {
      // Try to find by email if customer metadata has userId
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.metadata?.userId) {
        const userDoc = await db.collection('users').doc(customer.metadata.userId).get();
        if (userDoc.exists) {
          return { id: userDoc.id, ...userDoc.data() };
        }
      }
      return null;
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('Error getting user by Stripe customer ID:', error);
    return null;
  }
}

async function updateUserSubscription(userId, subscriptionData) {
  try {
    const userRef = db.collection('users').doc(userId);
    
    // Update user document with Stripe customer ID
    await userRef.update({
      stripeCustomerId: subscriptionData.stripeCustomerId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update subscription sub-collection
    const subscriptionRef = userRef.collection('subscription').doc('current');
    await subscriptionRef.set({
      ...subscriptionData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`Updated subscription for user ${userId}`);
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

async function trackTokenUsage(userId, tokensUsed) {
  try {
    const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
    
    // Get current subscription
    const doc = await subscriptionRef.get();
    if (!doc.exists) {
      throw new Error('No subscription found');
    }
    
    const currentData = doc.data();
    const newTokensUsed = (currentData.tokensUsed || 0) + tokensUsed;
    
    await subscriptionRef.update({
      tokensUsed: newTokensUsed,
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { tokensUsed: newTokensUsed, tokensLimit: currentData.tokensLimit };
  } catch (error) {
    console.error('Error tracking token usage:', error);
    throw error;
  }
}

async function resetUserTokens(userId) {
  try {
    const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
    
    await subscriptionRef.update({
      tokensUsed: 0,
      lastResetAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Tokens reset for user ${userId}`);
  } catch (error) {
    console.error('Error resetting user tokens:', error);
    throw error;
  }
}

// Stripe webhook handler functions
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Processing successful payment:', paymentIntent.id);
  
  // Here you would typically:
  // 1. Find user by customer_id or metadata
  // 2. Update user's subscription/credits in your database
  // 3. Send confirmation email
  
  const customerId = paymentIntent.customer;
  const amount = paymentIntent.amount;
  const currency = paymentIntent.currency;
  
  console.log(`Payment processed: ${amount} ${currency} for customer ${customerId}`);
  
  // Example: Update user subscription in Firebase
  // await updateUserSubscription(customerId, { status: 'active', amount, currency });
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing successful invoice payment:', invoice.id);
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  const amount = invoice.amount_paid;
  
  console.log(`Invoice paid: ${amount} for subscription ${subscriptionId}`);
  
  // Get user by customer ID and reset tokens for new billing period
  try {
    const user = await getUserByStripeCustomerId(customerId);
    if (user) {
      await resetUserTokens(user.id);
      console.log(`Tokens reset for user ${user.id} after successful payment`);
    }
  } catch (error) {
    console.error('Error resetting tokens after payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing failed invoice payment:', invoice.id);
  
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;
  
  console.log(`Invoice payment failed for subscription ${subscriptionId}`);
  
  // Example: Notify user and possibly suspend subscription
  // await suspendUserSubscription(customerId, subscriptionId);
  // await sendPaymentFailedEmail(customerId);
}

async function handleSubscriptionCreated(subscription) {
  console.log('Processing new subscription:', subscription.id);
  
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price?.id;
  const status = subscription.status;
  
  console.log(`New subscription: ${priceId} status ${status} for customer ${customerId}`);
  
  // Get price metadata to determine plan details
  try {
    const price = await stripe.prices.retrieve(priceId);
    const metadata = price.metadata;
    
    console.log('Plan metadata:', metadata);
    
    // Get user by Stripe customer ID or metadata
    let userId = subscription.metadata?.userId;
    if (!userId) {
      const user = await getUserByStripeCustomerId(customerId);
      if (user) {
        userId = user.id;
      } else {
        console.error('Could not find user for customer:', customerId);
        return;
      }
    }
    
    // Update user subscription in Firebase
    await updateUserSubscription(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: metadata.plan_name,
      tokens: parseInt(metadata.token_limit),
      tokensUsed: 0,
      tokensLimit: parseInt(metadata.token_limit),
      planTier: parseInt(metadata.plan_tier),
      status: status,
      currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Subscription created for user ${userId}`);
  } catch (error) {
    console.error('Error processing subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription update:', subscription.id);
  
  const customerId = subscription.customer;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price?.id;
  
  console.log(`Subscription updated: ${priceId} status ${status} for customer ${customerId}`);
  
  // Get price metadata to determine plan details
  try {
    const price = await stripe.prices.retrieve(priceId);
    const metadata = price.metadata;
    
    console.log('Updated plan metadata:', metadata);
    
    // Get user by Stripe customer ID
    const user = await getUserByStripeCustomerId(customerId);
    if (!user) {
      console.error('Could not find user for customer:', customerId);
      return;
    }
    
    // Update user subscription in Firebase
    await updateUserSubscription(user.id, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: metadata.plan_name,
      tokens: parseInt(metadata.token_limit),
      tokensLimit: parseInt(metadata.token_limit),
      planTier: parseInt(metadata.plan_tier),
      status: status,
      currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
      expiresAt: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false
    });
    
    console.log(`Subscription updated for user ${user.id}`);
  } catch (error) {
    console.error('Error processing subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deletion:', subscription.id);
  
  const customerId = subscription.customer;
  
  console.log(`Subscription deleted for customer ${customerId}`);
  
  // Example: Deactivate user subscription
  // await deactivateUserSubscription(customerId, subscription.id);
}

// Token consumption endpoint
app.post('/api/consume-tokens', async (req, res) => {
  console.log('[Consume Tokens] Processing request...');
  
  try {
    const { userId, tokens } = req.body;
    
    if (!userId || !tokens) {
      return res.status(400).json({ error: 'Missing userId or tokens' });
    }

    // Get current subscription
    const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
    const subscriptionDoc = await subscriptionRef.get();
    
    if (!subscriptionDoc.exists) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    
    const subscription = subscriptionDoc.data();
    const newTokensUsed = (subscription.tokensUsed || 0) + tokens;
    
    // Check if user has enough tokens
    if (subscription.plan !== 'unlimited' && newTokensUsed > subscription.tokensLimit) {
      return res.status(403).json({ 
        error: 'Insufficient tokens',
        tokensUsed: subscription.tokensUsed,
        tokensLimit: subscription.tokensLimit,
        requested: tokens
      });
    }
    
    // Update token usage
    await subscriptionRef.update({
      tokensUsed: newTokensUsed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return updated subscription data
    const updatedDoc = await subscriptionRef.get();
    const updatedData = updatedDoc.data();
    
    res.status(200).json({
      success: true,
      subscription: {
        plan: updatedData.plan,
        tokens: updatedData.tokens,
        tokensUsed: updatedData.tokensUsed,
        tokensLimit: updatedData.tokensLimit,
        expiresAt: updatedData.expiresAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error consuming tokens:', error);
    res.status(500).json({ 
      error: 'Failed to consume tokens',
      details: error.message 
    });
  }
});

// TikTok Events API endpoint
app.post('/api/tiktok/events', async (req, res) => {
  const crypto = await import('crypto');
  
  // TikTok Events API configuration
  const TIKTOK_PIXEL_ID = 'D27UL9RC77U916NJ0RE0';
  const TIKTOK_ACCESS_TOKEN = '8ecfb1a5faba9458130783ecd08fe6497bd386ec';
  const TIKTOK_API_VERSION = 'v1.3';
  
  try {
    const { event, properties = {}, user = {} } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Hash user data for privacy
    const hashSHA256 = (input) => {
      return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
    };

    const hashedUser = {};
    if (user.email) {
      hashedUser.email = hashSHA256(user.email);
    }
    if (user.phone) {
      hashedUser.phone = hashSHA256(user.phone);
    }
    if (user.external_id) {
      hashedUser.external_id = hashSHA256(user.external_id);
    }

    // Get client IP
    const getClientIP = (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             req.connection?.socket?.remoteAddress ||
             '127.0.0.1';
    };

    // Generate UUID for event_source_id
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Build TikTok Events API 2.0 payload according to official docs
    const eventData = {
      event: event,
      event_time: Math.floor(Date.now() / 1000),
      event_id: generateUUID(), // Required for deduplication
      user: {
        ...hashedUser,
        ip: getClientIP(req),
        user_agent: req.headers['user-agent'] || ''
      },
      properties: {
        ...properties,
        ...(properties.content_id && {
          contents: [{
            content_id: properties.content_id,
            content_name: properties.content_name || '',
            content_category: properties.content_category || '',
            price: properties.value || 0
          }]
        })
      },
      page: {
        url: properties.page_url || req.headers.referer || '',
        referrer: req.headers.referer || ''
      }
    };

    // TikTok Events API 2.0 format
    const payload = {
      event_source: "web", // Required: type of events
      event_source_id: TIKTOK_PIXEL_ID, // Required: Pixel Code
      data: [eventData] // Required: array of events
    };

    console.log('🎯 Sending TikTok Events API request:', {
      event,
      pixelId: TIKTOK_PIXEL_ID,
      hasUserData: Object.keys(hashedUser).length > 0,
      properties: Object.keys(properties)
    });

    console.log('🔍 Full payload being sent:', JSON.stringify(payload, null, 2));

    // Send to TikTok Events API
    const tiktokResponse = await fetch(`https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/event/track/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const responseData = await tiktokResponse.json();

    if (tiktokResponse.ok && responseData.code === 0) {
      console.log('✅ TikTok Events API success:', responseData);
      res.json({ success: true, data: responseData });
    } else {
      console.error('❌ TikTok Events API error:', responseData);
      res.status(tiktokResponse.status || 500).json({
        success: false,
        error: responseData.message || 'TikTok API error',
        details: responseData
      });
    }

  } catch (error) {
    console.error('TikTok Events API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send event to TikTok',
      message: error.message
    });
  }
});

// Register admin endpoints  
app.get('/api/admin/user-list', userListHandler);
app.get('/api/admin/payment-history', paymentHistoryHandler);
app.get('/api/admin/user-stats', userStatsHandler);

app.listen(PORT, () => {
  console.log(`Claude proxy server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Stripe webhook: http://localhost:${PORT}/api/webhooks/stripe`);
  console.log(`TikTok Events API: http://localhost:${PORT}/api/tiktok/events`);
  console.log('Environment variables loaded:');
  console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set');
  console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not set');
  console.log('- STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Not set');
});