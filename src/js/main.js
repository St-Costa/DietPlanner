const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

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

// IPC listener to create a file
ipcMain.on('create-file', (event, fileName, fileContent) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', fileName);
    
    if (fs.existsSync(filePath)) {
        console.error('File already exists:', filePath);
        event.reply('create-file-response', 'file-exists');
    } else {
        fs.writeFile(filePath, fileContent, (err) => {
            if (err) {
                console.error('Failed to create file:', err);
                event.reply('create-file-response', 'failure');
            } else {
                console.log('File created successfully');
                event.reply('create-file-response', 'success');
            }
        });
    }
});

// IPC listener to get file names for autocompletion
ipcMain.on('get-ingredient-names', (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Failed to read directory:', err);
            event.reply('ingredient-names-response', []);
        } else {
            const fileNames = files.map(file => path.parse(file).name);
            event.reply('ingredient-names-response', fileNames);
        }
    });
});

// IPC listener to read file content
ipcMain.on('read-ingredient-file', (event, fileName) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${fileName}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            event.reply('read-ingredient-file-response', null);
        } else {
            event.reply('read-ingredient-file-response', JSON.parse(data));
        }
    });
});