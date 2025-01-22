const { ipcRenderer }       = require('electron');
const { messageBoxUpdate, errorHandling }  = require('./messageBoxUpdate');

// Message box
const explainBox        = document.getElementById('explainBox');
const messageBoxDiv     = document.getElementById('messageBox');

// Dynamic table
const dynamicTable      = document.getElementById('itemTable').getElementsByTagName('tbody')[0];
const listName          = document.getElementById('listName');

// Export table
const divExportButtons  = document.getElementById('exportButtons');

// Ingredients lists
let verboseIngredients  = [];
let ingredientExists    = [];   // to check if ingredient exists in folder
let verboseProductName  = [];
let verboseQuantities   = [];
let verboseCost         = [];

// On opening the view
let groceryType = ""
let itemName    = ""  // recipeName, planName, ...
ipcRenderer.on('grocery-list', (event, args) => {
    groceryType = args.groceryType;

    // Set global variable
    if (groceryType === 'recipe'){
        itemName = args.recipeName;
        listName.textContent = "Recipe: '" + itemName + "'";
    }

    updateGroceryList();
});


// On refresh
ipcRenderer.on('refresh', (event, args) => {
    console.log("Refreshing because:", args);
    errorHandling(messageBoxDiv, true, "Refreshing grocery list");
    updateGroceryList();
});


// Render the grocery list based on groceryType
function updateGroceryList(){
    if (groceryType === 'recipe'){
        fetchAndRenderGroceryList_recipe(itemName);
    }

    // Render export buttons
    renderExportButtons();
}

// RECIPE
async function fetchAndRenderGroceryList_recipe(recipeName) {
    try {
        // Render ingredients in table
        recipeData = await ipcRenderer.invoke('read-recipe-file', recipeName);
        let recipeIngredientsArray  = recipeData.ingredientsArray;
        let recipeQuantitiesArray   = recipeData.quantitiesArray;

        // Subtract pantry ingredients from grocery list
        let updatedIngredientAndRecipe  = await subtractPantryIngredients(recipeIngredientsArray, recipeQuantitiesArray);
        const updatedIngredients        = updatedIngredientAndRecipe.ingredientsArray;
        const updatedQuantities         = updatedIngredientAndRecipe.quantitiesArray;

        // If there are no ingredients to buy
        if (updatedQuantities.length === 0) {
            explainBox.textContent = "You have all the ingredients in your pantry!";
            return;
        }
        else{
            await verbosifyIngredientsQuantitiesCost(updatedIngredients, updatedQuantities);
            renderItemsTable();
        }
    }
    catch (err) {
        console.error("Failed to fetch and render groceries:", err);
    }
}

// Transform quantity into verbose with unitWeight and grams
async function verbosifyIngredientsQuantitiesCost(ingredientsArray, quantitiesArray) {
    for (let i = 0; i < ingredientsArray.length; i++) {
        let quantityGrams   = quantitiesArray[i];

        // Ingredient exists in folder
        try{    
            const ingredientData = await ipcRenderer.invoke('read-ingredient-file', ingredientsArray[i]);
            ingredientExists.push(true);

            // Product info
            const unitWeight    = ingredientData.unitWeight;
            let cost            = ingredientData.cost;

            verboseIngredients.push(String(ingredientsArray[i]));

            // Product name
            verboseProductName.push(ingredientData.unitName);

            // Cost
            let finalCost       = 0;
            if(unitWeight !== "") { finalCost = (cost * quantityGrams / unitWeight).toFixed(2); }
            else {                  finalCost = (cost * quantityGrams / 100).toFixed(2); }
            verboseCost.push( String( finalCost ));

            // Quantity
            if (unitWeight !== "") {
                const finalQuantity = (quantityGrams / unitWeight).toFixed(2);
                verboseQuantities.push( '×' + String( finalQuantity ) + ' (' + String( quantityGrams.toFixed(2) ) + ' g)' );
            }
            else {
                verboseQuantities.push( String( quantityGrams.toFixed(0) ) + ' g' );
            }

        }
        // Ingredient does not exist in folder
        catch(err){
            // Show it with a message
            ingredientExists.push(false);
            verboseIngredients.push(String(ingredientsArray[i]));
            verboseProductName.push("");
            verboseCost.push( "-" );
            verboseQuantities.push( String( quantityGrams.toFixed(2) ) + ' g' );
        }
    }
}

