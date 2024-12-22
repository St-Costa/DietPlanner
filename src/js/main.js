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

// IPC listener to open a new window
ipcMain.on('open-ingredient-list-window', (event, arg) => {
    let ingredientListView = new BrowserWindow({
        width: 1200,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    ingredientListView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/ingredientsList.html'),
        protocol: 'file:',
        slashes: true
    }));

    ingredientListView.webContents.openDevTools();
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

// IPC listener to update a file
ipcMain.on('update-file', (event, fileName, fileContent) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', fileName);
    fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
            console.error('Failed to update file:', err);
            event.reply('update-file-response', 'failure');
        } else {
            console.log('File updated successfully');
            event.reply('update-file-response', 'success');
        }
    });
});

// IPC listener to check and update ingredient types
ipcMain.on('check-update-ingredient-type', (event, ingredientType) => {
    const filePath = path.join(__dirname, '../../Pantry', 'ingredients types.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File does not exist, create it with the new type
                const types = [ingredientType];
                fs.writeFile(filePath, JSON.stringify(types, null, 2), (err) => {
                    if (err) {
                        console.error('Failed to create file:', err);
                        event.reply('check-update-ingredient-type-response', 'failure');
                    } else {
                        console.log('File created successfully');
                        event.reply('check-update-ingredient-type-response', 'success');
                    }
                });
            } else {
                console.error('Failed to read file:', err);
                event.reply('check-update-ingredient-type-response', 'failure');
            }
        } else {
            const types = JSON.parse(data);
            if (!types.includes(ingredientType)) {
                types.push(ingredientType);
                fs.writeFile(filePath, JSON.stringify(types, null, 2), (err) => {
                    if (err) {
                        console.error('Failed to update file:', err);
                        event.reply('check-update-ingredient-type-response', 'failure');
                    } else {
                        console.log('File updated successfully');
                        event.reply('check-update-ingredient-type-response', 'success');
                    }
                });
            } else {
                event.reply('check-update-ingredient-type-response', 'exists');
            }
        }
    });
});

// IPC listener to get ingredient types for autocompletion
ipcMain.on('get-ingredient-types', (event) => {
    const filePath = path.join(__dirname, '../../Pantry', 'ingredients types.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            event.reply('ingredient-types-response', []);
        } else {
            const types = JSON.parse(data);
            event.reply('ingredient-types-response', types);
        }
    });
});

// IPC listener to get ingredient list
ipcMain.on('get-ingredient-list', (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Failed to read directory:', err);
            event.reply('ingredient-list-response', []);
        } else {
            const ingredients = files.map(file => {
                const filePath = path.join(directoryPath, file);
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            });
            event.reply('ingredient-list-response', ingredients);
        }
    });
});