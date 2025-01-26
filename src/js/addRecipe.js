const { ipcRenderer }   = require('electron');
const { errorHandling } = require('./messageBoxUpdate');
const { setTableType, renderRecipeAndPlanTable } = require('./recipeIngredientsTable');
const { showSuggestions, navigateSuggestions } = require('./suggestions');

// Errors
const messageBoxDiv = document.getElementById('messageBox');

// Ingredient suggestions
const ingredientNameInput               = document.getElementById('ingredientName');
const suggestionBox_ingredient          = document.getElementById('suggestionBox_ingredient');
const addIngredientButton               = document.getElementById('addIngredientButton');
const unitNameSpan                      = document.getElementById('unitName');
const unitAlternativeSpan               = document.getElementById('unitAlternative');
const tdQuantityInput                   = document.getElementById('tdQuantityInput');
const ingredientToAdd_quantityGrams     = document.getElementById('ingredientToAdd_quantityGrams');
const ingredientToAdd_quantityUnit      = document.getElementById('ingredientToAdd_quantityUnit');
const suggestedIngredientDetails = {
    type:       document.getElementById('typeSuggestedIngredient'),
    kcal:       document.getElementById('kcalSuggestedIngredient'),
    protein:    document.getElementById('proteinSuggestedIngredient'),
    fiber:      document.getElementById('fiberSuggestedIngredient'),
    fat:        document.getElementById('fatSuggestedIngredient'),
    saturated:  document.getElementById('saturatedSuggestedIngredient'),
    carb:       document.getElementById('carbSuggestedIngredient'),
    sugar:      document.getElementById('sugarSuggestedIngredient'),
    salt:       document.getElementById('saltSuggestedIngredient'),
    chol:       document.getElementById('cholSuggestedIngredient'),
    cost:       document.getElementById('costSuggestedIngredient')
};
let ingredientToAdd_details = {};

// Recipe
const recipeNameInput       = document.getElementById('recipeName');
const suggestionBox_recipe  = document.getElementById('suggestionBox_recipe');
const preparationBox        = document.getElementById('preparation');
const deleteRecipeButton    = document.getElementById('deleteRecipe');
let recipeDetailsJSON       = {};

// Ingredient in table
const dynamicTable = document.getElementById('dynamicTable');

// Set the table type
setTableType('recipe', dynamicTable);

// Refresh the list when an ingredient is created/deleted in another page
ipcRenderer.on('refresh', async (event, args) => {
    console.log("Refreshing because:", args);
    // Show message
    errorHandling(messageBoxDiv, true, "Refreshing table because of changes!");
    // Refresh the table
    recipeToDisplay = recipeNameInput.value.trim();
    if(recipeToDisplay !== ''){
        recipeDetailsJSON = await ipcRenderer.invoke('read-recipe-file', recipeToDisplay);
        refreshRecipeTable(recipeDetailsJSON);
    }
    // Clear ingredient to add
    clearSuggestedIngredientRow();
});

// Errors
ipcRenderer.on('main-error', (event, errMsg) => {
    errorHandling(messageBoxDiv, false, errMsg);
});
// Success
ipcRenderer.on('main-success', (event, errMsg) => {
    errorHandling(messageBoxDiv, true, errMsg);
});


/*  
    [START]  Ingredient suggestions  
*/
ingredientNameInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('ingredient', suggestionBox_ingredient, this, thisWindowId);
});
ingredientNameInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('ingredient', suggestionBox_ingredient, this, thisWindowId);
});
ingredientNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_ingredient);
});
ipcRenderer.on('suggested-ingredient-clicked', (event, ingredientData) => {
    // Reset quantity inputs
    ingredientToAdd_quantityGrams.value    = 0;
    ingredientToAdd_quantityUnit.value     = 0;
    
    // Update global variable
    ingredientToAdd_details = ingredientData;

    if (ingredientData) {   // if is not empty
        
        // HTML
        tdQuantityInput.style.display       = 'table-cell';
        addIngredientButton.style.display   = 'inline';
        
        // If it has a unitName:
        // - Show the unitName
        // - Show the inputBox for the unit
        if (ingredientData.unitName) {
            unitNameSpan.textContent            = ingredientData.unitName;
            unitAlternativeSpan.style.display   = 'inline';
        } else {
            unitAlternativeSpan.style.display   = 'none';
        }

        // Update the details shown in the suggested ingredient row
        updateIngredientToAddDetails();
    }
    else{
        clearSuggestedIngredientRow();
    }
});

/* ----------------- */

/*  
    Recipe suggestions  
*/
recipeNameInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('recipe', suggestionBox_recipe, this, thisWindowId);
});
recipeNameInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('recipe', suggestionBox_recipe, this, thisWindowId);
});
recipeNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_recipe);
});
ipcRenderer.on('suggested-recipe-clicked', (event, recipeData) => {
    refreshRecipeTable(recipeData);
});


