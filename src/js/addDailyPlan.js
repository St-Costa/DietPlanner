const { ipcRenderer } = require('electron');
const { errorHandling } = require('./messageBoxUpdate');
const { showSuggestions, navigateSuggestions } = require('./suggestions');

// Message box
const messageBoxDiv = document.getElementById('messageBox');

// Plan input
const planNameInput = document.getElementById('planName');
const deletePlanButton = document.getElementById('deletePlan');
const suggestionBox_plan = document.getElementById('suggestionBox_plan');

let planNutritionalValue = {};
let planJSON = {};

// Recipe suggestions
const suggestionBox_recipe = document.getElementById('suggestionBox_recipe');
const quantityRecipe = document.getElementById('quantityRecipe');
const recipeNameInput = document.getElementById('recipeName');
const addRecipeButton = document.getElementById('addButton');

let recipeToAdd_details = {};
const suggestedRecipeDetails = {
    kcal: document.getElementById('kcalSuggestedRecipe'),
    protein: document.getElementById('proteinSuggestedRecipe'),
    fiber: document.getElementById('fiberSuggestedRecipe'),
    fat: document.getElementById('fatSuggestedRecipe'),
    saturated: document.getElementById('saturatedSuggestedRecipe'),
    carb: document.getElementById('carbSuggestedRecipe'),
    sugar: document.getElementById('sugarSuggestedRecipe'),
    salt: document.getElementById('saltSuggestedRecipe'),
    chol: document.getElementById('cholSuggestedRecipe'),
    cost: document.getElementById('costSuggestedRecipe')
};

// Dynamic table for recipes
const dynamicTable = document.getElementById('dynamicTable');



// DailyPlan suggestion
planNameInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('dailyPlan', suggestionBox_plan, this, thisWindowId);
});
planNameInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('dailyPlan', suggestionBox_plan, this, thisWindowId);
});
ipcRenderer.on('dailyPlanData', (event, dailyPlanData) => {
    planNutritionalValue = dailyPlanData;
    renderPlanTable();
});
planNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_recipe);
});
ipcRenderer.on('suggested-dailyPlan-clicked', async (event, dailyPlanNutritionalValues) => {
    // Update global variable
    planNutritionalValue = dailyPlanNutritionalValues;
    renderPlanTable();
});

// ---

// Recipe suggestions
recipeNameInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('recipe', suggestionBox_recipe, this, thisWindowId);
});
recipeNameInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('recipe', suggestionBox_recipe, this, thisWindowId);
});
ipcRenderer.on('suggested-recipe-clicked', async (event, recipeData) => {
    let readingResultJSON = {};
    ({readingResultJSON, recipeToAdd_details} =  await ipcRenderer.invoke('recipe-nutritional-values', recipeData.recipeName));
    
    console.log(readingResultJSON);

    // No error in computation of recipe nutritional values
    if (readingResultJSON.type === true) {
        addRecipeButton.style.display = 'inline';
        quantityRecipe.value = 1;
        updateRecipeDetails();
    }

    // Error in computation of recipe nutritional values
    else{
        clearSuggestedRecipeRow();
    }
});
recipeNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_plan);
});



