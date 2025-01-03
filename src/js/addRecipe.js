const { ipcRenderer } = require('electron');
const { messageBoxUpdate } = require('./messageBoxUpdate');

const ingredientNameInput = document.getElementById('ingredientName');
const suggestionBox = document.getElementById('suggestionBox');
const unitNameSpan = document.getElementById('unitName');
const messageBoxDiv = document.getElementById('messageBox');
const unitAlternativeSpan = document.getElementById('unitAlternative');
const quantityGramsInput = document.getElementById('quantityGrams');
const quantityUnitInput = document.getElementById('quantityUnit');
const recipeNameInput = document.getElementById('recipeName');
const suggestionBoxRecipe = document.getElementById('suggestionBox_recipe');
const preparationBox = document.getElementById('preparation');
const dynamicTable = document.getElementById('dynamicTable');
const addIngredientButton = document.getElementById('addIngredientButton');
const tdQuantityInput = document.getElementById('tdQuantityInput');

let ingredientToAdd_details = {};
const suggestedIngredientDetails = {
    type: document.getElementById('typeSuggestedIngredient'),
    kcal: document.getElementById('kcalSuggestedIngredient'),
    protein: document.getElementById('proteinSuggestedIngredient'),
    fiber: document.getElementById('fiberSuggestedIngredient'),
    fat: document.getElementById('fatSuggestedIngredient'),
    saturated: document.getElementById('saturatedSuggestedIngredient'),
    carb: document.getElementById('carbSuggestedIngredient'),
    sugar: document.getElementById('sugarSuggestedIngredient'),
    salt: document.getElementById('saltSuggestedIngredient'),
    chol: document.getElementById('cholSuggestedIngredient'),
    cost: document.getElementById('costSuggestedIngredient')
};
let recipeNutritionalValue = {};


let currentFocus = -1;


// INGREDIENT NAME AUTOCOMPLETE
ingredientNameInput.addEventListener('focus', async function () {
    let ingredientsNameList = await ipcRenderer.invoke('get-ingredient-names');
    const input = this.value.toLowerCase();
    const suggestions = ingredientsNameList.filter(name => name.toLowerCase().includes(input));
    if (!suggestions.includes(input)) {
        clearSuggestedIngredientRow();
    }
    showSuggestions(suggestions, suggestionBox, ingredientNameInput);
});
ingredientNameInput.addEventListener('input', async function () {
    let ingredientsNameList = await ipcRenderer.invoke('get-ingredient-names');
    const input = this.value.toLowerCase();
    const suggestions = ingredientsNameList.filter(name => name.toLowerCase().includes(input));
/*     if (!suggestions.includes(input)) {
        clearSuggestedIngredientRow();
    } */
    showSuggestions(suggestions, suggestionBox, ingredientNameInput);
});



// Request recipe names for autocompletion
recipeNameInput.addEventListener('focus', async function () {
    let recipesNameList = await ipcRenderer.invoke('get-recipe-names');
    const recipeName = recipeNameInput.value.trim().toLowerCase();

    const suggestions = recipesNameList.filter(name => name.toLowerCase().includes(recipeName.toLowerCase()));
    showSuggestions(suggestions, suggestionBoxRecipe, recipeNameInput);
});
recipeNameInput.addEventListener('input', async function () {
    let recipesNameList = await ipcRenderer.invoke('get-recipe-names');
    const recipeName = recipeNameInput.value.trim().toLowerCase();

    // If the recipe does not exist, clear table
    if (!recipesNameList.includes(recipeName)) {
        dynamicTable.innerHTML = '';
        preparationBox.value = '';
        recipeNutritionalValue = {};
        clearSuggestedIngredientRow();
    }

    const suggestions = recipesNameList.filter(name => name.toLowerCase().includes(recipeName));
    showSuggestions(suggestions, suggestionBoxRecipe, recipeNameInput);
});