// Read pantry and subtract ingredients
async function subtractPantryIngredients(ingredientsArray, quantitiesArray) {
    // Read pantry
    let pantry = await ipcRenderer.invoke('read-pantry-file');
    let pantryIngredients   = pantry.ingredientsArray;
    let pantryQuantities    = pantry.quantitiesArray;

    // Subtract pantry ingredients from grocery list
    for (let i = 0; i < ingredientsArray.length; i++) {
        let pantryIndex = pantryIngredients.indexOf(ingredientsArray[i]);
        if (pantryIndex !== -1) {
            quantitiesArray[i] -= pantryQuantities[pantryIndex];
        }
    }

    // remove ingredient if quantity is <= 0
    for (let i = 0; i < ingredientsArray.length; i++) {
        if (quantitiesArray[i] <= 0) {
            ingredientsArray.splice(i, 1);
            quantitiesArray.splice(i, 1);
            i--;
        }
    }

    // Updated quantities with pantry
    return {ingredientsArray, quantitiesArray};
}



async function renderItemsTable() {
    // Clear existing rows
    dynamicTable.innerHTML = '';

    for (let i = 0; i < verboseIngredients.length; i++) {
        const ingredientName        = verboseIngredients[i];
        const ingredientExists_bool = ingredientExists[i];
        const productName           = verboseProductName[i];
        const quantity              = verboseQuantities[i];
        const cost                  = verboseCost[i];

        // Create a new row for the ingredient
        const newRow = document.createElement('tr');
        newRow.classList.add('ingredient-row'); // to distinguish from the sum row
        newRow.innerHTML = `
            <td>${ingredientName} 
                ${ingredientExists_bool ? "" : "<span style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>⚠</span>"}
            </td>
            <td>${productName}</td>
            <td>${quantity}</td>
            <td id="itemCost">${cost}</td>
        `;
        dynamicTable.appendChild(newRow);
    }

    // Create a new row for the sum
    const newRow = document.createElement('tr');
    newRow.classList.add('sum-row'); // to distinguish from the ingredient row
    
    let sumCost = 0;
    for (let i = 0; i < verboseCost.length; i++) {
        if (!isNaN(parseFloat(verboseCost[i]))) {
            sumCost += parseFloat(verboseCost[i]);
        }
    }

    sumCost = sumCost.toFixed(2);
    
    newRow.innerHTML = `
        <td></td>
        <td></td>
        <td></td>
        <td class="sumRow">${sumCost}</td>
    `;
    dynamicTable.appendChild(newRow);
}


// RENDER BUTTONS
function renderExportButtons() {

    divExportButtons.innerHTML = `
        <button id="exportToBeDoTelegram" style="width: 100px;">
            <img src="../../img/tobedo.png" alt="ToBeDo" style="width: 40px;">
        </button>
    `;

    const exportButtonTelegram = document.getElementById('exportToBeDoTelegram');
    exportButtonTelegram.addEventListener('click', () => {
        // Verbosify the table
        let text = '';
        for (let i = 0; i < verboseIngredients.length; i++) {
            if(verboseProductName[i] !== ""){
                text += verboseProductName[i] + ' ' + verboseQuantities[i] + ' \n';
            }
            else{
                text += verboseIngredients[i] + ' ×' + verboseQuantities[i] + ' \n';
            }
        }

        // Copy to clipboard
        try{
            navigator.clipboard.writeText(text);
            errorHandling(messageBoxDiv, true, "Copied to clipboard");
        }
        catch(err){
            console.error("Failed to copy to clipboard:", err);
            errorHandling(messageBoxDiv, false, "Failed to copy to clipboard");
        }
    });
}