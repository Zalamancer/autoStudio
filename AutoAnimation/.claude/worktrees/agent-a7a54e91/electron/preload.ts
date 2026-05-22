import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // ---- Dialogs ------------------------------------------------------------
  openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFile'),

  openDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:openDirectory'),

  saveFile: (options: {
    defaultName: string;
    filters: { name: string; extensions: string[] }[];
  }): Promise<string | null> => ipcRenderer.invoke('dialog:saveFile', options),

  // ---- File system --------------------------------------------------------
  writeFile: (filePath: string, data: ArrayBuffer): Promise<boolean> =>
    ipcRenderer.invoke('fs:writeFile', { filePath, data }),

  readFile: (filePath: string): Promise<ArrayBuffer> =>
    ipcRenderer.invoke('fs:readFile', filePath),

  // ---- App paths ----------------------------------------------------------
  getPath: (name: string): Promise<string> => ipcRenderer.invoke('app:getPath', name),

  // ---- Shell --------------------------------------------------------------
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),

  showItemInFolder: (path: string): Promise<void> =>
    ipcRenderer.invoke('shell:showItemInFolder', path),

  // ---- Window controls ----------------------------------------------------
  minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),

  close: (): Promise<void> => ipcRenderer.invoke('window:close'),

  // ---- Platform info ------------------------------------------------------
  platform: process.platform,

  isElectron: true as const,

  // ---- Event listeners ----------------------------------------------------
  onExportProgress: (callback: (data: unknown) => void): (() => void) => {
    ipcRenderer.on('export:progress', (_e, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('export:progress');
    };
  },

  onServerReady: (callback: () => void): (() => void) => {
    ipcRenderer.on('server:ready', () => callback());
    return () => {
      ipcRenderer.removeAllListeners('server:ready');
    };
  },
});