function showSuggestions(suggestions, suggestionBox, inputElement) {
    suggestionBox.innerHTML = '';
    currentFocus = -1;
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.style.padding = '8px';
        div.style.cursor = 'pointer';
        div.addEventListener('click', async function () {
            inputElement.value = suggestion;
            suggestionBox.innerHTML = '';
            if (inputElement === recipeNameInput) {
                // Request recipe file content
                recipeNutritionalValue = await ipcRenderer.invoke('read-recipe-file', suggestion);
                renderRecipeTable();
            } else if (inputElement === ingredientNameInput) {
                // Reset quantity inputs
                quantityGramsInput.value = 0;
                quantityUnitInput.value = 0;
                // Request ingredient file content
                ingredientToAdd_details = await ipcRenderer.invoke('read-ingredient-file', suggestion);
                if (ingredientToAdd_details) {
                    tdQuantityInput.style.display = 'table-cell';
                    addIngredientButton.style.display = 'inline';
                    if (ingredientToAdd_details.unitName) {
                        unitNameSpan.textContent = ingredientToAdd_details.unitName;
                        unitAlternativeSpan.style.display = 'inline';
                        unitWeight = ingredientToAdd_details.unitWeight;
                    } else {
                        unitAlternativeSpan.style.display = 'none';
                        unitWeight = 0;
                    }
                    updateIngredientDetails();
                }
                else{
                    clearSuggestedIngredientRow();
                }
            }
        });
        div.addEventListener('mouseover', function () {
            removeActive(suggestionBox.getElementsByTagName('div'));
            this.classList.add('autocomplete-active');
        });
        div.addEventListener('mouseout', function () {
            this.classList.remove('autocomplete-active');
        });
        suggestionBox.appendChild(div);
    });
    const rect = inputElement.getBoundingClientRect();
    suggestionBox.style.left = `${rect.left}px`;
    suggestionBox.style.top = `${rect.bottom}px`;
    suggestionBox.style.width = `${rect.width}px`;
}

function addActive(items) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add('autocomplete-active');
}

function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('autocomplete-active');
    }
}