/* ----------------- */


/*  
    [START]  Preparation box  
*/
preparationBox.addEventListener('keydown', async function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const recipeName = recipeNameInput.value.trim();

        // Check if recipe name input is empty
        if (recipeName !== '') {
            recipeDetailsJSON.preparation = preparationBox.value;
            const recipeData = await ipcRenderer.invoke('update-or-create-file', recipeDetailsJSON, 'recipe');
            refreshRecipeTable(recipeData);
        }
        else{
            errorHandling(messageBoxDiv, false, "Recipe name is empty!");
        }
    }
});
// If focus is lost, revert to the original preparation
preparationBox.addEventListener('blur', function () {
    preparationBox.value = recipeDetailsJSON.preparation || '';
});

/* ----------------- */


// Update ingredient to add with nutritional values
ingredientToAdd_quantityGrams.addEventListener('input', function () {
    const unitWeight = ingredientToAdd_details.unitWeight || 0;
    if (unitWeight > 0) {
        const grams = parseFloat(this.value);
        if (!isNaN(grams)) {
            const units = grams / unitWeight;
            ingredientToAdd_quantityUnit.value = units.toFixed(2);
        } else {
            ingredientToAdd_quantityUnit.value = '';
        }
    }
    updateIngredientToAddDetails();
});

ingredientToAdd_quantityGrams.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { addIngredientButton.click(); }
});
ingredientToAdd_quantityUnit.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { addIngredientButton.click(); }
});


ingredientToAdd_quantityUnit.addEventListener('input', function () {
    const unitWeight = ingredientToAdd_details.unitWeight || 0;
    if (typeof unitWeight !== 'undefined' && unitWeight > 0) {
        const units = parseFloat(this.value);
        if (!isNaN(units)) {
            const grams = units * unitWeight;
            ingredientToAdd_quantityGrams.value = grams.toFixed(1);
        } else {
            ingredientToAdd_quantityGrams.value = '';
        }
    }
    updateIngredientToAddDetails();
});



// Update the suggested ingredient nutritional values with the new quantity
function updateIngredientToAddDetails() {
    const grams = parseFloat(ingredientToAdd_quantityGrams.value);
    const ingredient = ingredientToAdd_details;

    if (!isNaN(grams) && ingredient) {
        const ingredientNutritionalValuesWithGrams = computeIngredientNutritionalValue(ingredient, grams);

        suggestedIngredientDetails.type.textContent         = ingredientNutritionalValuesWithGrams.type;
        suggestedIngredientDetails.kcal.textContent         = ingredientNutritionalValuesWithGrams.kcal;
        suggestedIngredientDetails.protein.textContent      = ingredientNutritionalValuesWithGrams.protein;
        suggestedIngredientDetails.fiber.textContent        = ingredientNutritionalValuesWithGrams.fiber;
        suggestedIngredientDetails.fat.textContent          = ingredientNutritionalValuesWithGrams.fat;
        suggestedIngredientDetails.saturated.textContent    = ingredientNutritionalValuesWithGrams.saturated;
        suggestedIngredientDetails.carb.textContent         = ingredientNutritionalValuesWithGrams.carb;
        suggestedIngredientDetails.sugar.textContent        = ingredientNutritionalValuesWithGrams.sugar;
        suggestedIngredientDetails.salt.textContent         = ingredientNutritionalValuesWithGrams.salt;
        suggestedIngredientDetails.chol.textContent         = ingredientNutritionalValuesWithGrams.chol;
        suggestedIngredientDetails.cost.textContent         = ingredientNutritionalValuesWithGrams.cost;
    }
}

// Clear the suggested ingredient row
function clearSuggestedIngredientRow() {
    ingredientNameInput.value                           = '';
    suggestedIngredientDetails.type.textContent         = '';
    suggestedIngredientDetails.kcal.textContent         = '';
    suggestedIngredientDetails.protein.textContent      = '';
    suggestedIngredientDetails.fiber.textContent        = '';
    suggestedIngredientDetails.fat.textContent          = '';
    suggestedIngredientDetails.saturated.textContent    = '';
    suggestedIngredientDetails.carb.textContent         = '';
    suggestedIngredientDetails.sugar.textContent        = '';
    suggestedIngredientDetails.salt.textContent         = '';
    suggestedIngredientDetails.chol.textContent         = '';
    suggestedIngredientDetails.cost.textContent         = '';
    tdQuantityInput.style.display                       = 'none';
    unitAlternativeSpan.style.display                   = 'none';
    addIngredientButton.style.display                   = 'none';
    addIngredientButton.className                       = 'deleteAddButton';

    unitWeight = 0;
}