async function renderPlanTable () {
    if(!planNutritionalValue){
        return;
    }
    else{
        // Hide the suggestion box if the recipe exists
        suggestionBox_plan.innerHTML = '';

        const recipesArray = planNutritionalValue.recipesArray || [];
        const quantitiesArray = planNutritionalValue.quantitiesArray || [];

        // Sum of values
        let kcalSum = 0;
        let proteinSum = 0;
        let fiberSum = 0;
        let fatSum = 0;
        let saturatedSum = 0;
        let carbSum = 0;
        let sugarSum = 0;
        let saltSum = 0;
        let cholSum = 0;
        let costSum = 0;

        // Clear existing rows
        dynamicTable.innerHTML = '';

        for (let i = 0; i < recipesArray.length; i++) {
            const recipeName = recipesArray[i];
            const recipeQuantity = quantitiesArray[i];

            // Request ingredient file content
            const recipeData = await ipcRenderer.invoke('recipe-nutritional-values', recipeName);

            // if recipe file does not exists
            let warningMissingIngredient = (recipeData.type === false) ? `<div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>⚠</div>` : "";
            
            
            let recipeKcal      = isNaN(recipeData.kcal)        ? '-' : recipeData.kcal.toFixed(0);
            let recipeProtein   = isNaN(recipeData.protein)     ? '-' : recipeData.protein.toFixed(0);
            let recipeFiber     = isNaN(recipeData.fiber)       ? '-' : recipeData.fiber.toFixed(0);
            let recipeFat       = isNaN(recipeData.fat)         ? '-' : recipeData.fat.toFixed(0);
            let recipeSaturated = isNaN(recipeData.saturated)   ? '-' : recipeData.saturated.toFixed(0);
            let recipeCarb      = isNaN(recipeData.carb)        ? '-' : recipeData.carb.toFixed(0);
            let recipeSugar     = isNaN(recipeData.sugar)       ? '-' : recipeData.sugar.toFixed(0);
            let recipeSalt      = isNaN(recipeData.salt)        ? '-' : recipeData.salt.toFixed(2);
            let recipeChol      = isNaN(recipeData.chol)        ? '-' : recipeData.chol.toFixed(0);
            let recipeCost      = isNaN(recipeData.cost)        ? '-' : recipeData.cost.toFixed(2);

            // Create a new row for the ingredient
            const newRow = document.createElement('tr');
            newRow.classList.add('recipe-row'); // to distinguish from the sum row
            newRow.innerHTML = `
                <td>${recipeName} ${warningMissingIngredient}</td>
                <td class="left">
                    <input type="number" id="quantityInput" value="${recipeQuantity}" class="numberInput" step="0.1"> g
                </td>
                <td class="center">${recipeKcal}</td>
                <td class="center">${recipeProtein}</td>
                <td class="center">${recipeFiber}</td>
                <td class="center">${recipeFat}</td>
                <td class="center">${recipeSaturated}</td>
                <td class="center">${recipeCarb}</td>
                <td class="center">${recipeSugar}</td>
                <td class="center">${recipeSalt}</td>
                <td class="center">${recipeChol}</td>
                <td class="center">${recipeCost}</td>
                <td><button class="removeRecipe deleteAddButton">x</button></td>
            `;
            dynamicTable.appendChild(newRow);

            // Update the sum of values
            kcalSum         += recipeKcal;
            proteinSum      += recipeProtein;
            fiberSum        += recipeFiber;
            fatSum          += recipeFat;
            saturatedSum    += recipeSaturated;
            carbSum         += recipeCarb;
            sugarSum        += recipeSugar;
            saltSum         += recipeSalt;
            cholSum         += recipeChol;
            costSum         += recipeCost;

            // Add a local variable to remember the value of the quantity before the modification
            let quantityBeforeModification = recipeQuantity;

            // Add event listener to the remove button
            newRow.querySelector('.removeRecipe').addEventListener('click', function() {
                newRow.remove();
                createOrUpdateDailyPlan();
            });

            // Add event listener to change ingredient name color on button hover
            newRow.querySelector('.removeRecipe').addEventListener('mouseover', function() {
                newRow.querySelector('td').style.color = '#ff5e00';
            });
            newRow.querySelector('.removeRecipe').addEventListener('mouseout', function() {
                newRow.querySelector('td').style.color = '';
            });

            // Add event listener to the quantity input field
            newRow.querySelector('#quantityInput').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    const quantity = parseFloat(this.value);
                    if (!isNaN(quantity)) {
                        if (quantity === 0) {
                            newRow.querySelector('.removeRecipe').click();
                            return;
                        }
                    }
                    createOrUpdateDailyPlan();

                    // Update the original variable with the new value
                    quantityBeforeModification = quantity;
                }
            });

            

            // Function to update ingredient details only in the row (not in recipe)
            function updateRowDetails(row, recipeData, recipeQuantity) {
                const cells = row.getElementsByTagName('td');
                cells[3].textContent    = (recipeData.kcal      * recipeQuantity).toFixed(0);
                cells[4].textContent    = (recipeData.protein   * recipeQuantity).toFixed(0);
                cells[5].textContent    = (recipeData.fiber     * recipeQuantity).toFixed(0);
                cells[6].textContent    = (recipeData.fat       * recipeQuantity).toFixed(0);
                cells[7].textContent    = (recipeData.saturated * recipeQuantity).toFixed(0);
                cells[8].textContent    = (recipeData.carb      * recipeQuantity).toFixed(0);
                cells[9].textContent    = (recipeData.sugar     * recipeQuantity).toFixed(0);
                cells[10].textContent   = (recipeData.salt      * recipeQuantity).toFixed(2);
                cells[11].textContent   = (recipeData.chol      * recipeQuantity).toFixed(0);
                cells[12].textContent   = (recipeData.cost      * recipeQuantity).toFixed(2);
            }

            
            // Change temporary values when the user types in the input fields
            newRow.querySelector('#quantityInput').addEventListener('input', function() {
                const quantity = parseFloat(this.value);
                if (!isNaN(quantity)) {
                    updateRowDetails(newRow, recipeData, quantity);
                }
            });

            // When modify quantity without updating, revert to the original value
            newRow.querySelector('#quantityInput').addEventListener('blur', function() {
                this.value = quantityBeforeModification.toFixed(0);
                updateRowDetails(newRow, recipeData, quantityBeforeModification);                
            });
            
        }
    }
}


