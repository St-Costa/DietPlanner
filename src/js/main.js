const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// List of views
let indexView;

function createWindow () {
    indexView = new BrowserWindow({
        width: 800, 
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
  
    indexView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    indexView.webContents.openDevTools();

    indexView.on('closed', () => {
        indexView = null;
    });   
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (indexView === null) {
        createWindow();
    }
});

// IPC listener to open a new window
ipcMain.on('open-add-ingredient-window', (event, arg) => {
    let addIngredientView = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    addIngredientView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/addIngredient.html'),
        protocol: 'file:',
        slashes: true
    }));

    addIngredientView.webContents.openDevTools();
});