// Add ingredient to the recipe
addIngredientButton.addEventListener('click', async function () {
    const ingredientName = ingredientNameInput.value.trim();
    const ingredientQuantity = parseFloat(ingredientToAdd_quantityGrams.value);
    const recipeName = recipeNameInput.value.trim();
    
    // Error handling
    if (recipeName === '') {
        errorHandling(messageBoxDiv, addRecipeErrorsJSON.empty_recipe_name);
        return;
    }
    else if (ingredientName === ''){
        errorHandling(messageBoxDiv, addRecipeErrorsJSON.empty_ingredient_name);
        return;
    }
    else if(isNaN(ingredientQuantity) || ingredientQuantity <= 0) {
        errorHandling(messageBoxDiv, addRecipeErrorsJSON.invalid_ingredient_quantity);
        return;
    }
    else if (recipeDetailsJSON.ingredientsArray && recipeDetailsJSON.ingredientsArray.includes(ingredientName)) {
        errorHandling(messageBoxDiv, addRecipeErrorsJSON.ingredient_already_in_recipe);
        return;
    }

    // Add ingredient to local recipe details
    if (recipeDetailsJSON.ingredientsArray) {
        recipeDetailsJSON.ingredientsArray.push(ingredientName);
        recipeDetailsJSON.quantitiesArray.push(ingredientQuantity);
    } else {
        recipeDetailsJSON.ingredientsArray = [ingredientName];
        recipeDetailsJSON.quantitiesArray = [ingredientQuantity];
    }

    await createOrUpdateRecipe();
});


deleteRecipeButton.addEventListener('click', async function () {
    const recipeName = recipeNameInput.value.trim();

    if (recipeName === '') {
        errorHandling(messageBoxDiv, addRecipeErrorsJSON.empty_recipe_name);
        return;
    }

    const deleteRecipeResult = await ipcRenderer.invoke('delete-recipe', recipeName);

    errorHandling(messageBoxDiv, deleteRecipeResult);
    if(deleteRecipeResult.type){
        recipeNameInput.value = '';
        preparationBox.value = '';
        dynamicTable.innerHTML = '';
        recipeDetailsJSON = {};
        clearSuggestedIngredientRow();
    }
});

// Compute the nutritional values of an ingredient with a given quantity
function computeIngredientNutritionalValue(ingredientData, quantityGrams){
    let ingredientDataWithQuantity  = {};
    const multiplicator             = quantityGrams / 100;

    ingredientDataWithQuantity.type         = ingredientData.type || '-';
    ingredientDataWithQuantity.kcal         = isNaN(ingredientData.kcal)        ? '-' : (ingredientData.kcal        * multiplicator).toFixed(0);
    ingredientDataWithQuantity.protein      = isNaN(ingredientData.protein)     ? '-' : (ingredientData.protein     * multiplicator).toFixed(0);
    ingredientDataWithQuantity.fiber        = isNaN(ingredientData.fiber)       ? '-' : (ingredientData.fiber       * multiplicator).toFixed(0);  
    ingredientDataWithQuantity.fat          = isNaN(ingredientData.fat)         ? '-' : (ingredientData.fat         * multiplicator).toFixed(0);
    ingredientDataWithQuantity.saturated    = isNaN(ingredientData.saturated)   ? '-' : (ingredientData.saturated   * multiplicator).toFixed(0);
    ingredientDataWithQuantity.carb         = isNaN(ingredientData.carb)        ? '-' : (ingredientData.carb        * multiplicator).toFixed(0);
    ingredientDataWithQuantity.sugar        = isNaN(ingredientData.sugar)       ? '-' : (ingredientData.sugar       * multiplicator).toFixed(0);
    ingredientDataWithQuantity.salt         = isNaN(ingredientData.salt)        ? '-' : (ingredientData.salt        * multiplicator).toFixed(2);
    ingredientDataWithQuantity.chol         = isNaN(ingredientData.chol)        ? '-' : (ingredientData.chol        * multiplicator).toFixed(0);
    ingredientDataWithQuantity.cost         = isNaN(ingredientData.cost)        ? '-' : (ingredientData.unitWeight  
                                                                                                                    ? (ingredientData.cost * (quantityGrams / ingredientData.unitWeight)).toFixed(2) 
                                                                                                                    : (ingredientData.cost *  multiplicator).toFixed(2)
                                                                                        );
    ingredientDataWithQuantity.unitWeight   = ingredientData.unitWeight;
    ingredientDataWithQuantity.unitName     = ingredientData.unitName;
    return ingredientDataWithQuantity;
}




function refreshRecipeTable(recipeData){
    recipeDetailsJSON = recipeData;

    // Update the table of ingredients
    renderRecipeAndPlanTable(recipeDetailsJSON);

    // Update the recipe name and preparation text
    preparationBox.value = recipeDetailsJSON.preparation;

    // Hide the suggestion box
     suggestionBox_recipe.innerHTML = '';
}