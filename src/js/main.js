const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

// List of views
let indexView;
let addIngredientView;

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
        width: 500,
        height: 760,
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

    addIngredientView.on('closed', () => {
        addIngredientView = null;
        // Send a message to the renderer process to refresh the table
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('refresh-ingredient-list');
          });

    });
});

// IPC listener to open a new window
ipcMain.on('open-add-recipe-window', (event, arg) => {
    let addIngredientView = new BrowserWindow({
        width: 1500,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    addIngredientView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/addRecipe.html'),
        protocol: 'file:',
        slashes: true
    }));

    addIngredientView.webContents.openDevTools();
});

// IPC listener to open a new window
ipcMain.on('open-ingredient-list-window', (event, arg) => {
    let ingredientListView = new BrowserWindow({
        width: 1100,
        height: 500,
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

// IPC listener to read ingredient file content
ipcMain.on('read-ingredient-file', (event, ingredientName) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            event.reply('read-ingredient-file-response', null);
        } else {
            console.log('File read successfully:', ingredientName);
            event.reply('read-ingredient-file-response', JSON.parse(data));
        }
    });
});

// IPC listener to get file names for autocompletion
ipcMain.on('get-recipe-names', (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Recipes');
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Failed to read directory:', err);
            event.reply('recipe-names-response', []);
        } else {
            const fileNames = files.map(file => path.parse(file).name);
            event.reply('recipe-names-response', fileNames);
        }
    });
});

// IPC listener to read recipe file content
ipcMain.on('read-recipe-file', (event, recipeName) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            event.reply('read-recipe-file-response', null);
        } else {
            event.reply('read-recipe-file-response', JSON.parse(data));
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

// IPC listener to get ingredient types from all ingredient files
ipcMain.on('get-ingredient-types', (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Failed to read directory:', err);
            event.reply('ingredient-types-response', []);
        } else {
            const types = new Set();
            files.forEach(file => {
                const filePath = path.join(directoryPath, file);
                const data = fs.readFileSync(filePath, 'utf8');
                const ingredient = JSON.parse(data);
                if (ingredient.type) {
                    types.add(ingredient.type);
                }
            });
            event.reply('ingredient-types-response', Array.from(types));
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

// IPC listener to create or update recipe file
ipcMain.on('add-ingredient-to-recipe', (event, recipeAndIngredients) => {
    const { recipeName, preparationText, ingredientName, quantity } = recipeAndIngredients;
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        let recipeData;

        if (err) {
            if (err.code === 'ENOENT') {
                // File does not exist, create a new one
                recipeData = {
                    ingredientsArray: [],
                    quantitiesArray: [],
                    preparation: "",
                };
            } else {
                console.error('Failed to read file:', err);
                event.reply('add-ingredient-to-recipe-response', 'failure');
                return;
            }
        } else {
            // File exists, parse the existing data
            recipeData = JSON.parse(data);
        }

        // Check if the ingredient is already in the recipe
        if (recipeData.ingredientsArray.includes(ingredientName)) {
            event.reply('add-ingredient-to-recipe-response', 'Ingredient already exists');
            return;
        }

        // Add the ingredient and quantity to the arrays
        recipeData.ingredientsArray.push(ingredientName);
        recipeData.quantitiesArray.push(quantity);
        recipeData.preparation = preparationText;

        // Write the updated data back to the file
        fs.writeFile(filePath, JSON.stringify(recipeData, null, 2), (err) => {
            if (err) {
                console.error('Failed to write file:', err);
                event.reply('add-ingredient-to-recipe-response', 'failure');
            } else {
                console.log('File updated successfully');
                event.reply('add-ingredient-to-recipe-response', 'success');
            }
        });
    });
});

ipcMain.on('update-recipe-ingredients', (event, recipeAndIngredients) => {
    const { recipeName, ingredientsArray, quantitiesArray } = recipeAndIngredients;
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read file:', err);
            event.reply('update-recipe-ingredients-response', 'failure');
            return;
        }

        let recipeData = JSON.parse(data);
        recipeData.ingredientsArray = ingredientsArray;
        recipeData.quantitiesArray = quantitiesArray;

        fs.writeFile(filePath, JSON.stringify(recipeData, null, 2), (err) => {
            if (err) {
                console.error('Failed to write file:', err);
                event.reply('update-recipe-ingredients-response', 'failure');
            } else {
                console.log('File updated successfully');
                event.reply('update-recipe-ingredients-response', 'success');
            }
        });
    });
});