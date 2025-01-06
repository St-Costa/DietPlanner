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
        width: 700,
        height: 1000,
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


// Add recipe window
ipcMain.on('open-recipe-grocery-list-window', (event, recipeName) => {
    let recipeGroceryListView = new BrowserWindow({
        width: 1500,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    recipeGroceryListView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/groceryList.html'),
        protocol: 'file:',
        slashes: true
    }));

    recipeGroceryListView.webContents.openDevTools();

    recipeGroceryListView.webContents.on('did-finish-load', () => {
        recipeGroceryListView.webContents.send('init-args', {groceryType: 'recipe',recipeName: recipeName});
    });
});

// Modify actual pantry
ipcMain.on('open-pantry-window', (event, arg) => {
    let pantryView = new BrowserWindow({
        width: 1500,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    pantryView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/pantry.html'),
        protocol: 'file:',
        slashes: true
    }));

    pantryView.webContents.openDevTools();
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
        if(err.code === 'ENOENT') {
            return 'file-not-found';
        }
        else{
            return 'failure';
        }
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
    let resultOfDeletion = await deleteFile(filePath);

    // Refresh all windows
    refreshAllWindows('From delete-ingredient');

    return resultOfDeletion;
});

ipcMain.handle('delete-recipe', async (event, recipe) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipe}.json`);
    let resultOfDeletion = deleteFile(filePath);

    return resultOfDeletion;
});

async function deleteFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        return 'file-not-found';
    }
    try {
        await fs.promises.unlink(filePath);
        console.log('File deleted successfully');
        return 'success';
    } catch (err) {
        console.error('Failed to delete file:', err);
        return 'failure';
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

    // Refresh all windows
    refreshAllWindows('From update-ingredient-file');

    return result;
});

function refreshAllWindows(message) {
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('refresh', message);
    });
}

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
ipcMain.handle('add-ingredient-to-recipe', async (event, recipeAndIngredient) => {
    const { recipeName, ingredientName, ingredientQuantity } = recipeAndIngredient;
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    
    let readingResult = await readJsonFile(filePath);
    let recipeData = {};

    // 'file-not-found' error is not possible here
    switch(readingResult) {
        case 'failure':
            console.error('Failed to read file:', err);
            return 'file-read-failure';
        default:
            recipeData = readingResult;
    }

    // Check if the ingredient is already in the recipe
    if (recipeData.ingredientsArray.includes(ingredientName)) {
        return 'ingredient-already-in-recipe';
    }

    // Update the recipe
    recipeData.ingredientsArray.push(ingredientName);
    recipeData.quantitiesArray.push(ingredientQuantity);

    let overwriteResult = await updateFile(filePath, recipeData);

    return overwriteResult;
});

ipcMain.handle('update-or-create-recipe', async (event, updatedRecipeJSON) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${updatedRecipeJSON.recipeName}.json`);
    const fileContent = updatedRecipeJSON;

    let readingResult = await readJsonFile(filePath);
    switch (readingResult) {
        case 'failure':
            console.error('Failed to read file:', err);
            return 'failure';

        case 'file-not-found': // File does not exist -> create it
            let createResult = await createFile(filePath, fileContent);
            if (createResult === 'success') {
                return 'file-created';
            }
            else {
                return 'file-creation-failure';
            }

        default:    // File exists -> update it
            let updateResult = await updateFile(filePath, fileContent);
            // 'file-not-found' error is not possible here
            if (updateResult === 'success') {
                return 'file-updated';
            }
            else {
                return 'file-update-failure';
            }
    }
});

/************************
 * PANTRY
 ***********************/

// IPC listener to create or update pantry file
ipcMain.handle('add-ingredient-to-pantry', async (event, ingredient) => {
    const { ingredientName, ingredientQuantity } = ingredient;
    const filePath = path.join(__dirname, '../../Pantry', `Pantry.json`);
    
    let readingResult = await readJsonFile(filePath);
    let pantryData = {};

    switch(readingResult) {
        case 'failure':
            console.error('Failed to read file:', err);
            return 'file-read-failure';
        case 'file-not-found':
            fileContent = {
                ingredientsArray: [],
                quantitiesArray: []
            };
            pantryData = fileContent;
            let resultCreation = await createFile(filePath, fileContent);     
            if (resultCreation === 'failure'){
                return 'file-creation-failure';
            }
            break;   
        default:
            pantryData = readingResult;
    }

    // Check if the ingredient is already in the recipe
    if (pantryData.ingredientsArray.includes(ingredientName)) {
        return 'ingredient-already-in-pantry';
    }

    // Update the recipe
    pantryData.ingredientsArray.push(ingredientName);
    pantryData.quantitiesArray.push(ingredientQuantity);

    let overwriteResult = await updateFile(filePath, pantryData);

    return overwriteResult;
});

// IPC listener to read recipe file content
ipcMain.handle('read-pantry-file', async (event) => {
    const filePath = path.join(__dirname, '../../Pantry', `Pantry.json`);
    return readJsonFile(filePath);
});

ipcMain.handle('update-pantry', async (event, updatedPantryJSON) => {
    const filePath = path.join(__dirname, '../../Pantry', `Pantry.json`);
    const fileContent = updatedPantryJSON;

    let readingResult = await readJsonFile(filePath);
    // The pantry file must exist
    switch (readingResult) {
        case 'failure':
            console.error('Failed to read file:', err);
            return 'failure';
        default:    // File exists -> update it
            let updateResult = await updateFile(filePath, fileContent);
            // 'file-not-found' error is not possible here
            if (updateResult === 'success') {
                return 'file-updated';
            }
            else {
                return 'file-update-failure';
            }
    }
});