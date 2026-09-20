"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const ROOT = path.resolve(__dirname, "../..");
app.setAppPath(ROOT);

function report(message) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  const logPath = String(process.env.BBM_AUDIO_IMPORT_PROBE_LOG || "").trim();
  if (logPath) fs.appendFileSync(logPath, `${line}\n`, "utf8");
}

const originalHandle = ipcMain.handle.bind(ipcMain);
ipcMain.handle = (channel, handler) => originalHandle(channel, async (...args) => {
  if (channel === "audio:chooseProtocolImportFile") {
    report("AUDIO_IMPORT_PROBE IPC_HANDLER_ENTER audio:chooseProtocolImportFile");
  }
  if (channel === "audio:runProtocolImport") {
    report(`AUDIO_IMPORT_PROBE RUN_HANDLER_ENTER ${JSON.stringify(args[1] || null)}`);
  }
  const result = await handler(...args);
  if (channel === "audio:chooseProtocolImportFile") {
    report(`AUDIO_IMPORT_PROBE NATIVE_DIALOG_RESULT ${JSON.stringify(result)}`);
  }
  if (channel === "audio:runProtocolImport") {
    report(`AUDIO_IMPORT_PROBE RUN_HANDLER_RESULT ${JSON.stringify(result)}`);
    const sender = args[0]?.sender || null;
    setTimeout(async () => {
      const window = sender ? BrowserWindow.fromWebContents(sender) : null;
      if (!window || window.isDestroyed()) return;
      try {
        const visible = await window.webContents.executeJavaScript(`(() => {
          const bodyText = String(document.body?.innerText || '');
          const button = document.querySelector('[data-quicklane-action="audio-import"]');
          return {
            buttonDisabled: button?.disabled ?? null,
            hasImportTitle: bodyText.includes('Import'),
            hasBaustellenueberfahrt: bodyText.includes('Baustellenüberfahrt'),
            hasParkverbot: bodyText.includes('Parkverbot in der Kehre'),
            hasBaustellenWc: bodyText.includes('Baustellen-WC'),
            bodyExcerpt: bodyText.slice(-2600),
          };
        })()`, true);
        report(`AUDIO_IMPORT_PROBE VISIBLE_RESULT ${JSON.stringify(visible)}`);
      } catch (error) {
        report(`AUDIO_IMPORT_PROBE VISIBLE_RESULT_FAILED ${error?.stack || error?.message || error}`);
      }
    }, 3000);
  }
  return result;
});

const originalShowOpenDialog = dialog.showOpenDialog.bind(dialog);
dialog.showOpenDialog = (...args) => {
  report("AUDIO_IMPORT_PROBE NATIVE_DIALOG_ENTER showOpenDialog");
  return originalShowOpenDialog(...args);
};

app.on("browser-window-created", (_event, window) => {
  if (!(window instanceof BrowserWindow)) return;
  window.webContents.once("did-finish-load", async () => {
    try {
      const diagnostics = await window.webContents.executeJavaScript(`
        Promise.all([
          window.bbmDb?.licenseGetStatus?.(),
          window.bbmDb?.appSettingsGetMany?.(['dev.audioDictationUnlock']),
        ]).then(([license, settings]) => ({ license, settings }))
      `, true);
      report(`AUDIO_IMPORT_PROBE AUDIO_DIAGNOSTICS ${JSON.stringify(diagnostics)}`);
      const result = await window.webContents.executeJavaScript(`
        new Promise((resolve, reject) => {
          const expiresAt = Date.now() + 15000;
          let lastObservation = null;
          const timer = setInterval(() => {
            const button = document.querySelector('[data-quicklane-action="audio-import"]');
            lastObservation = button ? {
              disabled: button.disabled,
              title: button.title,
              ariaDisabled: button.getAttribute('aria-disabled'),
              connected: button.isConnected,
              quicklaneButtons: [...document.querySelectorAll('.bbm-tops-screen-quicklane__button')].map((item) => ({
                title: item.title,
                disabled: item.disabled,
                pressed: item.getAttribute('aria-pressed'),
              })),
              bodyText: String(document.body?.innerText || '').slice(0, 500),
            } : {
              disabled: null,
              title: null,
              bodyText: String(document.body?.innerText || '').slice(0, 500),
            };
            if (button && button.disabled !== true) {
              clearInterval(timer);
              const observed = {
                tagName: button.tagName,
                title: button.title,
                ariaLabel: button.getAttribute('aria-label'),
                disabled: button.disabled,
                action: button.dataset.quicklaneAction,
              };
              button.click();
              resolve(observed);
              return;
            }
            if (Date.now() >= expiresAt) {
              clearInterval(timer);
              reject(new Error('AUDIO_IMPORT_BUTTON_NOT_READY:' + JSON.stringify(lastObservation)));
            }
          }, 100);
        })
      `, true);
      report(`AUDIO_IMPORT_PROBE RENDERER_CLICK ${JSON.stringify(result)}`);
    } catch (error) {
      console.error("AUDIO_IMPORT_PROBE FAILED", error?.stack || error?.message || error);
      process.exitCode = 1;
      app.quit();
    }
  });
});

require(path.join(ROOT, "src/main/main.js"));
