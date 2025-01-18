const { ipcRenderer } = require('electron');
const { errorHandling } = require('./messageBoxUpdate');
const { showSuggestions, navigateSuggestions } = require('./suggestions');

// Specific errors
const addRecipeErrorsJSON = require('./addRecipeErrors.json');
const { read } = require('original-fs');
const messageBoxDiv = document.getElementById('messageBox');

// Ingredient suggestions
const ingredientNameInput = document.getElementById('ingredientName');
const suggestionBox_ingredient = document.getElementById('suggestionBox_ingredient');

const addIngredientButton = document.getElementById('addIngredientButton');

const unitNameSpan = document.getElementById('unitName');
const unitAlternativeSpan = document.getElementById('unitAlternative');
const tdQuantityInput = document.getElementById('tdQuantityInput');

const quantityGramsInput = document.getElementById('quantityGrams');
const quantityUnitInput = document.getElementById('quantityUnit');

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
const recipeNameInput = document.getElementById('recipeName');
const suggestionBox_recipe = document.getElementById('suggestionBox_recipe');
const preparationBox = document.getElementById('preparation');
const deleteRecipeButton = document.getElementById('deleteRecipe');

let recipeDetails = {};

// Ingredient in table
const dynamicTable = document.getElementById('dynamicTable');





// INGREDIENT NAME AUTOCOMPLETE
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
recipeNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_recipe);
});

ipcRenderer.on('suggested-ingredient-clicked', (event, ingredientData) => {
    // Reset quantity inputs
    quantityGramsInput.value = 0;
    quantityUnitInput.value = 0;
    
    // Update global variable
    ingredientToAdd_details = ingredientData;

    if (ingredientData) {
        tdQuantityInput.style.display = 'table-cell';
        addIngredientButton.style.display = 'inline';
        if (ingredientData.unitName) {
            unitNameSpan.textContent = ingredientData.unitName;
            unitAlternativeSpan.style.display = 'inline';
            unitWeight = ingredientData.unitWeight;
        } else {
            unitAlternativeSpan.style.display = 'none';
            unitWeight = 0;
        }
        updateIngredientDetails();
    }
    else{
        clearSuggestedIngredientRow();
    }
});



// RECIPE NAME AUTOCOMPLETE
recipeNameInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('recipe', suggestionBox_recipe, this, thisWindowId);
});
recipeNameInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('recipe', suggestionBox_recipe, this, thisWindowId);
});

ipcRenderer.on('suggested-recipe-clicked', (event, recipeData) => {
    recipeDetails = recipeData;
    renderRecipeTable();
});



preparationBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        const recipeName = recipeNameInput.value.trim();

        // Check if recipe name input is empty
        if (recipeName === '') {
            errorHandling(messageBoxDiv, addRecipeErrorsJSON.empty_recipe_name);
        }
        else{
            recipeDetails.preparationText = preparationBox.value;
            createOrUpdateRecipe();
            preparationTextBeforeModification = preparationBox.value;
        }
    }
});

// If focus is lost, revert to the original preparation
preparationBox.addEventListener('blur', function () {
    preparationBox.value = recipeDetails.preparationText || '';
});


async function renderRecipeTable () {
    if(!recipeDetails){
        return;
    }
    else{
        // Hide the suggestion box if the recipe exists
        suggestionBox_recipe.innerHTML = '';

        //Update preparation default text for local modifications
        preparationBox.value = recipeDetails.preparationText || '';
        preparationTextBeforeModification = recipeDetails.preparationText || '';


        // Clear existing rows
        dynamicTable.innerHTML = '';

        for (let i = 0; i < recipeDetails.ingredientsArray.length; i++) {
            const ingredientName    = recipeDetails.ingredientsArray[i];
            const quantityGrams     = recipeDetails.quantitiesArray[i];

            // Request ingredient file content
            const readIngredientResult = await ipcRenderer.invoke('read-ingredient-file', ingredientName);
            const [readResultJSON, ingredientData] = Object.values(readIngredientResult);

            let ingredientDataWithQuantity  = computeIngredientNutritionalValue(ingredientData, quantityGrams)
            let warningMissingIngredient    = (!readResultJSON.type)  
                                                ?  `<div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>⚠</div>` 
                                                : "";

        
            // Create a new row for the ingredient
            const newRow = addIngredientRow(ingredientName, quantityGrams, ingredientDataWithQuantity, warningMissingIngredient);
            addEventListenerToRow(newRow, ingredientName, ingredientData);
            dynamicTable.appendChild(newRow);          
        }

        // add sum row
        const sumRow = addSumRow();
        dynamicTable.appendChild(sumRow);
        updateSumRow();
    }
}


