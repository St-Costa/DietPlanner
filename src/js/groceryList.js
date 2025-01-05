const { ipcRenderer } = require('electron');
const { messageBoxUpdate } = require('./messageBoxUpdate');

const dynamicTable = document.getElementById('itemTable').getElementsByTagName('tbody')[0];
const explainBox = document.getElementById('explainBox');
const listName = document.getElementById('listName');
const divExportButtons = document.getElementById('exportButtons');
const messageBoxDiv = document.getElementById('messageBox');

// For when I create an ingredient in the other view
ipcRenderer.on('init-args', (event, args) => {
    let groceryType = args.groceryType;

    if (groceryType === 'recipe'){
        let recipeName = args.recipeName;
        listName.textContent = "Recipe: '" + recipeName + "'";
        fetchAndRenderGroceryList_recipe(recipeName);
    }
});


async function fetchAndRenderGroceryList_recipe(recipeName) {
    try {
        // Render ingredients in table
        recipeData = await ipcRenderer.invoke('read-recipe-file', recipeName);
        let recipeIngredient = recipeData.ingredientsArray;
        let recipeQuantity = recipeData.quantitiesArray;

        // Subtract pantry ingredients from grocery list
        let updatedIngredientAndRecipe = await subtractPantryIngredients(recipeIngredient, recipeQuantity);
        const updatedIngredients = updatedIngredientAndRecipe.ingredientsArray;
        const updatedQuantities = updatedIngredientAndRecipe.quantitiesArray;

        // If there are no ingredients to buy
        if (updatedQuantities.length === 0) {
            explainBox.textContent = "You have all the ingredients in your pantry!";
            return;
        }
        else{
            let {verboseIngredients, verboseProductName, verboseQuantities, verboseCost} = await verbosifyIngredientsQuantitiesCost(updatedIngredients, updatedQuantities);
            renderItemsTable(verboseIngredients, verboseProductName, verboseQuantities, verboseCost);
        }
    }
    catch (err) {
        console.error("Failed to fetch and render groceries:", err);
    }
}

// Transform quantity into verbose with unitWeight and grams
async function verbosifyIngredientsQuantitiesCost(ingredientsArray, quantitiesArray) {
    let verboseQuantities = [];
    let verboseCost = [];
    let verboseIngredients = [];
    let verboseProductName = [];

    for (let i = 0; i < ingredientsArray.length; i++) {
        verboseIngredients.push(String(ingredientsArray[i]));
    
        let ingredientData = await ipcRenderer.invoke('read-ingredient-file', ingredientsArray[i]);
        let quantityGrams = quantitiesArray[i];

        // ingredient info
        let unitWeight = ingredientData.unitWeight;
        let unitName = ingredientData.unitName;
        let cost = ingredientData.cost;

        // Product Name
        if (ingredientData.unitName !== "") {
            verboseProductName.push(ingredientData.unitName);
        }
        else {
            verboseProductName.push("");
        }

        // Cost
        if(ingredientData.unitWeight !== "") {
            const finalCost = (cost * quantityGrams / unitWeight).toFixed(2);
            verboseCost.push( String( finalCost ) + ' ¤' );
        }
        else {
            const finalCost = (cost * quantityGrams / 100).toFixed(2);
            verboseCost.push( String( finalCost ) + ' ¤' );
        }

        // Quantity
        if (unitWeight !== "") {
            const finalQuantity = (quantityGrams / unitWeight).toFixed(2);
            verboseQuantities.push( '×' + String( finalQuantity ) + ' (' + String( quantityGrams.toFixed(2) ) + ' g)' );
        }
        else {
            verboseQuantities.push( String( quantityGrams.toFixed(0) ) + ' g' );
        }
    }

    return {verboseIngredients, verboseProductName, verboseQuantities, verboseCost};
}

async function subtractPantryIngredients(ingredientsArray, quantitiesArray) {
    // Read pantry
    let pantry = await ipcRenderer.invoke('read-pantry-file');
    let pantryIngredients = pantry.ingredientsArray;
    let pantryQuantities = pantry.quantitiesArray;

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



async function renderItemsTable(verboseIngredients, verboseProductName, verboseQuantities, verboseCost) {
    // Clear existing rows
    dynamicTable.innerHTML = '';

    for (let i = 0; i < verboseIngredients.length; i++) {
        const ingredientName = verboseIngredients[i];
        const productName = verboseProductName[i];
        const quantity = verboseQuantities[i];
        const cost = verboseCost[i];


        // Create a new row for the ingredient
        const newRow = document.createElement('tr');
        newRow.classList.add('ingredient-row'); // to distinguish from the sum row
        newRow.innerHTML = `
            <td>${ingredientName}</td>
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
        sumCost += parseFloat(verboseCost[i]);
    }

    sumCost = sumCost.toFixed(2);
    
    newRow.innerHTML = `
        <td></td>
        <td></td>
        <td></td>
        <td class="sumRow">${sumCost} ¤</td>
    `;
    dynamicTable.appendChild(newRow);
 
    
    // Render export buttons
    renderExportButtons(verboseIngredients, verboseProductName, verboseQuantities);
}


function renderExportButtons(verboseIngredients, verboseProductName, verboseQuantities) {

    divExportButtons.innerHTML = `
        <button id="exportToBeDoTelegram">📋 → ToBeDo</button>
    `;

    const exportButtons = document.getElementById('exportToBeDoTelegram');
    exportButtons.addEventListener('click', () => {
        // Copy to clipboard
        let text = '';
        for (let i = 0; i < verboseIngredients.length; i++) {
            if(verboseProductName[i] !== ""){
                text += verboseProductName[i] + ' ' + verboseQuantities[i] + ' \n';
            }
            else{
                text += verboseIngredients[i] + ' ×' + verboseQuantities[i] + ' \n';
            }
        }
        try{
            navigator.clipboard.writeText(text);
            messageBoxUpdate(messageBoxDiv, 'Copied to clipboard', true);
        }
        catch(err){
            console.error("Failed to copy to clipboard:", err);
            messageBoxUpdate(messageBoxDiv, 'Failed to copy to clipboard', false);
        }
    });
}