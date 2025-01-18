const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');


const errorsJSON = require('./errors.json');
const successJSON = require('./success.json');


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

ipcMain.on('open-add-daily-plan-window', (event, arg) => {
    let addDailyPlanView = new BrowserWindow({
        width: 1500,
        height: 760,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    addDailyPlanView.loadURL(url.format({
        pathname: path.join(__dirname, '../views/addDailyPlan.html'),
        protocol: 'file:',
        slashes: true
    }));

    addDailyPlanView.webContents.openDevTools();
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

ipcMain.on('suggestion-clicked', (event, arg) => {
    const [itemData, suggestionType, targetWindowId] = Object.values(arg);

    if(suggestionType === 'ingredient') {
        BrowserWindow.fromId(targetWindowId).webContents.send('suggested-ingredient-clicked', itemData);   
    }
    else if(suggestionType === 'recipe') {
        BrowserWindow.fromId(targetWindowId).webContents.send('suggested-recipe-clicked', itemData);
    }
    else if(suggestionType === 'dailyPlan') {
        BrowserWindow.fromId(targetWindowId).webContents.send('suggested-dailyPlan-clicked', itemData);
    }
    else {
        console.error('[suggestion-clicked] -> Invalid suggestion type:', suggestionType);
    }
});

ipcMain.handle('get-window-id', (event) => {
    // Get the window ID that sent the message
    const window = BrowserWindow.fromWebContents(event.sender);
    return window.id;
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
    // Refresh all windows
    refreshAllWindows('From create-ingredient-file');

    return result;
});

ipcMain.handle('create-recipe-file', async (event, recipeName, recipeData) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    return createFile(filePath, recipeData);
});

async function createFile(filePath, fileContent) {
    // Check if the file content is acceptable
    // it checks every JSON entry
    const nonAcceptedSymbols = /[^a-zA-Z0-9\s.,-]/;
    const checkContent = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkContent(obj[key]) === false) return false;
            } else {
                const match = String(obj[key]).match(nonAcceptedSymbols);
                if (match) {
                    console.error('[createFile] -> File content contains non accepted symbols:', match[0]);
                    return false;
                }
            }
        }
        return true;
    };

    if (!checkContent(fileContent)) {
        return errorsJSON.invalid_file_content;
    }


    if (fs.existsSync(filePath)) {
        console.error('[createFile] -> File already exists:', filePath);
        return errorsJSON.file_already_exists;
    } else {
        try {
            await fs.promises.writeFile(filePath, JSON.stringify(fileContent, null, 2));
            console.log('[createFile] -> File created successfully');
            return successJSON.file_created;
        } catch (err) {
            console.error('[createFile] -> Failed to create file:', err);
            return errorsJSON.file_not_created;
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
    let resultJSON = {};
    // Read the file
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const dataJSON = JSON.parse(data);
        resultJSON = successJSON.file_read;
        return {resultJSON, dataJSON};
    }
    catch (err) {
        console.error('[readJsonFile] -> Failed to read file:', err);
        if(err.code === 'ENOENT') {
            resultJSON = errorsJSON.file_not_found;
        }
        else{
            resultJSON = errorsJSON.generic_failure;
        }
        return {resultJSON, dataJSON: ''};
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
            console.error(`[get-recipes-using-ingredient] -> Failed to read recipe file for ${recipe}:`, err);
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
        console.error('[deleteFile] -> File does not exist:', filePath);
        return errorsJSON.file_not_found;
    }
    try {
        await fs.promises.unlink(filePath);
        console.log('[deleteFile] -> File deleted successfully');
        return successJSON.file_deleted;
    } catch (err) {
        console.error('[deleteFile] -> Failed to delete file:', err);
        return errorsJSON.delete_file_error;
    }
}

/*** READ ALL FILE */
ipcMain.handle('get-recipe-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Recipes');
    const readFilesResult = await readFilesNameFromDirectory(directoryPath);
    console.log("[get-recipe-names] -> ", readFilesResult);
    return readFilesResult;
});

