const { ipcRenderer } = require('electron');

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
const ingredientDetails = {
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

let currentFocus = -1;
let unitWeight = 0;
let ingredientData = {};

// Request ingredient names for autocompletion
ingredientNameInput.addEventListener('focus', function () {
    ipcRenderer.send('get-ingredient-names');
});

// Request recipe names for autocompletion
recipeNameInput.addEventListener('focus', function () {
    ipcRenderer.send('get-recipe-names');
});

recipeNameInput.addEventListener('input', function () {
    const recipeName = recipeNameInput.value.trim();
    if (recipeName) {
        ipcRenderer.send('read-recipe-file', recipeName);
    } else {
        // Empty the dynamic table if the recipe name is empty
        dynamicTable.innerHTML = '';
    }
});

ipcRenderer.on('ingredient-names-response', (event, fileNames) => {
    ingredientNameInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = fileNames.filter(name => name.toLowerCase().includes(input));
        showSuggestions(suggestions, suggestionBox, ingredientNameInput);
    });
});

ipcRenderer.on('recipe-names-response', (event, fileNames) => {
    recipeNameInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = fileNames.filter(name => name.toLowerCase().includes(input));
        showSuggestions(suggestions, suggestionBoxRecipe, recipeNameInput);
    });
});

function showSuggestions(suggestions, suggestionBox, inputElement) {
    suggestionBox.innerHTML = '';
    currentFocus = -1;
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.style.padding = '8px';
        div.style.cursor = 'pointer';
        div.addEventListener('click', function () {
            inputElement.value = suggestion;
            suggestionBox.innerHTML = '';
            if (inputElement === recipeNameInput) {
                // Request recipe file content
                ipcRenderer.send('read-recipe-file', suggestion);
            } else if (inputElement === ingredientNameInput) {
                // Reset quantity inputs
                quantityGramsInput.value = 0;
                quantityUnitInput.value = 0;
                // Request ingredient file content
                ipcRenderer.send('read-ingredient-file', suggestion);
                ipcRenderer.once('read-ingredient-file-response', (event, data) => {
                    if (data) {
                        ingredientData = data;
                        if (data.unitName) {
                            unitNameSpan.textContent = data.unitName;
                            unitAlternativeSpan.style.display = 'inline';
                            unitNameSpan.style.color = '#ff5e00';
                            unitWeight = data.unitWeight;
                        } else {
                            unitAlternativeSpan.style.display = 'none';
                            unitWeight = 0;
                        }
                        updateIngredientDetails();
                    }
                });
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

ipcRenderer.on('read-recipe-file-response', async (event, data) => {
    if (data) {
        // Hide the suggestion box if the recipe exists
        suggestionBoxRecipe.innerHTML = '';

        preparationBox.value = data.preparation || '';
        const ingredientsArray = data.ingredientsArray || [];
        const quantitiesArray = data.quantitiesArray || [];

        // Clear existing rows
        dynamicTable.innerHTML = '';

        for (let i = 0; i < ingredientsArray.length; i++) {
            const ingredientName = ingredientsArray[i];
            const quantityGrams = quantitiesArray[i];

            // Request ingredient file content
            const ingredientData = await getIngredientData(ingredientName);

            // Create a new row for the ingredient
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${ingredientName}</td>
                <td>
                    <input type="number" value="${quantityGrams}" class="numberInput" step="0.1"> g
                    ${ingredientData.unitWeight ? `
                    <div style="display: inline;">
                        ||
                        <input class="numberInput" type="number" value="${(quantityGrams / ingredientData.unitWeight).toFixed(2)}" placeholder="[0,∞]" min="0" step="0.01" oninput="validity.valid||(value='');"> 
                        of 
                        <span>${ingredientData.unitName}</span>
                    </div>` : ''}
                </td>
                <td class="center">${ingredientData.type}</td>
                <td class="center">${(ingredientData.kcal * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.protein * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.fiber * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.fat * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.saturated * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.carb * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.sugar * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.salt * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.chol * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.cost * quantityGrams / 100).toFixed(2)}</td>
                <td><button class="removeIngredient">-</button></td>
            `;
            dynamicTable.appendChild(newRow);

            // Add event listener to the remove button
            newRow.querySelector('.removeIngredient').addEventListener('click', function() {
                newRow.remove();
            });
        }
    } else {
        // Show the suggestion box if the recipe does not exist
        suggestionBoxRecipe.style.display = 'block';
        dynamicTable.innerHTML = '';
    }
});

function getIngredientData(ingredientName) {
    return new Promise((resolve, reject) => {
        ipcRenderer.once('read-ingredient-file-response', (event, data) => {
            if (data) {
                resolve(data);
            } else {
                reject('Failed to read ingredient file');
            }
        });
        ipcRenderer.send('read-ingredient-file', ingredientName);
    });
}

quantityGramsInput.addEventListener('input', function () {
    if (unitWeight > 0) {
        const grams = parseFloat(this.value);
        if (!isNaN(grams)) {
            const units = grams / unitWeight;
            quantityUnitInput.value = units.toFixed(1);
        } else {
            quantityUnitInput.value = '';
        }
    }
    updateIngredientDetails();
});

quantityUnitInput.addEventListener('input', function () {
    if (unitWeight > 0) {
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
    if (!isNaN(grams) && ingredientData) {
        ingredientDetails.type.textContent = ingredientData.type || '';
        ingredientDetails.kcal.textContent = ingredientData.kcal ? `${(ingredientData.kcal * grams / 100).toFixed(0)}` : '';
        ingredientDetails.protein.textContent = ingredientData.protein ? `${(ingredientData.protein * grams / 100).toFixed(1)}` : '';
        ingredientDetails.fiber.textContent = ingredientData.fiber ? `${(ingredientData.fiber * grams / 100).toFixed(1)}` : '';
        ingredientDetails.fat.textContent = ingredientData.fat ? `${(ingredientData.fat * grams / 100).toFixed(1)}` : '';
        ingredientDetails.saturated.textContent = ingredientData.saturated ? `${(ingredientData.saturated * grams / 100).toFixed(1)}` : '';
        ingredientDetails.carb.textContent = ingredientData.carb ? `${(ingredientData.carb * grams / 100).toFixed(1)}` : '';
        ingredientDetails.sugar.textContent = ingredientData.sugar ? `${(ingredientData.sugar * grams / 100).toFixed(1)}` : '';
        ingredientDetails.salt.textContent = ingredientData.salt ? `${(ingredientData.salt * grams / 100).toFixed(2)}` : '';
        ingredientDetails.chol.textContent = ingredientData.chol ? `${(ingredientData.chol * grams / 100).toFixed(0)}` : '';
        if (unitWeight > 0 && !isNaN(parseFloat(quantityUnitInput.value))) {
            const units = parseFloat(quantityUnitInput.value);
            ingredientDetails.cost.textContent = ingredientData.cost ? `${(ingredientData.cost * units).toFixed(2)}` : '';
        } else {
            ingredientDetails.cost.textContent = ingredientData.cost ? `${(ingredientData.cost * grams / 100).toFixed(2)}` : '';
        }
    }
}

document.getElementById('addIngredientButton').addEventListener('click', async function () {
    const ingredientName = ingredientNameInput.value.trim();
    const quantity = parseFloat(quantityGramsInput.value);
    const recipeName = recipeNameInput.value.trim();
    const preparationText = preparationBox.value.trim();
    
    // Empty recipe name
    if (recipeName === '') {
        messageBoxDiv.textContent = 'Recipe name cannot be empty!';
        messageBoxDiv.style.color = 'red';
        return;
    }
    // Empty ingredient name or invalid quantity
    else if (ingredientName === '' || isNaN(quantity) || quantity <= 0) {
        messageBoxDiv.textContent = 'Ingredient name and quantity cannot be empty!';
        messageBoxDiv.style.color = 'red';
        return;
    }

    // Add the ingredient to the recipe
    // This will check if the ingredient is already in the recipe
    ipcRenderer.send('add-ingredient-to-recipe', { recipeName, preparationText, ingredientName, quantity });
    

    let ingredientAdded = false;

    await new Promise((resolve) => {
        ipcRenderer.once('add-ingredient-to-recipe-response', (response, message) => {
            if (message === 'success') {
                console.log('Ingredient added to recipe.');
                ingredientAdded = true;
            } 
            if (message === 'Ingredient already exists') {
                messageBoxDiv.textContent = 'Ingredient is already present in the recipe!';
                messageBoxDiv.style.color = 'red';
            }
            else if (message === 'failure') {
                messageBoxDiv.textContent = 'Failed to add ingredient to recipe!';
                messageBoxDiv.style.color = 'red';
            }
            resolve('resolved');
        });
    });


    if (ingredientAdded) {
        ingredientNameInput.value = '';
        quantityGramsInput.value = '';
        quantityUnitInput.value = '';
        unitNameSpan.textContent = '';
        unitAlternativeSpan.style.display = 'none';
        ingredientDetails.type.textContent = '';
        ingredientDetails.kcal.textContent = '';
        ingredientDetails.protein.textContent = '';
        ingredientDetails.fiber.textContent = '';
        ingredientDetails.fat.textContent = '';
        ingredientDetails.saturated.textContent = '';
        ingredientDetails.carb.textContent = '';
        ingredientDetails.sugar.textContent = '';
        ingredientDetails.salt.textContent = '';
        ingredientDetails.chol.textContent = '';
        ingredientDetails.cost.textContent = '';

        ipcRenderer.send('read-recipe-file', recipeName);
    }
});