// Read table, update the recipe file, update the shown table
async function createOrUpdateRecipe() {
    // Update or create recipe file
    let updateOrCreateResult = await ipcRenderer.invoke('update-or-create-file', recipeDetails, 'recipe');
    const [resultJSON, updatedRecipeData] = Object.values(updateOrCreateResult);
    errorHandling(messageBoxDiv, resultJSON);

    if(resultJSON.type){
        recipeDetails = updatedRecipeData; 
        renderRecipeTable();
    }
}

// Update ingredient to add with nutritional values
quantityGramsInput.addEventListener('input', function () {
    const unitWeight = ingredientToAdd_details.unitWeight || 0;
    if (unitWeight > 0) {
        const grams = parseFloat(this.value);
        if (!isNaN(grams)) {
            const units = grams / unitWeight;
            quantityUnitInput.value = units.toFixed(2);
        } else {
            quantityUnitInput.value = '';
        }
    }
    updateIngredientDetails();
});

quantityGramsInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { addIngredientButton.click(); }
});
quantityUnitInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { addIngredientButton.click(); }
});


quantityUnitInput.addEventListener('input', function () {
    const unitWeight = ingredientToAdd_details.unitWeight || 0;
    if (typeof unitWeight !== 'undefined' && unitWeight > 0) {
        const units = parseFloat(this.value);
        if (!isNaN(units)) {
            const grams = units * unitWeight;
            quantityGramsInput.value = grams.toFixed(1);
        } else {
            quantityGramsInput.value = '';
        }
    }
    updateIngredientDetails();
});

