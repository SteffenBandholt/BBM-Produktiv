// src/main/print/printPreload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bbmPrint", {
  onInit: (cb) => {
    if (typeof cb !== "function") return;
    ipcRenderer.on("print:init", (_evt, payload) => cb(payload));
  },
  getData: (payload) => ipcRenderer.invoke("print:getData", payload),
  ready: (payload) => ipcRenderer.send("print:ready", payload),
});
