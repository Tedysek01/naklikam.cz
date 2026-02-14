import { createContainer, getServerBridge, ViteDevServer, PackageManager as PackageManagerClass } from 'almostnode';
import { ProjectFile } from '@/types';

import type { VirtualFS, PackageManager, ServerBridge } from 'almostnode';

type ExecuteFn = (code: string, filename?: string) => { exports: unknown };

// Sandbox URL from env — if set, preview runs on a separate origin for isolation
const SANDBOX_URL = import.meta.env.VITE_SANDBOX_URL as string | undefined;

interface SandboxMessage {
  type: string;
  id?: number;
  [key: string]: unknown;
}

class ContainerService {
  private static vfs: VirtualFS | null = null;
  private static npm: PackageManager | null = null;
  private static serverBridge: ServerBridge | null = null;
  private static viteServer: ViteDevServer | null = null;
  private static executeFn: ExecuteFn | null = null;
  private static initialized = false;
  private static currentProjectId: string | null = null;
  private static setupPromises: Map<string, Promise<boolean>> = new Map();

  public onOutput: ((data: string) => void) | null = null;
  private serverUrl: string | null = null;
  // Unique port per session to avoid multi-tab collisions in the shared SW
  private static devServerPort = 5173 + Math.floor(Math.random() * 9000);

  // Sandbox state
  private static sandboxIframe: HTMLIFrameElement | null = null;
  private static sandboxOrigin: string | null = null;
  private static pendingMessages: Map<number, { resolve: (data: SandboxMessage) => void; reject: (err: Error) => void }> = new Map();
  private static messageId = 0;
  private static sandboxMessageHandler: ((event: MessageEvent) => void) | null = null;
  private static vfsSyncChangeListener: ((path: string, content: string) => void) | null = null;
  private static vfsSyncDeleteListener: ((path: string) => void) | null = null;

  private get useSandbox(): boolean {
    return !!SANDBOX_URL;
  }

  constructor() {
    console.log('[Container] Service initialized - using almostnode');
  }

  // Get package.json hash from localStorage with project-specific key
  private getStoredPackageJsonHash(projectId?: string): string | null {
    if (typeof window === 'undefined') return null;
    const key = `container-package-hash-${projectId || 'default'}`;
    return localStorage.getItem(key);
  }

  // Store package.json hash in localStorage with project-specific key
  private storePackageJsonHash(hash: string, projectId?: string): void {
    if (typeof window === 'undefined') return;
    const key = `container-package-hash-${projectId || 'default'}`;
    localStorage.setItem(key, hash);
  }

  async initialize(_projectId?: string): Promise<void> {
    if (ContainerService.initialized && ContainerService.vfs) {
      console.log('[Container] Already initialized');
      return;
    }

    console.log('[Container] Creating container...');

    const container = createContainer({ cwd: '/app' });
    ContainerService.vfs = container.vfs;
    // createContainer bug: PackageManager created without cwd, defaults to '/'.
    // Create our own with correct cwd so installFromPackageJson finds /app/package.json.
    ContainerService.npm = new PackageManagerClass(container.vfs, { cwd: '/app' });
    ContainerService.executeFn = container.execute;

    if (this.useSandbox) {
      // Sandbox mode: skip local ServerBridge, set up hidden control iframe
      console.log('[Container] Sandbox mode: creating control iframe to', SANDBOX_URL);
      await this.initSandboxIframe();
    } else {
      // Same-origin fallback: use local ServerBridge
      ContainerService.serverBridge = getServerBridge();
      await ContainerService.serverBridge.initServiceWorker();
    }

    ContainerService.initialized = true;
    console.log('[Container] Container created successfully (instant, no boot delay)');
  }