ipcMain.handle('get-dailyPlan-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/DailyPlans');
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
        return {resultJSON: successJSON.file_read, data: fileNames};
    } catch (err) {
        console.error('[readFilesNameFromDirectory] -> Failed to read directory:', err);
        return {resultJSON: errorsJSON.generic_failure, data: []};
    }
}

// IPC listener to read recipe file content
ipcMain.handle('read-recipe-file', async (event, recipeName) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    const readingResult = await readJsonFile(filePath);
    return readingResult;
});

ipcMain.handle('read-dailyPlan-file', async (event, dailyPlanName) => {
    const filePath = path.join(__dirname, '../../Pantry/DailyPlans', `${dailyPlanName}.json`);
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
    console.log('[updateFile] -> Updating file: ', filePath, ' with content: ', fileContent);

    // Check if the file content is a string
    if (typeof fileContent !== 'string') {
        fileContent = JSON.stringify(fileContent, null, 2);
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        console.log('[updateFile] -> File does not exist:', filePath);
        return errorsJSON.file_not_found;
    }

    // Try to overwrite the file
    try {
        await fs.promises.writeFile(filePath, fileContent);
        console.log('[updateFile] -> File updated successfully');
        return successJSON.file_updated;
    } catch (err) {
        console.log('[updateFile] -> Failed to update file:', err);
        return errorsJSON.file_not_updated;
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


ipcMain.handle('recipe-nutritional-values', async (event, recipeName) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    const {readResultJSON, recipeData} = await readJsonFile(filePath);

    // If there is an error reading the file
    if(readResultJSON.type === false){
        return {readResultJSON, recipeData};
    }

    const recipeNutritionalValuesJSON = await computeRecipeNutritionalValues(recipeData.ingredientsArray, recipeData.quantitiesArray);
    return {readResultJSON, recipeNutritionalValuesJSON};
});

async function computeRecipeNutritionalValues (ingredientArray, quantityArray) {
    let totalNutritionalValues = {
        name: '',
        type: '',
        kcal: 0,
        protein: 0,
        fiber: 0,
        fat: 0,
        saturated: 0,
        carb: 0,
        sugar: 0,
        salt: 0,
        chol: 0,
        cost: 0
    };

    // To read ingredients file
    

    for (let i = 0; i < ingredientArray.length; i++) {
        const ingredientName = ingredientArray[i];
        const quantity = quantityArray[i];

        // Read ingredient data
        const ingredientFilePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
        const ingredientData = await readJsonFile(ingredientFilePath);
        
        // Ingredient file might be deleted
        if(ingredientData === 'file-not-found') {
            return errorsJSON.ingredient_not_found;
        }
        
        totalNutritionalValues.kcal         += ingredientData.kcal      * quantity / 100;
        totalNutritionalValues.protein      += ingredientData.protein   * quantity / 100;
        totalNutritionalValues.fiber        += ingredientData.fiber     * quantity / 100;
        totalNutritionalValues.fat          += ingredientData.fat       * quantity / 100;
        totalNutritionalValues.saturated    += ingredientData.saturated * quantity / 100;
        totalNutritionalValues.carb         += ingredientData.carb      * quantity / 100;
        totalNutritionalValues.sugar        += ingredientData.sugar     * quantity / 100;
        totalNutritionalValues.salt         += ingredientData.salt      * quantity / 100;
        totalNutritionalValues.chol         += ingredientData.chol      * quantity / 100;
        if(ingredientData.unitWeight !== "") {
            totalNutritionalValues.cost     += ingredientData.cost      * quantity / ingredientData.unitWeight;
        }
        else {
            totalNutritionalValues.cost     += ingredientData.cost      * quantity / 100;
        }
    }

    return totalNutritionalValues;
}






ipcMain.handle('add-recipe-to-dailyplan', async (event, planAndRecipe) => {
    const { planName, recipeName, recipeQuantity } = planAndRecipe;
    const filePath = path.join(__dirname, '../../Pantry/DailyPlans', `${planName}.json`);
    
    let readingResult = await readJsonFile(filePath);
    let planData = {};

    // 'file-not-found' error is not possible here
    switch(readingResult) {
        case 'failure':
            console.error('[add-recipe-to-dailyplan] -> Failed to read file:', filePath);
            return errorsJSON.read_file_failure;
        default:
            console.error('[add-recipe-to-dailyplan] -> File read succesfully:', readingResult);
            planData = readingResult;
    }

    // Check if the recipe is already in the plan
    if (planData.recipesArray.includes(recipeName)) {
        return errorsJSON.ingredient_already_in_recipe;
    }

    // Update the recipe
    planData.recipesArray.push(recipeName);
    planData.quantitiesArray.push(recipeQuantity);

    let overwriteResult = await updateFile(filePath, planData);

    return overwriteResult;
});

ipcMain.handle('update-or-create-file', async (event, updatedJSON, type) => {
    let filePath = '';
    switch (type) {
        case 'ingredient':
            filePath = path.join(__dirname, '../../Pantry/Ingredients', `${updatedJSON.ingredientName}.json`);
            break;
        case 'recipe':
            filePath = path.join(__dirname, '../../Pantry/Recipes',     `${updatedJSON.recipeName}.json`);
            break;
        case 'dailyPlan':
            filePath = path.join(__dirname, '../../Pantry/DailyPlans',  `${updatedJSON.planName}.json`);
            break;
    }
    const fileContent = updatedJSON;


    let result = await createOrUpdateFile(filePath, fileContent);
    return result;
});


async function createOrUpdateFile(filePath, fileContent) {
    const {readResultJSON, dataJSON} = await readJsonFile(filePath);

    switch (readResultJSON) {
        // Failed to read file
        case errorsJSON.read_file_failure:
            console.error('[createOrUpdateFile] -> Failed to read file:', filePath);
            return {readResultJSON, dataJSON: ''};

        // File does not exist -> create it
        case successJSON.file_created: 
            let createResult = await createFile(filePath, fileContent);
            
            if (createResult.type === true) {
                console.error('[createOrUpdateFile] -> File created!', filePath);
                return {resultJSON: successJSON.file_created, fileContent}
            }
            
            else {
                console.error('[createOrUpdateFile] -> Failed to create file:', filePath);
                return {resultJSON: errorsJSON.file_not_created, dataJSON: ''};
            }

        // File exists -> update it
        default:    
            let updateResult = await updateFile(filePath, fileContent);
            // 'file-not-found' error is not possible here
            if (updateResult === successJSON.file_updated) {
                console.error('[createOrUpdateFile] -> File updated!', filePath);
                return {resultJSON: successJSON.file_updated, fileContent};
            }
            else {
                console.error('[createOrUpdateFile] -> Failed to update file:', filePath);
                return {resultJSON: errorsJSON.file_not_updated, dataJSON: ''};
            }
    }
}

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
            console.error('[add-ingredient-to-pantry] -> Failed to read file:', err);
            return errorsJSON.read_file_failure;
        case 'file-not-found':
            fileContent = {
                ingredientsArray: [],
                quantitiesArray: []
            };
            pantryData = fileContent;
            let resultCreation = await createFile(filePath, fileContent);     
            if (resultCreation === 'failure'){
                return errorsJSON.file_not_created;
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
            console.error('[update-pantry] -> Failed to read file:', err);
            return errorsJSON.read_file_failure;
        default:    // File exists -> update it
            let updateResult = await updateFile(filePath, fileContent);
            // 'file-not-found' error is not possible here
            if (updateResult === 'success') {
                return successJSON.file_updated;
            }
            else {
                return errorsJSON.file_not_updated;
            }
    }
});