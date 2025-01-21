const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');


const errorsJSON = require('./errors.json');
const successJSON = require('./success.json');



 

/**************************************************************************************************
* INDEX
***************************************************************************************************/

// List of views
let indexView;

// Create the main window
app.on('ready', createIndexWindow);

app.on('activate', () => {
    if (indexView === null) {
        createIndexWindow();
    }
});

function createIndexWindow () {
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

// Quit the app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});










/**************************************************************************************************
* INGREDIENT
***************************************************************************************************/


/*****************
* ADD INGREDIENT
******************/
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

/*****************
* INGR. LIST
******************/
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

/*****************
* HANDLES
******************/

ipcMain.handle('get-ingredient-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    try{
        return await readFilesNameFromDirectory(directoryPath);
    }
    catch(err){
        console.error(`[get-ingredient-names] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed reading ingredient files!`);
    
        // Throw error to renderer so it does not continue
        throw err;
    }
});

ipcMain.handle('read-ingredient-file', async (event, ingredientName) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
    try{
        return await readJsonFile(filePath);
    }
    catch(err){
        console.error(`[read-ingredient-file] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed reading ingredient file: ${ingredientName}!`);

        // Throw error to renderer so it does not continue
        throw err;
    }
});

ipcMain.on('delete-ingredient', async (event, ingredient) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredient}.json`);
    
    try{
        let resultOfDeletion = await deleteFile(filePath);

        // Refresh all windows
        refreshAllWindows('From delete-ingredient');
        event.sender.send('main-success', `Succesfully deleted ingredient file: ${ingredient}!`);

        return resultOfDeletion;
    }
    catch(err){
        console.error(`[delete-ingredient] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed deleting ingredient file: ${ingredient}!`);
    }

});

ipcMain.on('create-ingredient-file', async (event, ingredientName, ingredientData) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);

    try{
        await createFile(filePath, ingredientData);

        // Send error message to renderer
        event.sender.send('main-success', `Succesfully created ingredient file: ${ingredientName}!`);

        // Refresh all windows
        refreshAllWindows('From create-ingredient-file');
    }
    catch(err){
        console.error(`[create-ingredient-file] -> `, err);
    
        // Send error message to renderer
        event.sender.send('main-error', `Failed creating ingredient file: ${ingredientName}!`);
    }
});

ipcMain.on('update-ingredient-file', async (event, ingredientName, fileContent) => {
    const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);

    try{
        await updateFile(filePath, fileContent);

        // Send success message to renderer
        event.sender.send('main-success', `Succesfully updated ingredient file: ${ingredientName}!`);

        // Refresh all windows
        refreshAllWindows('From update-ingredient-file');
    }
    catch(err){
        console.error(`[update-ingredient-file] -> `, err);
    
        // Send error message to renderer
        event.sender.send('main-error', `Failed updating ingredient file: ${ingredientName}!`);
    }
});

ipcMain.handle('get-ingredient-types', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Ingredients');
    let ingredientNames = [];

    // Get all ingredients names from the directory
    try{
        ingredientNames = await readFilesNameFromDirectory(directoryPath);    
    }
    catch(err){
        console.error(`[get-ingredient-types] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed reading ingredient files!`);

        // Throw error to renderer so it does not continue
        throw err;
    }

    const types = new Set();

    for (const ingredient of ingredientNames) {
        const filePath = path.join(__dirname, '../../Pantry/Ingredients', `${ingredient}.json`);
        
        // Read ingredient data
        let data = {};
        try{
            data =  await readJsonFile(filePath);
        }
        catch(err){
            console.error(`[get-ingredient-types] -> `, err);
    
            // Send error message to renderer
            event.sender.send('main-error', `Failed reading ingredient file: ${ingredient}!`);
    
            // Throw error to renderer so it does not continue
            throw err;
        }
        
        // Add ingredient type if missing from the set
        if (data.type) {
            types.add(data.type);
        }
    }
    return Array.from(types);
});










/**************************************************************************************************
* RECIPE
***************************************************************************************************/


/*****************
* RECIPE LISTS
******************/
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

/*****************
* ADD RECIPE
******************/
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

/*****************
* HANDLES
******************/

ipcMain.handle('create-recipe-file', async (event, recipeName, recipeData) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    return createFile(filePath, recipeData);
});

ipcMain.on('delete-recipe', async (event, recipe) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipe}.json`);
    try{
        let resultOfDeletion = await deleteFile(filePath);

        // Send success message to renderer
        event.sender.send('main-success', `Succesfully deleted recipe file: ${recipe}!`);


        // Refresh all windows
        refreshAllWindows('From delete-recipe');
    }
    catch(err){
        console.error(`[delete-recipe] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed deleting recipe file: ${recipe}!`);

        // Throw error to renderer so it does not continue
        throw err;
    }

});