function updateIngredientDetails() {
    console.log("[updateIngredientDetails]");

    const grams = parseFloat(quantityGramsInput.value);
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

function clearSuggestedIngredientRow() {
    ingredientNameInput.value = '';
    suggestedIngredientDetails.type.textContent = '';
    suggestedIngredientDetails.kcal.textContent = '';
    suggestedIngredientDetails.protein.textContent = '';
    suggestedIngredientDetails.fiber.textContent = '';
    suggestedIngredientDetails.fat.textContent = '';
    suggestedIngredientDetails.saturated.textContent = '';
    suggestedIngredientDetails.carb.textContent = '';
    suggestedIngredientDetails.sugar.textContent = '';
    suggestedIngredientDetails.salt.textContent = '';
    suggestedIngredientDetails.chol.textContent = '';
    suggestedIngredientDetails.cost.textContent = '';
    tdQuantityInput.style.display = 'none';
    unitAlternativeSpan.style.display = 'none';
    addIngredientButton.style.display = 'none';
    addIngredientButton.className = 'deleteAddButton';

    unitWeight = 0;
}

addIngredientButton.addEventListener('click', async function () {
    const ingredientName = ingredientNameInput.value.trim();
    const ingredientQuantity = parseFloat(quantityGramsInput.value);
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
    else if (recipeDetails.ingredientsArray && recipeDetails.ingredientsArray.includes(ingredientName)) {
        errorHandling(messageBoxDiv, addRecipeErrorsJSON.ingredient_already_in_recipe);
        return;
    }

    // Add ingredient to local recipe details
    if (recipeDetails.ingredientsArray) {
        recipeDetails.ingredientsArray.push(ingredientName);
        recipeDetails.quantitiesArray.push(ingredientQuantity);
    } else {
        recipeDetails.ingredientsArray = [ingredientName];
        recipeDetails.quantitiesArray = [ingredientQuantity];
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
        recipeDetails = {};
        clearSuggestedIngredientRow();
    }
});

function computeIngredientNutritionalValue(ingredientData, quantityGrams){

    let ingredientDataWithQuantity = {};
    const multiplicator = quantityGrams / 100;

    ingredientDataWithQuantity.type         = ingredientData.type || '-';
    ingredientDataWithQuantity.kcal         = isNaN(ingredientData.kcal) 
                                                ? '-' : (ingredientData.kcal      * multiplicator).toFixed(0);
    ingredientDataWithQuantity.protein      = isNaN(ingredientData.protein) 
                                                ? '-' : (ingredientData.protein   * multiplicator).toFixed(0);
    ingredientDataWithQuantity.fiber        = isNaN(ingredientData.fiber) 
                                                ? '-' : (ingredientData.fiber     * multiplicator).toFixed(0);  
    ingredientDataWithQuantity.fat          = isNaN(ingredientData.fat) 
                                                ? '-' : (ingredientData.fat       * multiplicator).toFixed(0);
    ingredientDataWithQuantity.saturated    = isNaN(ingredientData.saturated) 
                                                ? '-' : (ingredientData.saturated * multiplicator).toFixed(0);
    ingredientDataWithQuantity.carb         = isNaN(ingredientData.carb) 
                                                ? '-' : (ingredientData.carb      * multiplicator).toFixed(0);
    ingredientDataWithQuantity.sugar        = isNaN(ingredientData.sugar) 
                                                ? '-' : (ingredientData.sugar     * multiplicator).toFixed(0);
    ingredientDataWithQuantity.salt         = isNaN(ingredientData.salt) 
                                                ? '-' : (ingredientData.salt      * multiplicator).toFixed(2);
    ingredientDataWithQuantity.chol         = isNaN(ingredientData.chol) 
                                                ? '-' : (ingredientData.chol      * multiplicator).toFixed(0);
    ingredientDataWithQuantity.cost         = isNaN(ingredientData.cost) 
                                                ? '-' 
                                                : (ingredientData.unitWeight 
                                                    ? (ingredientData.cost * (quantityGrams / ingredientData.unitWeight)).toFixed(2) 
                                                    : (ingredientData.cost *  multiplicator).toFixed(2)
                                                );
    ingredientDataWithQuantity.unitWeight = ingredientData.unitWeight;
    ingredientDataWithQuantity.unitName = ingredientData.unitName;
    return ingredientDataWithQuantity;
}

function addIngredientRow(ingredientName, quantityGrams, ingredientDataWithQuantity, warningMissingIngredient){
    const newRow = document.createElement('tr');

    newRow.classList.add('ingredient-row'); // to distinguish from the sum row
    
    newRow.innerHTML = `
        <td>${ingredientName} ${warningMissingIngredient}</td>
        <td class="left">
            <input type="number" id="gramsInput" value="${quantityGrams}" class="numberInput" step="0.1"> g
            ${ingredientDataWithQuantity.unitWeight ? `
            <div style="display: inline;">
                ||
                <input class="numberInput" id="unitInput" type="number" value="${(quantityGrams / ingredientDataWithQuantity.unitWeight).toFixed(2)}" placeholder="[0,∞]" min="0" step="0.01" oninput="validity.valid||(value='');"> 
                of 
                <span>${ingredientDataWithQuantity.unitName}</span>
            </div>` : ''}
        </td>
        <td class="center">${ingredientDataWithQuantity.type}</td>
        <td class="center" id="ingKcal">${ingredientDataWithQuantity.kcal}</td>
        <td class="center" id="ingProtein">${ingredientDataWithQuantity.protein}</td>
        <td class="center" id="ingFiber">${ingredientDataWithQuantity.fiber}</td>
        <td class="center" id="ingFat">${ingredientDataWithQuantity.fat}</td>
        <td class="center" id="ingSat">${ingredientDataWithQuantity.saturated}</td>
        <td class="center" id="ingCarb">${ingredientDataWithQuantity.carb}</td>
        <td class="center" id="ingSugar">${ingredientDataWithQuantity.sugar}</td>
        <td class="center" id="ingSalt">${ingredientDataWithQuantity.salt}</td>
        <td class="center" id="ingChol">${ingredientDataWithQuantity.chol}</td>
        <td class="center" id="ingCost">${ingredientDataWithQuantity.cost}</td>
        <td><button class="removeIngredient deleteAddButton">x</button></td>
    `;

    return newRow;
}

function addSumRow(){
    const newRow = document.createElement('tr');
    newRow.classList.add('sum-row');

    newRow.innerHTML = `
        <td></td>
        <td></td>
        <td></td>
        <td class="center sumRow" id="totKcal"></td>
        <td class="center sumRow" id="totProtein"></td>
        <td class="center sumRow" id="totFiber"></td>
        <td class="center sumRow" id="totFat"></td>
        <td class="center sumRow" id="totSat"></td>
        <td class="center sumRow" id="totCarb"></td>
        <td class="center sumRow" id="totSugar"></td>
        <td class="center sumRow" id="totSalt"></td>
        <td class="center sumRow" id="totChol"></td>
        <td class="center sumRow" id="totCost"></td>
        <td></td>
    `;
    return newRow;
}

function updateSumRow(){
    const sumRow = document.querySelector('.sum-row');
    const sumCells = sumRow.getElementsByTagName('td');

    let sumKcal = 0;
    let sumProtein = 0;
    let sumFiber = 0;
    let sumFat = 0;
    let sumSat = 0;
    let sumCarb = 0;
    let sumSugar = 0;
    let sumSalt = 0;
    let sumChol = 0;
    let sumCost = 0;

    for (let i = 0; i < dynamicTable.children.length; i++) {
        const row = dynamicTable.children[i];
        if (row.classList.contains('ingredient-row')) {
            const cells = row.getElementsByTagName('td');
            sumKcal     += parseInt(row.querySelector('#ingKcal').textContent);
            sumProtein  += parseInt(row.querySelector('#ingProtein').textContent);
            sumFiber    += parseInt(row.querySelector('#ingFiber').textContent);
            sumFat      += parseInt(row.querySelector('#ingFat').textContent);
            sumSat      += parseInt(row.querySelector('#ingSat').textContent);
            sumCarb     += parseInt(row.querySelector('#ingCarb').textContent);
            sumSugar    += parseInt(row.querySelector('#ingSugar').textContent);
            sumSalt     += parseFloat(row.querySelector('#ingSalt').textContent);
            sumChol     += parseInt(row.querySelector('#ingChol').textContent);
            sumCost     += parseFloat(row.querySelector('#ingCost').textContent);
        }
    }

    sumRow.querySelector('#totKcal').textContent    = isNaN(sumKcal)            ? "-" : sumKcal;
    sumRow.querySelector('#totProtein').textContent = isNaN(sumProtein)         ? "-" : sumProtein;
    sumRow.querySelector('#totFiber').textContent   = isNaN(sumFiber)           ? "-" : sumFiber;
    sumRow.querySelector('#totFat').textContent     = isNaN(sumFat)             ? "-" : sumFat;
    sumRow.querySelector('#totSat').textContent     = isNaN(sumSat)             ? "-" : sumSat;
    sumRow.querySelector('#totCarb').textContent    = isNaN(sumCarb)            ? "-" : sumCarb;
    sumRow.querySelector('#totSugar').textContent   = isNaN(sumSugar)           ? "-" : sumSugar;
    sumRow.querySelector('#totSalt').textContent    = isNaN(sumSalt.toFixed(2)) ? "-" : sumSalt.toFixed(2);
    sumRow.querySelector('#totChol').textContent    = isNaN(sumChol)            ? "-" : sumChol;
    sumRow.querySelector('#totCost').textContent    = isNaN(sumCost.toFixed(2)) ? "-" : sumCost.toFixed(2);
}

function addEventListenerToRow(row, ingredientName, ingredientData){
    

    // Change ingredient name color on button hover
    row.querySelector('.removeIngredient').addEventListener('mouseover', function() {
        row.querySelector('td').style.color = '#ff5e00';
    });
    row.querySelector('.removeIngredient').addEventListener('mouseout', function() {
        row.querySelector('td').style.color = '';
    });

    // Remove ingredient button
    row.querySelector('.removeIngredient').addEventListener('click', function() {
        row.remove();
        locallyModifyRecipe(ingredientName, 0);
        createOrUpdateRecipe();
    });

    // Add event listener to the gram input field
    row.querySelector('#gramsInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const grams = parseFloat(this.value);
            if (!isNaN(grams)) {
                if (grams === 0) {
                    row.querySelector('.removeIngredient').click();
                    return;
                } else {
                    const units = grams / ingredientData.unitWeight;
                    const unitInput = row.querySelector('#unitInput');
                    if (unitInput) {
                        unitInput.value = units.toFixed(2);
                    }
                }
            }

            locallyModifyRecipe(ingredientName, grams);
            createOrUpdateRecipe();
        }
    });

    // Add event listener to the unit input field
    const unitInput = row.querySelector('#unitInput');
    if (unitInput) {
        unitInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const units = parseFloat(this.value);
                let grams = 0;
                if (!isNaN(units)) {
                    grams = units * ingredientData.unitWeight;
                    row.querySelector('#gramsInput').value = grams.toFixed(2);
                    if (grams === 0) {
                        row.querySelector('.removeIngredient').click();
                        return;
                    }
                }

                locallyModifyRecipe(ingredientName, grams);
                createOrUpdateRecipe();
            }
        });
    }

    // Change temporary values when the user types in the input fields
    row.querySelector('#gramsInput').addEventListener('input', function() {
        const grams = parseFloat(this.value);
        if (!isNaN(grams)) {
            const units = grams / ingredientData.unitWeight;
            const unitInput = row.querySelector('#unitInput');
            if (unitInput) {
                unitInput.value = units.toFixed(2);
            }
            updateRowDetails(row, ingredientData, grams);
        }
    });
    const unitInputField = row.querySelector('#unitInput');
    if (unitInputField) {
        unitInputField.addEventListener('input', function() {
            const units = parseFloat(this.value);
            if (!isNaN(units)) {
                const grams = units * ingredientData.unitWeight;
                row.querySelector('#gramsInput').value = grams.toFixed(0);
                updateRowDetails(row, ingredientData, grams);
            }
        });
    }

    // When modify grams without updating the recipe, revert to the original value
    row.querySelector('#gramsInput').addEventListener('blur', function() {
        this.value = recipeDetails.quantitiesArray[recipeDetails.ingredientsArray.indexOf(ingredientName)].toFixed(0);
        const unitInput = row.querySelector('#unitInput');
        if (unitInput) {
            unitInput.value = (this.value / ingredientData.unitWeight).toFixed(2);
        }
        updateRowDetails(row, ingredientData, this.value);                
    });
    // When modify units without updating the recipe, revert to the original value
    if (unitInputField) {
        unitInputField.addEventListener('blur', function() {
            gramsBeforeModification = recipeDetails.quantitiesArray[recipeDetails.ingredientsArray.indexOf(ingredientName)].toFixed(0);
            this.value = (gramsBeforeModification / ingredientData.unitWeight).toFixed(2);
            row.querySelector('#gramsInput').value = gramsBeforeModification;
            updateRowDetails(row, ingredientData, gramsBeforeModification);
        });
    }

    // Function to update ingredient details only in the row (not in recipe)
    function updateRowDetails(row, ingredientData, quantityGrams) {
        const ingredientDataWithQuantity = computeIngredientNutritionalValue(ingredientData, quantityGrams);
        
        const cells = row.getElementsByTagName('td');
        cells[3].textContent    = ingredientDataWithQuantity.kcal; 
        cells[4].textContent    = ingredientDataWithQuantity.protein;   
        cells[5].textContent    = ingredientDataWithQuantity.fiber;     
        cells[6].textContent    = ingredientDataWithQuantity.fat;       
        cells[7].textContent    = ingredientDataWithQuantity.saturated; 
        cells[8].textContent    = ingredientDataWithQuantity.carb;      
        cells[9].textContent    = ingredientDataWithQuantity.sugar;     
        cells[10].textContent   = ingredientDataWithQuantity.salt;      
        cells[11].textContent   = ingredientDataWithQuantity.chol;    
        cells[12].textContent   = ingredientDataWithQuantity.cost;
    
        updateSumRow();                    
    }

}

function locallyModifyRecipe(ingredientName, ingredientQuantity){
    indexToModify = recipeDetails.ingredientsArray.indexOf(ingredientName)
    
    if(ingredientQuantity === 0){
        recipeDetails.ingredientsArray.splice(indexToModify, 1);
        recipeDetails.quantitiesArray.splice(indexToModify, 1);   
    }
    else{
        recipeDetails.quantitiesArray[indexToModify] = ingredientQuantity;
    }

}