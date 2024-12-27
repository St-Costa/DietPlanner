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

ipcRenderer.on('ingredient-names-response', (event, fileNames) => {
    ingredientNameInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = fileNames.filter(name => name.toLowerCase().includes(input));
        showSuggestions(suggestions, suggestionBox, ingredientNameInput);
    });

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
});

ipcRenderer.on('recipe-names-response', (event, fileNames) => {
    recipeNameInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = fileNames.filter(name => name.toLowerCase().includes(input));
        showSuggestions(suggestions, suggestionBoxRecipe, recipeNameInput);
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


ipcRenderer.on('read-recipe-file-response', async (event, data) => {
    if (data) {
        // Fill the preparation textbox
        preparationBox.value = data.preparation;

        // Clear existing rows in the ingredient table
        dynamicTable.innerHTML = '';

        // Populate the ingredient table
        for (let i = 0; i < data.ingredientsArray.length; i++) {
            const ingredientName = data.ingredientsArray[i];
            const quantity = data.quantitiesArray[i];

            console.log(ingredientName);
            ipcRenderer.send('read-ingredient-file', ingredientName);

            // Request ingredient file content
            let ingredientType = "";
            let ingredientKcal = "";
            let ingredientProtein = "";
            let ingredientFiber = "";
            let ingredientFat = "";
            let ingredientSaturated = "";
            let ingredientCarb = "";
            let ingredientSugar = "";
            let ingredientSalt = "";
            let ingredientChol = "";
            let ingredientCost = "";
            let ingredientUnitWeight = "";
            let ingredientUnitName = "";

            await new Promise((resolve) => {
                ipcRenderer.once('read-ingredient-file-response', (event, ingredientFileData) => {
                    // Handle the ingredientFileData here
                    ingredientType = ingredientFileData.type;
                    ingredientKcal = ingredientFileData.kcal;
                    ingredientProtein = ingredientFileData.protein;
                    ingredientFiber = ingredientFileData.fiber;
                    ingredientFat = ingredientFileData.fat;
                    ingredientSaturated = ingredientFileData.saturated;
                    ingredientCarb = ingredientFileData.carb;
                    ingredientSugar = ingredientFileData.sugar;
                    ingredientSalt = ingredientFileData.salt;
                    ingredientChol = ingredientFileData.chol;
                    ingredientCost = ingredientFileData.cost;
                    ingredientUnitWeight = ingredientFileData.unitWeight;
                    ingredientUnitName = ingredientFileData.unitName;
                    resolve();
                });
            });

            // If there is a unit, calculate the quantity in that unit
            let quantityUnitString = "";
            if(ingredientUnitWeight !== ""){
                quantityUnitString = `
                    <div style="display: inline;">
                        ||
                        <input class="numberInput" type="number" value="${quantity / ingredientUnitWeight}" placeholder="[0,∞]" min="0" step="0.01" oninput="validity.valid||(value='');"> 
                        of 
                        <span style="display: inline; color: #ff5e00;">${ingredientUnitName}</span>
                    </div>
                </td>
                `;
            }
            else{
                quantityUnitString = `</td>`;
            }

            // Compute correctly the cost based on unit or grams
            let costString = "";
            if (ingredientUnitWeight !== "") {
                const units = quantity / ingredientUnitWeight;
                costString = (ingredientCost * units).toFixed(2);
            } else {
                costString = (ingredientCost * quantity / 100).toFixed(2);
            }
            costString = String(costString);


            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${ingredientName}</td>
                <td>
                    <input type="number" value="${quantity}" class="numberInput" step="0.1"> g
                ${quantityUnitString}
                <td class="center">${ingredientType}</td>
                <td class="center">${(ingredientKcal*quantity / 100).toFixed(0)}</td>
                <td class="center">${(ingredientProtein*quantity / 100).toFixed(1)}</td>
                <td class="center">${(ingredientFiber*quantity / 100).toFixed(1)}</td>
                <td class="center">${(ingredientFat*quantity / 100).toFixed(1)}</td>
                <td class="center">${(ingredientSaturated*quantity / 100).toFixed(1)}</td>
                <td class="center">${(ingredientCarb*quantity / 100).toFixed(1)}</td>
                <td class="center">${(ingredientSugar*quantity / 100).toFixed(1)}</td>
                <td class="center">${(ingredientSalt*quantity / 100).toFixed(2)}</td>
                <td class="center">${(ingredientChol*quantity / 100).toFixed(0)}</td>
                <td class="center">${costString}</td>
                <td class="center"><button id="deleteButton" class="deleteButton">-</button></td>
            `;
            dynamicTable.appendChild(newRow);

            // Add event listener to the delete button
            newRow.querySelector('#deleteButton').addEventListener('click', function() {
                newRow.remove();
            });
        }
    }
});

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
    // Ingredient is already in the recipe
    ipcRenderer.send('read-recipe-file', recipeName);
    await new Promise((resolve) => {
        ipcRenderer.once('read-recipe-file-response', (event, data) => {
            if (data && data.ingredientsArray.includes(ingredientName)) {
                messageBoxDiv.textContent = 'Ingredient is already present in the recipe!';
                messageBoxDiv.style.color = 'red';
                return;
            }
            resolve();
        });
    });

    // Add the ingredient to the recipe
    ipcRenderer.send('add-ingredient-to-recipe', { recipeName, preparationText, ingredientName, quantity });
    

    await new Promise((resolve) => {
        ipcRenderer.once('add-ingredient-to-recipe-response', (response, message) => {
            if (message === 'success') {
                console.log('Ingredient added to recipe.');
            } 
            else if (message === 'failure') {
                messageBoxDiv.textContent = 'Failed to add ingredient to recipe!';
                messageBoxDiv.style.color = 'red';
            }
            resolve('resolved');
        });
    });


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
});