  private async initSandboxIframe(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const url = new URL(SANDBOX_URL!);
      ContainerService.sandboxOrigin = url.origin;

      // Set up message handler before creating iframe
      this.setupSandboxMessageHandler();

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      // Cache-bust to ensure fresh sandbox page (critical for SW updates + code changes)
      iframe.src = SANDBOX_URL! + '?t=' + Date.now();
      document.body.appendChild(iframe);
      ContainerService.sandboxIframe = iframe;

      const timeout = setTimeout(() => {
        reject(new Error('Sandbox iframe failed to load within 15s'));
      }, 15000);

      // Wait for the 'ready' message from sandbox
      const onReady = (event: MessageEvent) => {
        if (event.origin !== ContainerService.sandboxOrigin) return;
        if (event.data?.type === 'ready') {
          clearTimeout(timeout);
          window.removeEventListener('message', onReady);
          console.log('[Container] Sandbox iframe ready');
          resolve();
        }
      };
      window.addEventListener('message', onReady);
    });
  }

  private setupSandboxMessageHandler(): void {
    if (ContainerService.sandboxMessageHandler) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== ContainerService.sandboxOrigin) return;

      const data = event.data as SandboxMessage;
      if (!data || !data.type) return;

      // Forward console messages from sandbox
      if (data.type === 'console' && this.onOutput) {
        const method = data.consoleMethod as string;
        const args = data.consoleArgs as unknown[];
        this.onOutput(`[sandbox:${method}] ${args.map(String).join(' ')}\n`);
        return;
      }

      // Resolve pending promise by message ID
      if (data.id !== undefined && ContainerService.pendingMessages.has(data.id)) {
        const pending = ContainerService.pendingMessages.get(data.id)!;
        ContainerService.pendingMessages.delete(data.id);
        if (data.type === 'devServerError') {
          pending.reject(new Error(data.error as string));
        } else {
          pending.resolve(data);
        }
      }
    };

    ContainerService.sandboxMessageHandler = handler;
    window.addEventListener('message', handler);
  }

  private sendToSandbox(message: SandboxMessage): Promise<SandboxMessage> {
    return new Promise((resolve, reject) => {
      if (!ContainerService.sandboxIframe?.contentWindow) {
        reject(new Error('Sandbox iframe not available'));
        return;
      }

      const id = ContainerService.messageId++;
      message.id = id;

      ContainerService.pendingMessages.set(id, { resolve, reject });
      ContainerService.sandboxIframe.contentWindow.postMessage(message, ContainerService.sandboxOrigin!);

      // Timeout after 30s
      setTimeout(() => {
        if (ContainerService.pendingMessages.has(id)) {
          ContainerService.pendingMessages.delete(id);
          reject(new Error(`Sandbox message timeout: ${message.type}`));
        }
      }, 30000);
    });
  }

  private sendToSandboxFire(message: SandboxMessage): void {
    if (!ContainerService.sandboxIframe?.contentWindow) return;
    ContainerService.sandboxIframe.contentWindow.postMessage(message, ContainerService.sandboxOrigin!);
  }

  private setupVFSSyncToSandbox(): void {
    const vfs = ContainerService.vfs!;

    // Remove any existing listeners
    this.teardownVFSSync();

    const changeListener = (path: string, content: string) => {
      this.sendToSandboxFire({ type: 'syncFile', path, content });
    };

    const deleteListener = (path: string) => {
      this.sendToSandboxFire({ type: 'syncFile', path, content: null });
    };

    vfs.on('change', changeListener);
    vfs.on('delete', deleteListener);

    ContainerService.vfsSyncChangeListener = changeListener;
    ContainerService.vfsSyncDeleteListener = deleteListener;

    console.log('[Container] VFS sync to sandbox active');
  }

  private teardownVFSSync(): void {
    if (!ContainerService.vfs) return;

    if (ContainerService.vfsSyncChangeListener) {
      ContainerService.vfs.off('change', ContainerService.vfsSyncChangeListener);
      ContainerService.vfsSyncChangeListener = null;
    }
    if (ContainerService.vfsSyncDeleteListener) {
      ContainerService.vfs.off('delete', ContainerService.vfsSyncDeleteListener);
      ContainerService.vfsSyncDeleteListener = null;
    }
  }

  async setupProject(files: ProjectFile[], projectId?: string): Promise<boolean> {
    const setupKey = projectId || 'default';

    // Check if setup is already in progress for this project
    if (ContainerService.setupPromises.has(setupKey)) {
      console.log(`[Container] Setup already in progress for ${setupKey}, waiting...`);
      return await ContainerService.setupPromises.get(setupKey)!;
    }

    const setupPromise = this._setupProjectInternal(files, projectId);
    ContainerService.setupPromises.set(setupKey, setupPromise);

    try {
      return await setupPromise;
    } finally {
      ContainerService.setupPromises.delete(setupKey);
    }
  }

  private async _setupProjectInternal(files: ProjectFile[], projectId?: string): Promise<boolean> {
    await this.initialize(projectId);
    const vfs = ContainerService.vfs!;

    console.log(`[Container] Setting up project with ${files.length} files`);

    const projectChanged = ContainerService.currentProjectId !== projectId;
    if (projectChanged) {
      console.log(`[Container] Project changed from ${ContainerService.currentProjectId} to ${projectId}`);
      ContainerService.currentProjectId = projectId || null;
    }

    // Check if package.json changed to determine if we need to reinstall dependencies
    const packageJsonFile = files.find(f => f.name === 'package.json' || f.path === '/package.json');
    let packageJsonChanged = false;

    if (packageJsonFile && packageJsonFile.content) {
      const currentHash = this.hashString(packageJsonFile.content);
      const storedHash = this.getStoredPackageJsonHash(projectId);
      packageJsonChanged = storedHash !== currentHash;

      // Check if dependencies are actually installed
      let dependenciesExist = false;
      try {
        vfs.readdirSync('/app/node_modules');
        dependenciesExist = true;
        console.log('[Container] node_modules directory exists');
      } catch {
        console.log('[Container] node_modules directory does not exist');
      }

      if (packageJsonChanged || !dependenciesExist || projectChanged) {
        let reason = '';
        if (packageJsonChanged) reason = 'package.json changed';
        else if (!dependenciesExist) reason = 'node_modules not found';
        else if (projectChanged) reason = 'switched to different project';

        console.log('[Container] Dependencies will be reinstalled - reason:', reason);
        if (packageJsonChanged) {
          console.log('[Container] Previous hash:', storedHash?.substring(0, 8), '-> New hash:', currentHash.substring(0, 8));
        }
        this.storePackageJsonHash(currentHash, projectId);
        packageJsonChanged = true;
      } else {
        console.log('[Container] package.json unchanged, dependencies exist, same project - skipping dependency installation');
      }
    } else {
      console.log('[Container] No package.json found in project');
    }

    // Write all files to VirtualFS
    for (const file of files) {
      if (!file.isDirectory && file.content !== undefined) {
        const path = file.path.startsWith('/app/') ? file.path :
                     file.path.startsWith('/') ? `/app${file.path}` :
                     `/app/${file.path}`;

        if (file.path.includes('package.json')) {
          console.log('[Container] Writing package.json:', {
            path,
            contentPreview: file.content.substring(0, 100)
          });
        }

        // writeFileSync auto-creates parent directories
        vfs.writeFileSync(path, file.content);
      }
    }

    // Inject import map into index.html to fix bare specifier resolution.
    // almostnode's ViteDevServer only transforms .jsx/.tsx/.ts but not .js,
    // so node_modules .js files with bare imports like "react/jsx-runtime" fail.
    this.injectImportMap(vfs);

    console.log('[Container] All project files written to VirtualFS');
    return packageJsonChanged;
  }

  private injectImportMap(vfs: VirtualFS): void {
    const indexPath = '/app/index.html';
    try {
      const html = vfs.readFileSync(indexPath, 'utf8') as string;
      if (html.includes('<script type="importmap"')) return; // already has one

      const importMap = {
        imports: {
          "react": "https://esm.sh/react@18.2.0?dev",
          "react/": "https://esm.sh/react@18.2.0&dev/",
          "react-dom": "https://esm.sh/react-dom@18.2.0?dev",
          "react-dom/": "https://esm.sh/react-dom@18.2.0&dev/"
        }
      };

      const tag = `<script type="importmap">${JSON.stringify(importMap)}</script>`;
      const patched = html.replace('<head>', `<head>\n${tag}`);
      vfs.writeFileSync(indexPath, patched);
      console.log('[Container] Injected import map into index.html');
    } catch {
      // index.html may not exist yet, ignore
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  async writeFile(path: string, content: string, _projectId?: string): Promise<void> {
    await this.initialize();
    const vfs = ContainerService.vfs!;
    const fullPath = path.startsWith('/app/') ? path :
                     path.startsWith('/') ? `/app${path}` :
                     `/app/${path}`;
    vfs.writeFileSync(fullPath, content);
    console.log(`[Container] Updated single file: ${fullPath}`);
    // VFS 'change' event fires automatically — sandbox sync picks it up
  }

  async updateFiles(fileUpdates: Array<{path: string, content: string}>, projectId?: string): Promise<void> {
    await this.initialize();
    const vfs = ContainerService.vfs!;

    console.log(`[Container] Updating ${fileUpdates.length} files incrementally`);

    const packageJsonUpdate = fileUpdates.find(f => f.path.includes('package.json'));
    const packageJsonChanged = packageJsonUpdate && this.isValidPackageJson(packageJsonUpdate.content);

    for (const update of fileUpdates) {
      try {
        if (update.path.includes('package.json') && !this.isValidPackageJson(update.content)) {
          console.error('[Container] Skipping invalid package.json update:', {
            path: update.path,
            contentStart: update.content.substring(0, 50)
          });
          continue;
        }

        const fullPath = update.path.startsWith('/app/') ? update.path :
                         update.path.startsWith('/') ? `/app${update.path}` :
                         `/app/${update.path}`;
        vfs.writeFileSync(fullPath, update.content);
        console.log(`[Container] Updated: ${fullPath}`);
        // VFS 'change' event fires automatically — sandbox sync picks it up
      } catch (error) {
        console.error(`[Container] Failed to update ${update.path}:`, error);
      }
    }

    if (packageJsonChanged) {
      console.log('[Container] Package.json changed, reinstalling dependencies...');
      await this.installDependencies(projectId);
    }
  }

  private isValidPackageJson(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return typeof parsed === 'object' && parsed !== null &&
             typeof parsed.name === 'string';
    } catch {
      return false;
    }
  }

  async readFile(path: string, _projectId?: string): Promise<string> {
    await this.initialize();
    const vfs = ContainerService.vfs!;
    const fullPath = path.startsWith('/app/') ? path :
                     path.startsWith('/') ? `/app${path}` :
                     `/app/${path}`;
    const content = vfs.readFileSync(fullPath, 'utf8');
    return typeof content === 'string' ? content : new TextDecoder().decode(content as Uint8Array);
  }

  getPreviewUrl(): string | null {
    return this.serverUrl;
  }

  async installDependencies(projectId?: string): Promise<void> {
    await this.initialize();
    const npm = ContainerService.npm!;
    const vfs = ContainerService.vfs!;

    console.log('[Container] Installing dependencies...');

    if (this.onOutput) {
      this.onOutput('[npm install] Instaluji závislosti...\n');
    }

    // Log package.json content
    try {
      const packageJsonContent = vfs.readFileSync('/app/package.json', 'utf8') as string;
      console.log('[Container] package.json content:', packageJsonContent);
      const packageData = JSON.parse(packageJsonContent);
      console.log('[Container] Dependencies to install:', packageData.dependencies);
      console.log('[Container] DevDependencies to install:', packageData.devDependencies);
    } catch (error) {
      console.error('[Container] Failed to read package.json:', error);
    }

    try {
      const result = await npm.installFromPackageJson({
        onProgress: (message: string) => {
          console.log('[npm install]', message);
          if (this.onOutput) {
            this.onOutput(`[npm install] ${message}\n`);
          }
        }
      });

      console.log('[Container] Dependencies installed successfully:', result);

      if (this.onOutput) {
        this.onOutput('[npm install] Instalace dokončena!\n');
      }

      // Update stored hash
      if (projectId) {
        try {
          const packageContent = vfs.readFileSync('/app/package.json', 'utf8') as string;
          this.storePackageJsonHash(this.hashString(packageContent), projectId);
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('[Container] npm install failed:', error);

      if (this.onOutput) {
        this.onOutput(`[npm install] Chyba: ${error instanceof Error ? error.message : String(error)}\n`);
      }

      throw new Error(`npm install failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('[Container] Dependencies installation completed successfully');
  }

  async startDevServer(_projectId?: string): Promise<string | null> {
    await this.initialize();

    if (this.useSandbox) {
      return this.startDevServerSandbox();
    }

    return this.startDevServerLocal();
  }

  private async startDevServerLocal(): Promise<string | null> {
    const vfs = ContainerService.vfs!;
    const bridge = ContainerService.serverBridge!;

    // Stop any existing dev server
    if (ContainerService.viteServer) {
      console.log('[Container] Stopping existing dev server...');
      ContainerService.viteServer.stop();
      bridge.unregisterServer(ContainerService.devServerPort);
      ContainerService.viteServer = null;
    }

    this.serverUrl = null;

    console.log('[Container] Starting Vite dev server...');

    if (this.onOutput) {
      this.onOutput('[dev server] Spouštím Vite dev server...\n');
    }

    try {
      const server = new ViteDevServer(vfs, { port: ContainerService.devServerPort, root: '/app' });
      ContainerService.viteServer = server;

      // ViteDevServer has the handleRequest method needed by ServerBridge
      bridge.registerServer(server as any, ContainerService.devServerPort);
      server.start();

      const url = bridge.getServerUrl(ContainerService.devServerPort);
      this.serverUrl = url;

      console.log(`[Container] Vite dev server ready at ${url}`);

      if (this.onOutput) {
        this.onOutput(`[dev server] Server připraven na ${url}\n`);
      }

      return url;
    } catch (error) {
      console.error('[Container] Failed to start dev server:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.storeDevServerError(errorMessage);

      if (this.onOutput) {
        this.onOutput(`[dev server] Chyba: ${errorMessage}\n`);
      }

      throw error;
    }
  }

  private async startDevServerSandbox(): Promise<string | null> {
    const vfs = ContainerService.vfs!;

    this.serverUrl = null;

    console.log('[Container] Starting dev server via sandbox...');

    if (this.onOutput) {
      this.onOutput('[dev server] Spouštím Vite dev server v sandboxu...\n');
    }

    try {
      // Send full VFS snapshot to sandbox
      const snapshot = vfs.toSnapshot();

      // Fire-and-forget init, wait for initComplete
      const initPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Sandbox init timeout')), 30000);

        const handler = (event: MessageEvent) => {
          if (event.origin !== ContainerService.sandboxOrigin) return;
          if (event.data?.type === 'initComplete') {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve();
          } else if (event.data?.type === 'devServerError' && !event.data?.id) {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };
        window.addEventListener('message', handler);

        this.sendToSandboxFire({ type: 'init', vfsSnapshot: snapshot });
      });

      await initPromise;
      console.log('[Container] Sandbox VFS initialized');

      // Start dev server on sandbox
      const response = await this.sendToSandbox({
        type: 'startDevServer',
        port: ContainerService.devServerPort,
        root: '/app'
      });

      // The sandbox returns a same-origin URL (e.g. /__virtual__/5173/).
      // Prepend the sandbox origin to make it absolute.
      let url = response.url as string;
      if (url && !url.startsWith('http')) {
        url = `${ContainerService.sandboxOrigin}${url}`;
      }

      this.serverUrl = url;

      // Set up VFS sync for subsequent file changes
      this.setupVFSSyncToSandbox();

      console.log(`[Container] Sandbox dev server ready at ${url}`);

      if (this.onOutput) {
        this.onOutput(`[dev server] Server připraven na ${url}\n`);
      }

      return url;
    } catch (error) {
      console.error('[Container] Failed to start sandbox dev server:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.storeDevServerError(errorMessage);

      if (this.onOutput) {
        this.onOutput(`[dev server] Chyba: ${errorMessage}\n`);
      }

      throw error;
    }
  }

  private storeDevServerError(errorMessage: string): void {
    if (typeof window === 'undefined') return;

    // Detect common errors and provide Czech solutions
    let type = 'dev-server-error';
    let message = `Chyba dev serveru: ${errorMessage}`;
    let solution = 'Zkuste restartovat náhled';

    if (errorMessage.includes('Cannot find module') || errorMessage.includes('Module not found')) {
      const moduleMatch = errorMessage.match(/Cannot find module ['"](.*?)['"]|Module not found.*?['"](.*?)['"]/);
      const moduleName = moduleMatch ? (moduleMatch[1] || moduleMatch[2]) : 'neznámý';
      type = 'missing-dependency';
      message = `Chybí závislost: ${moduleName}`;
      solution = `Přidejte chybějící balíček do package.json`;
    } else if (errorMessage.includes('SyntaxError') || errorMessage.includes('Unexpected token')) {
      type = 'syntax-error';
      message = 'Syntaktická chyba v kódu';
      solution = 'Zkontrolujte syntax v souborech projektu';
    } else if (errorMessage.includes('Failed to resolve import')) {
      const importMatch = errorMessage.match(/Failed to resolve import\s+["'](.*?)["']/);
      const importPath = importMatch ? importMatch[1] : 'neznámý';
      type = 'import-error';
      message = `Nelze načíst import: ${importPath}`;
      solution = 'Zkontrolujte cestu k importu nebo nainstalujte chybějící balíček';
    }

    window.localStorage.setItem('webcontainer-error', JSON.stringify({
      type,
      message,
      solution,
      fullError: errorMessage,
      timestamp: Date.now()
    }));
  }

  // Set the HMR target iframe for live reload
  setHMRTarget(iframeWindow: Window): void {
    if (this.useSandbox) {
      // In sandbox mode, HMR is internal to the sandbox — no-op
      return;
    }
    if (ContainerService.viteServer) {
      ContainerService.viteServer.setHMRTarget(iframeWindow);
    }
  }

  // Execute code in the container runtime
  async execute(code: string): Promise<unknown> {
    await this.initialize();
    return ContainerService.executeFn!(code);
  }

  // Execute a shell command (limited shell support via child_process)
  async runCommand(command: string, args: string[] = [], _projectId?: string): Promise<void> {
    await this.initialize();

    const fullCommand = [command, ...args].join(' ');
    console.log(`[Container] Running command: ${fullCommand}`);

    if (this.onOutput) {
      this.onOutput(`$ ${fullCommand}\n`);
    }

    // Route npm commands through the package manager
    if (command === 'npm') {
      if (args[0] === 'install' || args[0] === 'i') {
        const packages = args.slice(1).filter(a => !a.startsWith('-'));
        if (packages.length > 0) {
          for (const pkg of packages) {
            await ContainerService.npm!.install(pkg);
            if (this.onOutput) {
              this.onOutput(`[npm] Nainstalován: ${pkg}\n`);
            }
          }
        } else {
          await this.installDependencies();
        }
        return;
      }
      if (args[0] === 'run' && args[1] === 'dev') {
        await this.startDevServer();
        return;
      }
    }

    // Route fs commands through VirtualFS
    const vfs = ContainerService.vfs!;
    try {
      if (command === 'ls') {
        const dir = args[0] || '/app';
        const fullDir = dir.startsWith('/') ? dir : `/app/${dir}`;
        const entries = vfs.readdirSync(fullDir);
        if (this.onOutput) {
          this.onOutput(entries.join('  ') + '\n');
        }
        return;
      }
      if (command === 'cat') {
        const filePath = args[0];
        if (!filePath) {
          if (this.onOutput) this.onOutput('cat: chybí název souboru\n');
          return;
        }
        const fullPath = filePath.startsWith('/') ? filePath : `/app/${filePath}`;
        const content = vfs.readFileSync(fullPath, 'utf8');
        if (this.onOutput) {
          this.onOutput(String(content) + '\n');
        }
        return;
      }
      if (command === 'pwd') {
        if (this.onOutput) this.onOutput('/app\n');
        return;
      }
      if (command === 'clear') {
        // Handled by terminal panel
        return;
      }
    } catch (error) {
      if (this.onOutput) {
        this.onOutput(`Chyba: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      return;
    }

    // Unsupported commands
    if (this.onOutput) {
      this.onOutput(`Tento příkaz není podporován v prohlížečovém prostředí: ${command}\n`);
    }
  }

  destroy(): void {
    try {
      console.log('[Container] Cleaning up service...');

      // Tear down VFS sync listeners
      this.teardownVFSSync();

      if (ContainerService.viteServer) {
        ContainerService.viteServer.stop();
        ContainerService.viteServer = null;
      }

      if (ContainerService.serverBridge) {
        ContainerService.serverBridge.unregisterServer(ContainerService.devServerPort);
      }

      // Clean up sandbox
      if (ContainerService.sandboxIframe) {
        ContainerService.sandboxIframe.remove();
        ContainerService.sandboxIframe = null;
      }
      if (ContainerService.sandboxMessageHandler) {
        window.removeEventListener('message', ContainerService.sandboxMessageHandler);
        ContainerService.sandboxMessageHandler = null;
      }
      ContainerService.sandboxOrigin = null;
      ContainerService.pendingMessages.clear();
    } catch (error) {
      console.error('[Container] Error during cleanup:', error);
    } finally {
      ContainerService.vfs = null;
      ContainerService.npm = null;
      ContainerService.executeFn = null;
      ContainerService.serverBridge = null;
      ContainerService.initialized = false;
      ContainerService.currentProjectId = null;
      ContainerService.setupPromises.clear();
      this.serverUrl = null;
      this.onOutput = null;
    }
  }
}

export const containerService = new ContainerService();

// Re-export as webContainerService for backward compatibility during migration
export const webContainerService = containerService;