ipcMain.handle('read-recipe-file', async (event, recipeName) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    const readingResult = await readJsonFile(filePath);
    return readingResult;
});



ipcMain.handle('get-recipes-using-ingredient', async (event, ingredient) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Recipes');

    // Get all recipe names
    let recipeNames = [];
    try{
        recipeNames =  await readFilesNameFromDirectory(directoryPath);
    }
    catch(err){
        console.error(`[get-recipes-using-ingredient] -> `, err);
    
        // Send error message to renderer
        event.sender.send('main-error', `Failed reading recipes files!`);
    
        // Throw error to renderer so it does not continue
        throw err;
    }



    let recipesUsingIngredient = [];

    for (const recipe of recipeNames) {

        // Read the recipe file
        try {
            const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipe}.json`);
            const recipeData = await readJsonFile(filePath);
            if (recipeData.ingredientsArray.includes(ingredient)) {
                recipesUsingIngredient.push(recipe);
            }
        } catch (err) {
            console.error(`[get-recipes-using-ingredient] ->`, err);
            // Send error message to renderer
            event.sender.send('main-error', `Failed reading recipe files: ${recipe}!`);
        
            // Throw error to renderer so it does not continue
            throw err;
        }
    }

    return recipesUsingIngredient;
});

ipcMain.handle('recipe-nutritional-values', async (event, recipeName) => {
    const filePath = path.join(__dirname, '../../Pantry/Recipes', `${recipeName}.json`);
    try{
        const recipeData                    = await readJsonFile(filePath);
        const recipeNutritionalValuesJSON   = await computeRecipeNutritionalValues(recipeData.ingredientsArray, recipeData.quantitiesArray);
        return recipeNutritionalValuesJSON;
    }
    catch(err){
        console.error(`[recipe-nutritional-values] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed computing recipe nutritional values!`);
    
        // Throw error to renderer so it does not continue
        throw err;
    }
});

ipcMain.handle('get-recipe-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/Recipes');
    try{
        return await readFilesNameFromDirectory(directoryPath);
    }
    catch(err){
        console.error(`[get-recipe-names] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed reading recipe files!`);
    
        // Throw error to renderer so it does not continue
        throw err;
    }
});







/**************************************************************************************************
* DAILY PLAN
***************************************************************************************************/
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

/*****************
* HANDLES
******************/

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

ipcMain.handle('read-dailyPlan-file', async (event, dailyPlanName) => {
    const filePath = path.join(__dirname, '../../Pantry/DailyPlans', `${dailyPlanName}.json`);
    return readJsonFile(filePath);
});

ipcMain.handle('get-dailyPlan-names', async (event) => {
    const directoryPath = path.join(__dirname, '../../Pantry/DailyPlans');
    return readFilesNameFromDirectory(directoryPath);
});







/**************************************************************************************************
* GROCERY LIST
***************************************************************************************************/
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








/**************************************************************************************************
* PANTRY
***************************************************************************************************/

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

/*****************
* HANDLES
******************/
ipcMain.on('add-ingredient-to-pantry', async (event, ingredient) => {
    const { ingredientName, ingredientQuantity } = ingredient;
    const filePath = path.join(__dirname, '../../Pantry', `Pantry.json`);
    
    let pantryData = {};

 
    // If pantry file does not exists -> create if
    if (!fs.existsSync(filePath)) {
        try{ 
            await createFile(filePath, {}); 
        }
        catch(err) { 
            console.error(`[add-ingredient-to-pantry] -> `, err);

            // Send error message to renderer
            event.sender.send('main-error', `Failed to create pantry file!`);        
        }
    }
   // Read pantry file
   else{
        try{
            pantryData = await readJsonFile(filePath);    
        }
        catch(err){
            console.error(`[add-ingredient-to-pantry] -> `, err);

            // Send error message to renderer
            event.sender.send('main-error', `Failed reading pantry file!`);
        }
   }

    // Check if the ingredient is already in the recipe
    if (pantryData.ingredientsArray.includes(ingredientName)) {
        event.sender.send('main-error', `Ingredient already in pantry!`);
    }
    // Update the recipe
    else{
        pantryData.ingredientsArray.push(ingredientName);
        pantryData.quantitiesArray.push(ingredientQuantity);

        await updateFile(filePath, pantryData);

        // Send success message to renderer
        event.sender.send('main-success', `Succesfully added ingredient to pantry!`);
    
        // Refresh all windows
        refreshAllWindows('From update-pantry');
    }
});

ipcMain.handle('read-pantry-file', async (event) => {
    const filePath = path.join(__dirname, '../../Pantry', `Pantry.json`);
    try{
        return await readJsonFile(filePath);
    }
    catch(err){
        console.error(`[read-pantry-file] -> `, err);

        // Send error message to renderer
        event.sender.send('main-error', `Failed reading pantry file!`);

        // Throw error to renderer so it does not continue
        throw err;
    }
});

ipcMain.on('update-pantry', async (event, updatedPantryJSON) => {
    const filePath = path.join(__dirname, '../../Pantry', `Pantry.json`);
    const fileContent = updatedPantryJSON;

    try{
        await updateFile(filePath, fileContent);

        // Send success message to renderer
        event.sender.send('main-success', `Succesfully updated pantry file!`);

        // Refresh all windows
        refreshAllWindows('From update-pantry');
    }
    catch(err){
        console.error(`[update-pantry] -> `, err);
    
        // Send error message to renderer
        event.sender.send('main-error', `Failed updating pantry file!`);
    }
});













/**************************************************************************************************
* AUXILIARY
***************************************************************************************************/

/*****************
* HANDLES
******************/

/* Handle suggestions */
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

/* Return window id */
ipcMain.handle('get-window-id', (event) => {
    // Get the window ID that sent the message
    const window = BrowserWindow.fromWebContents(event.sender);
    return window.id;
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



/*****************
* FUNCTIONS
******************/

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
        throw new Error('File content contains non accepted symbols');
    }

    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        console.error('[createFile] -> File already exists:', filePath);
        throw new Error('File already exists');
    } 
    
    // File does not exists, create it
    else {
        try {
            await fs.promises.writeFile(filePath, JSON.stringify(fileContent, null, 2));
        } catch (err) {
            console.error('[createFile] -> ', err);
            throw err;
        }
    }
}


async function readJsonFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const dataJSON = JSON.parse(data);
        return dataJSON;
    }
    catch (err) {
        console.error('[readJsonFile] -> Failed to read file:', err);
        throw err;
    }   
}


async function deleteFile(filePath) {
    try {
        await fs.promises.unlink(filePath);
        return true;
    } catch (err) {
        console.error('[deleteFile] -> ', err);
        throw err;
    }
}

async function readFilesNameFromDirectory(directoryPath) {
    try {
        const files = await fs.promises.readdir(directoryPath);
        const fileNames = files.map(file => path.parse(file).name);
        return fileNames;
    } catch (err) {
        console.error('[readFilesNameFromDirectory] Error -> ', err);
        throw err
    }
}

async function computeRecipeNutritionalValues (ingredientArray, quantityArray) {
    let totalNutritionalValues = {
        name:       '',
        type:       '',
        kcal:       0,  
        protein:    0,
        fiber:      0,
        fat:        0,
        saturated:  0,
        carb:       0,
        sugar:      0,
        salt:       0,
        chol:       0,
        cost:       0
    };

    try{
        // To read ingredients file
        for (let i = 0; i < ingredientArray.length; i++) {
            const ingredientName    = ingredientArray[i];
            const quantity          = quantityArray[i];

            // Read ingredient data
            const ingredientFilePath    = path.join(__dirname, '../../Pantry/Ingredients', `${ingredientName}.json`);
            
            // If file does not exists
            // -> Don't return error
            // -> Return a message
            if (!fs.existsSync(ingredientFilePath)) {
                return false;
            }

            const ingredientData                = await readJsonFile(ingredientFilePath);

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
    catch(err){
        console.error(`[computeRecipeNutritionalValues] -> `, err);
        throw err;
    }
}


function refreshAllWindows(message) {
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('refresh', message);
    });
}

async function updateFile(filePath, fileContent) {

    // Check if the file content is a string
    if (typeof fileContent !== 'string') {
        fileContent = JSON.stringify(fileContent, null, 2);
    }

    // Try to overwrite the file
    try {
        await fs.promises.writeFile(filePath, fileContent);
    } catch (err) {
        console.error('[updateFile] -> ', err);
        throw err;
    }
}


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