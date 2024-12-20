const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Funzione per creare la finestra principale
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Carica il file HTML
    win.loadFile('../views/index.html');
}

function createIngredientWindow() {
    console.log('Sto creando un ingrediente');

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Carica il file HTML
    win.loadFile('../views/addIngredient.html');
}

// Quando Electron è pronto, crea la finestra
app.whenReady().then(() => {
    createWindow();

    // Aggiungi il listener per l'evento "open-ingredient-window" inviato dal renderer process
    ipcMain.on('open-ingredient-window', () => {
        createIngredientWindow();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Esci quando tutte le finestre sono chiuse (tranne su macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});