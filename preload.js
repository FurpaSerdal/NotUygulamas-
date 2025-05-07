const { contextBridge, ipcRenderer } = require('electron');

// Renderer sürecine güvenli bir şekilde ipcRenderer'ı expose etmek
contextBridge.exposeInMainWorld('api', {
  openModelWindow: () => ipcRenderer.send('open-model-window'), // 'open-model-window' mesajını gönder
  openModelAnasayfa: () => ipcRenderer.send('open-model-Anasayfa'), // 'open-model-Anasayfa' mesajını gönder
});