ingredientNameInput.addEventListener('keydown', function (e) {
    const suggestionItems = suggestionBox.getElementsByTagName('div');
    if (e.key === 'ArrowDown') {
        currentFocus++;
        addActive(suggestionItems);
        if (currentFocus >= 0 && currentFocus < suggestionItems.length) {
            suggestionItems[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    } else if (e.key === 'ArrowUp') {
        currentFocus--;
        addActive(suggestionItems);
        if (currentFocus >= 0 && currentFocus < suggestionItems.length) {
            suggestionItems[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFocus > -1) {
            if (suggestionItems) suggestionItems[currentFocus].click();
        }
    }
});

recipeNameInput.addEventListener('keydown', function (e) {
    const suggestionItems = suggestionBoxRecipe.getElementsByTagName('div');
    if (e.key === 'ArrowDown') {
        currentFocus++;
        addActive(suggestionItems);
        if (currentFocus >= 0 && currentFocus < suggestionItems.length) {
            suggestionItems[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    } else if (e.key === 'ArrowUp') {
        currentFocus--;
        addActive(suggestionItems);
        if (currentFocus >= 0 && currentFocus < suggestionItems.length) {
            suggestionItems[currentFocus].scrollIntoView({ block: 'nearest' });
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFocus > -1) {
            if (suggestionItems) suggestionItems[currentFocus].click();
        }
    }
});

// Save temp preparation text
let preparationTextBeforeModification = "";

preparationBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const recipeName = recipeNameInput.value.trim();
        if (recipeName === '') {
            messageBoxUpdate(messageBoxDiv,'Recipe name cannot be empty!', false);
            return;
        }

        createOrUpdateRecipe();

        preparationTextBeforeModification = preparationBox.value;
    }
});

preparationBox.addEventListener('blur', function () {
    preparationBox.value = preparationTextBeforeModification;
});


async function renderRecipeTable () {
    if(!recipeNutritionalValue){
        return;
    }
    else{
        // Hide the suggestion box if the recipe exists
        suggestionBoxRecipe.innerHTML = '';

        preparationBox.value = recipeNutritionalValue.preparationText || '';
        //Update preparation default text for local modifications
        preparationTextBeforeModification = recipeNutritionalValue.preparationText || '';

        const ingredientsArray = recipeNutritionalValue.ingredientsArray || [];
        const quantitiesArray = recipeNutritionalValue.quantitiesArray || [];

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

        for (let i = 0; i < ingredientsArray.length; i++) {
            const ingredientName = ingredientsArray[i];
            const quantityGrams = quantitiesArray[i];

            // Request ingredient file content
            const ingredientData = await ipcRenderer.invoke('read-ingredient-file', ingredientName);

            // Compute ingredient details
            let ingredientKcal = ingredientData.kcal * quantityGrams / 100;
            let ingredientProtein = ingredientData.protein * quantityGrams / 100;
            let ingredientFiber = ingredientData.fiber * quantityGrams / 100;
            let ingredientFat = ingredientData.fat * quantityGrams / 100;
            let ingredientSaturated = ingredientData.saturated * quantityGrams / 100;
            let ingredientCarb = ingredientData.carb * quantityGrams / 100;
            let ingredientSugar = ingredientData.sugar * quantityGrams / 100;
            let ingredientSalt = ingredientData.salt * quantityGrams / 100;
            let ingredientChol = ingredientData.chol * quantityGrams / 100;
            let ingredientCost = ingredientData.unitWeight ? (ingredientData.cost * (quantityGrams / ingredientData.unitWeight)) : (ingredientData.cost * quantityGrams / 100);

            // Create a new row for the ingredient
            const newRow = document.createElement('tr');
            newRow.classList.add('ingredient-row'); // to distinguish from the sum row
            newRow.innerHTML = `
                <td>${ingredientName}</td>
                <td class="left">
                    <input type="number" id="gramsInput" value="${quantityGrams}" class="numberInput" step="0.1"> g
                    ${ingredientData.unitWeight ? `
                    <div style="display: inline;">
                        ||
                        <input class="numberInput" id="unitInput" type="number" value="${(quantityGrams / ingredientData.unitWeight).toFixed(2)}" placeholder="[0,∞]" min="0" step="0.01" oninput="validity.valid||(value='');"> 
                        of 
                        <span>${ingredientData.unitName}</span>
                    </div>` : ''}
                </td>
                <td class="center">${ingredientData.type}</td>
                <td class="center">${ingredientKcal.toFixed(0)}</td>
                <td class="center">${ingredientProtein.toFixed(0)}</td>
                <td class="center">${ingredientFiber.toFixed(0)}</td>
                <td class="center">${ingredientFat.toFixed(0)}</td>
                <td class="center">${ingredientSaturated.toFixed(0)}</td>
                <td class="center">${ingredientCarb.toFixed(0)}</td>
                <td class="center">${ingredientSugar.toFixed(0)}</td>
                <td class="center">${ingredientSalt.toFixed(2)}</td>
                <td class="center">${ingredientChol.toFixed(0)}</td>
                <td class="center">${ingredientCost.toFixed(2)}</td>
                <td><button class="removeIngredient deleteAddButton">x</button></td>
            `;
            dynamicTable.appendChild(newRow);

            // Update the sum of values
            kcalSum += ingredientKcal;
            proteinSum += ingredientProtein;
            fiberSum += ingredientFiber;
            fatSum += ingredientFat;
            saturatedSum += ingredientSaturated;
            carbSum += ingredientCarb;
            sugarSum += ingredientSugar;
            saltSum += ingredientSalt;
            cholSum += ingredientChol;
            costSum += ingredientCost;

            // Add a local variable to remember the value of the quantity before the modification
            let gramsBeforeModification = quantityGrams;

            // Add event listener to the remove button
            newRow.querySelector('.removeIngredient').addEventListener('click', function() {
                newRow.remove();
                createOrUpdateRecipe();
            });

            // Add event listener to change ingredient name color on button hover
            newRow.querySelector('.removeIngredient').addEventListener('mouseover', function() {
                newRow.querySelector('td').style.color = '#ff5e00';
            });
            newRow.querySelector('.removeIngredient').addEventListener('mouseout', function() {
                newRow.querySelector('td').style.color = '';
            });

            // Add event listener to the gram input field
            newRow.querySelector('#gramsInput').addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    const grams = parseFloat(this.value);
                    if (!isNaN(grams)) {
                        const units = grams / ingredientData.unitWeight;
                        const unitInput = newRow.querySelector('#unitInput');
                        if (unitInput) {
                            unitInput.value = units.toFixed(2);
                        }
                    }
                    createOrUpdateRecipe();

                    // Update the originalGrams variable with the new value
                    gramsBeforeModification = grams;
                }
            });

            // Add event listener to the unit input field
            const unitInput = newRow.querySelector('#unitInput');
            if (unitInput) {
                unitInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        const units = parseFloat(this.value);
                        if (!isNaN(units)) {
                            const grams = units * ingredientData.unitWeight;
                            newRow.querySelector('#gramsInput').value = grams.toFixed(2);
                        }
                        createOrUpdateRecipe();

                        // Update the originalGrams variable with the new value
                        gramsBeforeModification = parseFloat(newRow.querySelector('#gramsInput').value);
                    }
                });
            }

            // Function to update ingredient details only in the row (not in recipe)
            function updateRowDetails(row, ingredientData, quantityGrams) {
                const cells = row.getElementsByTagName('td');
                cells[3].textContent = (ingredientData.kcal * quantityGrams / 100).toFixed(2);
                cells[4].textContent = (ingredientData.protein * quantityGrams / 100).toFixed(2);
                cells[5].textContent = (ingredientData.fiber * quantityGrams / 100).toFixed(2);
                cells[6].textContent = (ingredientData.fat * quantityGrams / 100).toFixed(2);
                cells[7].textContent = (ingredientData.saturated * quantityGrams / 100).toFixed(2);
                cells[8].textContent = (ingredientData.carb * quantityGrams / 100).toFixed(2);
                cells[9].textContent = (ingredientData.sugar * quantityGrams / 100).toFixed(2);
                cells[10].textContent = (ingredientData.salt * quantityGrams / 100).toFixed(2);
                cells[11].textContent = (ingredientData.chol * quantityGrams / 100).toFixed(2);
                cells[12].textContent = ingredientData.unitWeight ? (ingredientData.cost * (quantityGrams / ingredientData.unitWeight)).toFixed(2) : (ingredientData.cost * quantityGrams / 100).toFixed(2);
            }

            
            // Change temporary values when the user types in the input fields
            newRow.querySelector('#gramsInput').addEventListener('input', function() {
                const grams = parseFloat(this.value);
                if (!isNaN(grams)) {
                    const units = grams / ingredientData.unitWeight;
                    const unitInput = newRow.querySelector('#unitInput');
                    if (unitInput) {
                        unitInput.value = units.toFixed(2);
                    }
                    updateRowDetails(newRow, ingredientData, grams);
                }
            });
            const unitInputField = newRow.querySelector('#unitInput');
            if (unitInputField) {
                unitInputField.addEventListener('input', function() {
                    const units = parseFloat(this.value);
                    if (!isNaN(units)) {
                        const grams = units * ingredientData.unitWeight;
                        newRow.querySelector('#gramsInput').value = grams.toFixed(0);
                        updateRowDetails(newRow, ingredientData, grams);
                    }
                });
            }

            // When modify grams without updating the recipe, revert to the original value
            newRow.querySelector('#gramsInput').addEventListener('blur', function() {
                this.value = gramsBeforeModification.toFixed(0);
                const unitInput = newRow.querySelector('#unitInput');
                if (unitInput) {
                    unitInput.value = (gramsBeforeModification / ingredientData.unitWeight).toFixed(2);
                }
                updateRowDetails(newRow, ingredientData, gramsBeforeModification);                
            });
            // When modify units without updating the recipe, revert to the original value
            if (unitInputField) {
                unitInputField.addEventListener('blur', function() {
                    this.value = (gramsBeforeModification / ingredientData.unitWeight).toFixed(2);
                    newRow.querySelector('#gramsInput').value = gramsBeforeModification.toFixed(0);
                    updateRowDetails(newRow, ingredientData, gramsBeforeModification);
                });
            }
        }
    }
}


