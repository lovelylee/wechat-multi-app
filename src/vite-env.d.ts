/// <reference types="vite/client" />

interface WeChatInstance {
    name: string;
    path: string;
    isOriginal: boolean;
    bundleId?: string;
    version?: string;
}

interface Window {
    ipcRenderer: {
        invoke(channel: 'wechat:check'): Promise<boolean>;
        invoke(channel: 'wechat:scan'): Promise<WeChatInstance[]>;
        invoke(channel: 'wechat:create', name: string, count: number): Promise<boolean>;
        invoke(channel: 'wechat:launch', path: string): Promise<void>;
        invoke(channel: 'wechat:stop', path: string): Promise<void>;
        invoke(channel: 'wechat:delete', path: string): Promise<void>;
        invoke(channel: 'wechat:rename', oldPath: string, newName: string): Promise<void>;
        invoke(channel: 'wechat:reconstructAll'): Promise<void>;
        invoke(channel: 'wechat:running'): Promise<string[]>;
        invoke(channel: 'wechat:killAll'): Promise<void>;
        // Generic overrides
        invoke(channel: string, ...args: any[]): Promise<any>;
        on(channel: string, func: (...args: any[]) => void): () => void;
        // ... others if needed
    }
}
