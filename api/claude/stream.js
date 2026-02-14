import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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
    } else {
      admin.initializeApp({
        projectId: 'naklikej-cf435'
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received streaming request:', req.body);
    
    const { prompt, projectContext, currentFiles, uploadedImages, conversationContext, userId, model = 'sonnet', chatMode = false } = req.body;
    
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
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Ověřuji subscripci...', progress: 10 })}\n\n`);
    
    // TEMPORARILY DISABLED - Check subscription (bypassed due to Firebase GRPC issues)
    if (userId) {
      try {
        const subscriptionRef = db.collection('users').doc(userId).collection('subscription').doc('current');
        const subscriptionDoc = await subscriptionRef.get();
        
        if (subscriptionDoc.exists) {
          const subscription = subscriptionDoc.data();
          
          // Only check token limits, skip other subscription checks
          if (subscription.plan !== 'unlimited') {
            const tokensUsed = subscription.tokensUsed || 0;
            const tokensLimit = subscription.tokensLimit || 0;
            
            if (tokensUsed >= tokensLimit) {
              res.write(`data: ${JSON.stringify({ 
                type: 'complete', 
                content: 'Vyčerpáno tokenů - upgradujte plán',
                thinking: '',
                hasThinking: false,
                progress: 100
              })}\n\n`);
              res.end();
              return;
            }
          }
        } else {
          console.log('[STREAMING] No subscription found, but allowing request (temporary)');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        console.log('[STREAMING] Subscription check failed, but allowing request (temporary)');
        // TEMPORARILY ALLOW REQUEST TO CONTINUE
      }
    }
    
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Připravuji kontext...', progress: 20 })}\n\n`);
    
    // Build context for Claude - different prompts for chat vs code generation
    let contextPrompt;
    
    if (chatMode) {
      // Chat mode - conversational, helpful responses
      contextPrompt = `You are a helpful AI assistant. You provide clear, concise, and friendly responses. 
      
Keep your answers:
- Short and to the point (1-3 sentences unless more detail is specifically requested)
- Conversational and natural
- Helpful and informative
- In Czech language when appropriate

For coding questions, provide brief explanations and simple examples only when helpful.`;
    } else {
      // Code generation mode - full coding assistant
      contextPrompt = `You are an AI coding assistant helping build modern React web applications using the EXACT same stack as Lovable.

REQUIRED TECH STACK:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components
- Routing: React Router v6  
- State/Data: React Query (@tanstack/react-query) for API calls, React Context + useState for local state
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

🇨🇿 LANGUAGE REQUIREMENTS:
- ALWAYS use Czech language for ALL user-facing text, labels, placeholders, error messages
- Examples: "Přihlásit se" not "Login", "Hledat..." not "Search...", "Načítání..." not "Loading..."
- System messages, button texts, form labels, notifications - ALL in Czech
- Comments in code can be in English, but UI text MUST be Czech
`;
    
    if (projectContext) {
      contextPrompt += `Project context: ${projectContext}\n\n`;
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
- In React 17+, DO NOT import React unless using React.Fragment or other React exports
- CORRECT: export default function Component() { return <div>...</div> }
- INCORRECT: import React from 'react'; export default function Component()...

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
- For backend operations, use generic fetch/axios calls or let user choose their preferred solution
- Implement proper loading and error states

ICONS & VISUALS:
- Use Lucide React icons exclusively
- Use Recharts for any charts/graphs
- Use stock photos from Unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags
- Ensure accessibility with proper alt texts

BACKEND & DATABASE RULES:
- NEVER automatically generate any specific backend/database configurations (Supabase, Firebase, etc.)
- NEVER include database setup, migrations, or backend-specific code unless explicitly requested
- Focus on frontend-only solutions using mock data or placeholder API calls
- If backend functionality is needed, use generic REST API patterns with fetch()
- Let users implement their own backend solution of choice

Example of GOOD generic API pattern:
\`\`\`typescript
// Generic API service - user can adapt to their preferred backend
const api = {
  async getUsers() {
    const response = await fetch('/api/users')
    return response.json()
  },
  async createUser(userData: UserData) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    return response.json()
  }
}
\`\`\`

NEVER generate backend-specific code like:
❌ Any database client imports or configurations
❌ Database queries or ORM code  
❌ Authentication provider setup
❌ Database schemas or migration files
❌ Backend service configurations

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
10. **.gitignore** - REQUIRED - Git ignore configuration for node_modules, dist, .env
11. **src/components/ui/button.tsx** - REQUIRED - shadcn/ui Button component with asChild support using @radix-ui/react-slot
12. **src/components/ui/card.tsx** - REQUIRED - shadcn/ui Card component
13. **src/lib/utils.ts** - REQUIRED - Utility functions for cn() class merging
14. **vercel.json** - REQUIRED - Vercel deployment configuration for Vite projects
15. **.env.example** - RECOMMENDED - Environment variables template

CRITICAL: For ANY React/TSX project, you MUST include a complete package.json file with:
- All React dependencies (react, react-dom, react-router-dom)
- All development dependencies (@types/react, vite, typescript, tailwindcss, etc.)
- All required scripts (dev, build, preview, lint)
- Proper versions that work together
- @radix-ui/react-slot and class-variance-authority for shadcn/ui Button component
- Dependencies MUST include: "@radix-ui/react-slot": "^1.0.2", "class-variance-authority": "^0.7.0"

VERCEL DEPLOYMENT CONFIGURATION:
When creating a React/Vite project, ALWAYS include a vercel.json file with:
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
This prevents "No Next.js version detected" errors on Vercel deployment.

When creating/updating these files:
- Use modern React 18 patterns (ReactDOM.createRoot, not ReactDOM.render)
- Configure proper TypeScript paths (@/ alias pointing to src)
- Include all required dependencies in package.json
- Use Vite as the build tool with proper React plugin configuration
- Include vercel.json for proper Vercel deployment

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
- content: COMPLETE file contents using the required tech stack - NEVER partial snippets or "previous code remains same"
- language: "typescript" for .tsx and .ts files

⚠️ CRITICAL FILE CONTENT RULES:
- ALWAYS provide COMPLETE file contents from start to finish
- NEVER use "Previous code remains the same" or similar partial snippets
- NEVER use "Rest of the component remains the same" 
- NEVER use "// ... existing code ..." placeholders
- If updating a file, provide the ENTIRE updated file content
- If creating a file, provide the COMPLETE file from imports to exports

BAD EXAMPLES (NEVER DO THIS):
❌ "// Previous code remains the same until the select element..."
❌ "// Rest of the component remains the same"
❌ "// ... existing imports ..."
❌ "/* existing code above */"

GOOD EXAMPLES (ALWAYS DO THIS):
✅ Complete file with all imports, all components, all exports
✅ Full file contents even for small changes
✅ Every line of code needed to make the file work

📋 Critical Guidelines:
- NEVER generate basic HTML/CSS/JS files
- ALWAYS use React components with TypeScript
- ALWAYS include package.json when creating React components
- ALWAYS use Tailwind CSS and shadcn/ui components
- ALWAYS use Lucide React for icons
- Include proper imports and exports
- Use modern React patterns (hooks, context, etc.)
- When creating ANY React component, MUST include all essential files listed above

SHADCN/UI BUTTON COMPONENT IMPLEMENTATION:
The Button component MUST support the asChild prop pattern using @radix-ui/react-slot.
ALWAYS include @radix-ui/react-slot in package.json dependencies when using Button component.
The correct Button implementation must include asChild prop support for proper Link integration.

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

CRITICAL: Your response must be ONLY this JSON structure, no other text before or after!`;
    }
    
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Volám Anthropic API...', progress: 30 })}\n\n`);
    
    // Use Anthropic SDK for proper streaming (install: npm install @anthropic-ai/sdk)
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Generuji obsah...', progress: 40 })}\n\n`);
    
    const stream = anthropic.messages.stream({
      model: model === 'haiku' ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514',
      max_tokens: 64000,
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
      system: `You are an AI coding assistant that creates modern React web applications using the EXACT same technology stack as Lovable. You NEVER generate basic HTML/CSS/JS - only modern React components.

MANDATORY TECHNOLOGY STACK:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components (Card, Button, Dialog, Tabs, etc.)
- Routing: React Router v6
- State/Data: React Query (@tanstack/react-query) for server state
- Backend: Generic REST APIs with fetch() - let users choose their backend solution
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

🇨🇿 CZECH LANGUAGE REQUIREMENT:
- ALL user-facing text MUST be in Czech language
- Button labels: "Přihlásit se", "Odeslat", "Uložit", "Zrušit"
- Form labels: "Jméno", "E-mail", "Heslo", "Telefon"
- Placeholders: "Zadejte jméno...", "Hledat...", "Vyberte možnost..."
- Messages: "Načítání...", "Úspěšně uloženo", "Došlo k chybě"
- Navigation: "Domů", "Profil", "Nastavení", "Odhlásit se"
- Never use English for UI text - always Czech

5. Data Management:
   - React Query for server state
   - useState for local component state
   - Generic fetch/axios for backend operations
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
1. package.json (with all dependencies and next.js version)
2. vite.config.ts
3. vercel.json
4. tsconfig.json
5. tsconfig.node.json
6. index.html
7. src/main.tsx
8. tailwind.config.js
9. postcss.config.js
10. src/app.tsx (or the main component file)`,
      thinking: {
        type: "enabled",
        budget_tokens: 2000
      }
    });
    
    let accumulatedContent = '';
    let progress = 40;
    
    try {
      // Use proper Anthropic SDK streaming
      for await (const messageStreamEvent of stream) {
        switch (messageStreamEvent.type) {
          case 'message_start':
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Claude začíná psát...', progress: 45 })}\n\n`);
            break;
            
          case 'content_block_start':
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Streamuji obsah...', progress: 50 })}\n\n`);
            break;
            
          case 'content_block_delta':
            if (messageStreamEvent.delta.type === 'text_delta') {
              accumulatedContent += messageStreamEvent.delta.text;
              progress = Math.min(95, progress + 0.1);
              
              // Send character-by-character streaming updates
              try {
                const streamingUpdate = { 
                  type: 'streaming', 
                  text: messageStreamEvent.delta.text,
                  partialContent: accumulatedContent
                };
                res.write(`data: ${JSON.stringify(streamingUpdate)}\n\n`);
              } catch (error) {
                console.error('Error serializing streaming update:', error);
                // Send simplified update without partial content if JSON serialization fails
                res.write(`data: ${JSON.stringify({ 
                  type: 'streaming', 
                  text: messageStreamEvent.delta.text
                })}\n\n`);
              }
            }
            break;
            
          case 'content_block_stop':
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Ukončuji stream...', progress: 90 })}\n\n`);
            break;
            
          case 'message_delta':
            // Handle message-level changes if needed
            break;
            
          case 'message_stop':
            // Final message received
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Stream dokončen', progress: 95 })}\n\n`);
            break;
            
          case 'ping':
            // Keep connection alive - no action needed
            break;
            
          case 'error':
            throw new Error(messageStreamEvent.error?.message || 'Streaming error');
            
          default:
            // Handle unknown event types gracefully
            console.log('[STREAMING] Unknown event type:', messageStreamEvent.type);
            break;
        }
      }
      
      res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Dokončování...', progress: 95 })}\n\n`);
      
      // Parse thinking and content separately
      let thinking = '';
      let mainContent = accumulatedContent;
      let hasThinking = false;
      
      // Check for thinking blocks
      const thinkingMatch = accumulatedContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch) {
        thinking = thinkingMatch[1].trim();
        hasThinking = true;
        mainContent = accumulatedContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
      }
      
      // Send final result with properly separated thinking and content
      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        content: mainContent,
        thinking: thinking,
        hasThinking: hasThinking,
        progress: 100
      })}\n\n`);
      
      // End the response to prevent fallback
      res.end();
      
    } catch (error) {
      console.error('Streaming error:', error);
      
      // Provide user-friendly error messages based on error type
      let friendlyMessage = '❌ Něco se pokazilo při generování kódu';
      
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        friendlyMessage = '⏰ Generování trvá příliš dlouho - zkuste to znovu s kratším promptem';
      } else if (error.message?.includes('DECODER routines') || error.message?.includes('SSL')) {
        friendlyMessage = '🔒 Technické potíže se zabezpečením - zkuste to znovu za chvilku';
      } else if (error.message?.includes('GRPC') || error.message?.includes('Getting metadata')) {
        friendlyMessage = '📡 Problém s komunikací se serverem - zkuste obnovit stránku';
      } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        friendlyMessage = '🚦 Příliš mnoho požadavků - počkejte chvilku a zkuste znovu';
      }
      
      res.write(`data: ${JSON.stringify({ type: 'error', error: friendlyMessage })}\n\n`);
      res.end();
    }
    
  } catch (error) {
    console.error('Claude streaming API error:', error);
    
    // Main error handler with friendly messages
    let friendlyMessage = '❌ Služba je dočasně nedostupná';
    
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      friendlyMessage = '⏰ Překročen časový limit - zkuste kratší prompt nebo to zkuste později';
    } else if (error.message?.includes('fetch')) {
      friendlyMessage = '📡 Problém s připojením k AI službě - zkuste to znovu';
    } else if (error.message?.includes('authentication') || error.message?.includes('API key')) {
      friendlyMessage = '🔐 Problém s autentizací AI služby - kontaktujte podporu';
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('network')) {
      friendlyMessage = '🌐 Problém se síťovým připojením - zkontrolujte internetové připojení';
    }
    
    res.write(`data: ${JSON.stringify({ type: 'error', error: friendlyMessage })}\n\n`);
    res.end();
  }
}