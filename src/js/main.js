const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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

// Add ingredient window
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
        // Send a message to the renderer process to refresh the ingredients list
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('refresh-ingredient-list');
          });

    });
});

// Add recipe window
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

// Open ingriedient list window
ipcMain.on('open-ingredient-list-window', (event, arg) => {
    let ingredientListView = new BrowserWindow({
        width: 1500,
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

// Open recipe list window
ipcMain.on('open-recipe-list-window', (event, arg) => {
    let recipeListView = new BrowserWindow({
        width: 1100,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    recipeListView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/recipeList.html'),
        protocol: 'file:',
        slashes: true
    }));

    recipeListView.webContents.openDevTools();
});


/****
CREATE FILES
****/
ipcMain.handle('create-ingredient-file', async (event, ingredientName, ingredientData) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
    let result = createFile(filePath, ingredientData);
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('refresh-ingredient-list');
    });
    return result;
});

ipcMain.handle('create-recipe-file', async (event, recipeName, recipeData) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    return createFile(filePath, recipeData);
});

async function createFile(filePath, fileContent) {
    if (fs.existsSync(filePath)) {
        console.error('File already exists:', filePath);
        return 'file-exists';
    } else {
        try {
            await fs.promises.writeFile(filePath, JSON.stringify(fileContent, null, 2));
            console.log('File created successfully');
            return 'success';
        } catch (err) {
            console.error('Failed to create file:', err);
            return 'failure';
        }
    }
}




// IPC listener to read recipe file content
ipcMain.handle('read-ingredient-file', async (event, ingredientName) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
    return readJsonFile(filePath);
});

// Reading file content
async function readJsonFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Failed to read file:', err);
        return null;
    }
}

/**** DELETE FILES   */
ipcMain.handle('get-recipes-using-ingredient', async (event, ingredient) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Recipes');
    const recipeNames = await readFilesNameFromDirectory(directoryPath);

    let recipesUsingIngredient = [];

    for (const recipe of recipeNames) {
        try {
            const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipe}.json`);
            const recipeData = await readJsonFile(filePath);
            if (recipeData.ingredientsArray.includes(ingredient)) {
                recipesUsingIngredient.push(recipe);
            }
        } catch (err) {
            console.error(`Failed to read recipe file for ${recipe}:`, err);
        }
    }

    return recipesUsingIngredient;
});

ipcMain.handle('delete-ingredient', async (event, ingredient) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredient}.json`);
    console.log(filePath);
    let resultOfDeletion = await deleteFile(filePath);
    
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('refresh-ingredient-list');
    });

    return resultOfDeletion;
});

ipcMain.handle('delete-recipe', async (event, recipe) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipe}.json`);
    return deleteFile(filePath);
});

async function deleteFile(filePath) {
    try {
        await fs.promises.unlink(filePath);
        console.log('File deleted successfully');
        return true;
    } catch (err) {
        console.error('Failed to delete file:', err);
        return false;
    }
}

/*** READ ALL FILE */
ipcMain.handle('get-recipe-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Recipes');
    return readFilesNameFromDirectory(directoryPath);
});

ipcMain.handle('get-ingredient-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    return readFilesNameFromDirectory(directoryPath);
});

async function readFilesNameFromDirectory(directoryPath) {
    try {
        const files = await fs.promises.readdir(directoryPath);
        const fileNames = files.map(file => path.parse(file).name);
        return fileNames;
    } catch (err) {
        console.error('Failed to read directory:', err);
        return [];
    }
}

// IPC listener to read recipe file content
ipcMain.handle('read-recipe-file', async (event, recipeName) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    return readJsonFile(filePath);
});

// Update files (overwriting)
ipcMain.handle('update-ingredient-file', async (event, ingredientName, fileContent) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
    let result = updateFile(filePath, fileContent);
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('refresh-ingredient-list');
    });
    return result;
});

ipcMain.handle('update-recipe-file', async (event, recipeName, fileContent) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    return updateFile(filePath, fileContent);
});

async function updateFile(filePath, fileContent) {
    if (typeof fileContent !== 'string') {
        fileContent = JSON.stringify(fileContent, null, 2);
    }
    if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        return 'file-not-found';
    }
    try {
        await fs.promises.writeFile(filePath, fileContent);
        console.log('File updated successfully');
        return 'success';
    } catch (err) {
        console.error('Failed to update file:', err);
        return 'failure';
    }
}


// IPC listener to get ingredient types from all ingredient files
ipcMain.handle('get-ingredient-types', async () => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    const ingredientNames = await readFilesNameFromDirectory(directoryPath);
    const types = new Set();

    for (const ingredient of ingredientNames) {
        const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredient}.json`);
        const data = await readJsonFile(filePath);
        if (data.type) {
            types.add(data.type);
        }
    }
    return Array.from(types);
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

ipcMain.on('update-recipe-preparation', (event, recipeAndpreparation) => {
    const { recipeName, preparationText } = recipeAndpreparation;
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err.code === 'ENOENT') {
            // File does not exist, create a new one
            recipeData = {
                ingredientsArray: [],
                quantitiesArray: [],
                preparation: preparationText,
            };
            fs.writeFile(filePath, JSON.stringify(recipeData, null, 2), (err) => {
                if (err) {
                    console.error('Failed to write file:', err);
                    event.reply('update-recipe-preparation-response', 'failure');
                } else {
                    event.reply('update-recipe-preparation-response', 'created');
                }
            });
        }
        else if (err) {
            console.error('Failed to read file:', err);
            event.reply('update-recipe-preparation-response', 'failure');
            return;
        }
        else {
            // File exists, update recipe
            let recipeData = JSON.parse(data);
            recipeData.preparation = preparationText;
    
            fs.writeFile(filePath, JSON.stringify(recipeData, null, 2), (err) => {
                if (err) {
                    console.error('Failed to write file:', err);
                    event.reply('update-recipe-preparation-response', 'failure');
                } else {
                    console.log('File updated successfully');
                    event.reply('update-recipe-preparation-response', 'update');
                }
            });
        }

    });
});