// Read table, update the recipe file, update the shown table
async function createOrUpdateRecipe() {
    

    const recipeName = recipeNameInput.value.trim();
    const preparationText = preparationBox.value.trim();

    // Populate ingredients and quantities
    const rows = dynamicTable.querySelectorAll('tr.ingredient-row');
    const ingredientsArray = [];
    const quantitiesArray = [];
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const ingredientName = cells[0].textContent;
        const quantityGrams = parseFloat(cells[1].getElementsByTagName('input')[0].value);
        ingredientsArray.push(ingredientName);
        quantitiesArray.push(quantityGrams);
    }

    const updatedRecipe = { recipeName, ingredientsArray, quantitiesArray, preparationText };

    // Update or create recipe file
    let resultOfUpdate = recipeNutritionalValue = await ipcRenderer.invoke('update-or-create-recipe', updatedRecipe);

    switch (resultOfUpdate) {
        case 'file-created':
            messageBoxUpdate(messageBoxDiv,'Recipe created!', true);
            recipeNutritionalValue = await ipcRenderer.invoke('read-recipe-file', recipeName);
            renderRecipeTable();
            break;
        
        case 'file-creation-failure':
            messageBoxUpdate(messageBoxDiv,'Failed to create recipe!', false);
            break;

        case 'file-updated':
            messageBoxUpdate(messageBoxDiv,'Recipe updated!', true);
            recipeNutritionalValue = await ipcRenderer.invoke('read-recipe-file', recipeName);
            renderRecipeTable();
            break;

        case 'file-update-failure':
            messageBoxUpdate(messageBoxDiv,'Failed to update recipe!', false);
            break;
        
        case 'failure':
            messageBoxUpdate(messageBoxDiv,'Failed!', false);
            break;
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
    if (e.key === 'Enter') {
        addIngredientButton.click();
    }
});
quantityUnitInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        addIngredientButton.click();
    }
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
    const grams = parseFloat(quantityGramsInput.value);
    const ingredient = ingredientToAdd_details;
    if (!isNaN(grams) && ingredient) {
        suggestedIngredientDetails.type.textContent = ingredient.type || '';
        suggestedIngredientDetails.kcal.textContent = ingredient.kcal ? `${(ingredient.kcal * grams / 100).toFixed(0)}` : '';
        suggestedIngredientDetails.protein.textContent = ingredient.protein ? `${(ingredient.protein * grams / 100).toFixed(1)}` : '';
        suggestedIngredientDetails.fiber.textContent = ingredient.fiber ? `${(ingredient.fiber * grams / 100).toFixed(1)}` : '';
        suggestedIngredientDetails.fat.textContent = ingredient.fat ? `${(ingredient.fat * grams / 100).toFixed(1)}` : '';
        suggestedIngredientDetails.saturated.textContent = ingredient.saturated ? `${(ingredient.saturated * grams / 100).toFixed(1)}` : '';
        suggestedIngredientDetails.carb.textContent = ingredient.carb ? `${(ingredient.carb * grams / 100).toFixed(1)}` : '';
        suggestedIngredientDetails.sugar.textContent = ingredient.sugar ? `${(ingredient.sugar * grams / 100).toFixed(1)}` : '';
        suggestedIngredientDetails.salt.textContent = ingredient.salt ? `${(ingredient.salt * grams / 100).toFixed(2)}` : '';
        suggestedIngredientDetails.chol.textContent = ingredient.chol ? `${(ingredient.chol * grams / 100).toFixed(0)}` : '';
        if (unitWeight > 0 && !isNaN(parseFloat(quantityUnitInput.value))) {
            const units = parseFloat(quantityUnitInput.value);
            suggestedIngredientDetails.cost.textContent = ingredient.cost ? `${(ingredient.cost * units).toFixed(2)}` : '';
        } else {
            suggestedIngredientDetails.cost.textContent = ingredient.cost ? `${(ingredient.cost * grams / 100).toFixed(2)}` : '';
        }
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

document.getElementById('addIngredientButton').addEventListener('click', async function () {
    const ingredientName = ingredientNameInput.value.trim();
    const ingredientQuantity = parseFloat(quantityGramsInput.value);
    const recipeName = recipeNameInput.value.trim();
    
    if (recipeName === '') {
        messageBoxUpdate(messageBoxDiv,'Recipe name cannot be empty!', false);
        return;
    }
    else if (ingredientName === '' || isNaN(ingredientQuantity) || ingredientQuantity <= 0) {
        messageBoxUpdate(messageBoxDiv,'Ingredient name and quantity cannot be empty!', false);
        return;
    }

    const addIngredientResult = await ipcRenderer.invoke('add-ingredient-to-recipe', { recipeName, ingredientName, ingredientQuantity });

    if (addIngredientResult === 'success') {
        messageBoxUpdate(messageBoxDiv,'Ingredient added to recipe!', true);
        clearSuggestedIngredientRow();
        recipeNutritionalValue = await ipcRenderer.invoke('read-recipe-file', recipeName);
        renderRecipeTable();
    } 
    else if (addIngredientResult === 'ingredient-already-in-recipe') {
        messageBoxUpdate(messageBoxDiv,'Ingredient is already present in the recipe!', false);
    }
    else if (addIngredientResult === 'failure') {
        messageBoxUpdate(messageBoxDiv,'Failed to add ingredient to recipe!', false);
    }
});