// Read table, update the recipe file, update the shown table
async function createOrUpdateDailyPlan() {

    const planName = planNameInput.value.trim();

    // Populate ingredients and quantities
    const rows = dynamicTable.querySelectorAll('tr.recipe-row');
    const recipesArray = [];
    const quantitiesArray = [];
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const recipeName = cells[0].textContent;
        const quantityGrams = parseFloat(cells[1].getElementsByTagName('input')[0].value);
        recipesArray.push(recipeName);
        quantitiesArray.push(quantityGrams);
    }

    const updatedPlan = { planName, recipesArray, quantitiesArray };

    // Update or create recipe file
    let resultOfUpdate = await ipcRenderer.invoke('update-or-create-plan', updatedPlan);
    errorHandling(messageBoxDiv, resultOfUpdate);

    planNutritionalValue = await ipcRenderer.invoke('read-dailyPlan-file', planName);
    renderPlanTable();
}



// Add recipe to the daily plan
quantityRecipe.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        addRecipeButton.click();
    }
});
quantityRecipe.addEventListener('input', function () {
    updateRecipeDetails();
});

function updateRecipeDetails() {
    const quantity = parseFloat(quantityRecipe.value);
    const recipe = recipeToAdd_details;
    if (!isNaN(quantity) && recipe) {
        suggestedRecipeDetails.kcal.textContent         = recipe.kcal ? `${(recipe.kcal * quantity).toFixed(0)}` : '';
        suggestedRecipeDetails.protein.textContent      = recipe.protein ? `${(recipe.protein * quantity).toFixed(1)}` : '';
        suggestedRecipeDetails.fiber.textContent        = recipe.fiber ? `${(recipe.fiber * quantity).toFixed(1)}` : '';
        suggestedRecipeDetails.fat.textContent          = recipe.fat ? `${(recipe.fat * quantity).toFixed(1)}` : '';
        suggestedRecipeDetails.saturated.textContent    = recipe.saturated ? `${(recipe.saturated * quantity).toFixed(1)}` : '';
        suggestedRecipeDetails.carb.textContent         = recipe.carb ? `${(recipe.carb * quantity).toFixed(1)}` : '';
        suggestedRecipeDetails.sugar.textContent        = recipe.sugar ? `${(recipe.sugar * quantity).toFixed(1)}` : '';
        suggestedRecipeDetails.salt.textContent         = recipe.salt ? `${(recipe.salt * quantity).toFixed(2)}` : '';
        suggestedRecipeDetails.chol.textContent         = recipe.chol ? `${(recipe.chol * quantity).toFixed(0)}` : '-';
        suggestedRecipeDetails.cost.textContent         = recipe.cost ? `${(recipe.cost * quantity).toFixed(2)}` : '';
    }
}

function clearSuggestedRecipeRow() {
    recipeNameInput.value = '';
    suggestedRecipeDetails.kcal.textContent = '';
    suggestedRecipeDetails.protein.textContent = '';
    suggestedRecipeDetails.fiber.textContent = '';
    suggestedRecipeDetails.fat.textContent = '';
    suggestedRecipeDetails.saturated.textContent = '';
    suggestedRecipeDetails.carb.textContent = '';
    suggestedRecipeDetails.sugar.textContent = '';
    suggestedRecipeDetails.salt.textContent = '';
    suggestedRecipeDetails.chol.textContent = '';
    suggestedRecipeDetails.cost.textContent = '';
    addRecipeButton.style.display = 'none';
    addRecipeButton.className = 'deleteAddButton';
}

addRecipeButton.addEventListener('click', async function () {
    const planName = planNameInput.value.trim();
    const recipeQuantity = parseFloat(quantityRecipe.value);
    const recipeName = recipeNameInput.value.trim();
    
    if (planName === '') {
        errorHandling(messageBoxDiv, 'plan-name-missing');
        return;
    }
    if (recipeName === '') {
        errorHandling(messageBoxDiv, 'recipe-name-missing');
        return;
    }
    if (isNaN(recipeQuantity) || recipeQuantity <= 0) {
        errorHandling(messageBoxDiv, 'invalid-quantity');
        return;
    }

    const addRecipeResult = await ipcRenderer.invoke('add-recipe-to-dailyplan', { planName, recipeName, recipeQuantity });
    errorHandling(messageBoxDiv, addRecipeResult);

    if(addRecipeResult.type === true){
        clearSuggestedRecipeRow();
        planNutritionalValue = await ipcRenderer.invoke('read-dailyPlan-file', planName);
        renderPlanTable();    
    }
});


deletePlanButton.addEventListener('click', async function () {
    const recipeName = recipeNameInput.value.trim();
    if (recipeName === '') {
        messageBoxUpdate(messageBoxDiv,'Recipe name cannot be empty!', false);
        return;
    }

    const deleteRecipeResult = await ipcRenderer.invoke('delete-recipe', recipeName);

    if (deleteRecipeResult === 'success') {
        messageBoxUpdate(messageBoxDiv,'Recipe deleted!', true);
        recipeNameInput.value = '';
        dynamicTable.innerHTML = '';
        planNutritionalValue = {};
        clearSuggestedRecipeRow();
    } 
    else if (deleteRecipeResult === 'file-not-found') {
        messageBoxUpdate(messageBoxDiv,'Recipe file not found!', false);
    }
    else if (deleteRecipeResult === 'failure') {
        messageBoxUpdate(messageBoxDiv,'Failed to delete recipe!', false);
    }
});