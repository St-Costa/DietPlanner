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

// Save temp preparation text
let preparationTextBeforeModification = "";

preparationBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const recipeName = recipeNameInput.value.trim();
        if (recipeName === '') {
            messageBoxUpdate('Recipe name cannot be empty!', false);
            return;
        }
        const preparationText = preparationBox.value.trim();
        
        ipcRenderer.send('update-recipe-preparation', { recipeName, preparationText });
        ipcRenderer.once('update-recipe-preparation-response', (response, message) => {
            if (message === 'success') {
                messageBoxUpdate('Preparation updated!', true);
            } 
            else {
                messageBoxUpdate('Failed to update preparation!', false);
            }
        });
        preparationTextBeforeModification = preparationBox.value;
    }
});

preparationBox.addEventListener('blur', function () {
    preparationBox.value = preparationTextBeforeModification;
});


ipcRenderer.on('read-recipe-file-response', async (event, data) => {
    if (data) {
        // Hide the suggestion box if the recipe exists
        suggestionBoxRecipe.innerHTML = '';

        preparationBox.value = data.preparation || '';

        //Update preparation default text for local modifications
        preparationTextBeforeModification = data.preparation || '';

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
                <td class="center">${(ingredientData.kcal * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.protein * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.fiber * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.fat * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.saturated * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.carb * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.sugar * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.salt * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${(ingredientData.chol * quantityGrams / 100).toFixed(2)}</td>
                <td class="center">${ingredientData.unitWeight ? (ingredientData.cost * (quantityGrams / ingredientData.unitWeight)).toFixed(2) : (ingredientData.cost * quantityGrams / 100).toFixed(2)}</td>
                <td><button class="removeIngredient">x</button></td>
            `;
            dynamicTable.appendChild(newRow);

            // Add a local variable to remember the value of the quantity before the modification
            let gramsBeforeModification = quantityGrams;

            // Add event listener to the remove button
            newRow.querySelector('.removeIngredient').addEventListener('click', function() {
                newRow.remove();
                readIngredientsFromTableAndUpdateRecipe();
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
                    readIngredientsFromTableAndUpdateRecipe();

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
                        readIngredientsFromTableAndUpdateRecipe();

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
    } else {
        // Show the suggestion box if the recipe does not exist
        suggestionBoxRecipe.style.display = 'block';
        dynamicTable.innerHTML = '';
    }
});

// Read table, update the recipe file, update the shown table
async function readIngredientsFromTableAndUpdateRecipe() {
    const rows = dynamicTable.getElementsByTagName('tr');
    const ingredientsArray = [];
    const quantitiesArray = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const ingredientName = cells[0].textContent;
        const quantityGrams = parseFloat(cells[1].getElementsByTagName('input')[0].value);

        ingredientsArray.push(ingredientName);
        quantitiesArray.push(quantityGrams);
    }

    const recipeName = recipeNameInput.value.trim();
    ipcRenderer.send('update-recipe-ingredients', { recipeName, ingredientsArray, quantitiesArray });

    await new Promise((resolve) => {
        ipcRenderer.once('update-recipe-ingredients-response', (response, message) => {
            if (message === 'success') {
                messageBoxUpdate('Recipe updated!', true);
            } 
            else if (message === 'failure') {
                messageBoxUpdate('Failed to update recipe!', false);
            }
            resolve('resolved');
        });
    });

    ipcRenderer.send('read-recipe-file', recipeName);
}


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
        messageBoxUpdate('Recipe name cannot be empty!', false);
        return;
    }
    // Empty ingredient name or invalid quantity
    else if (ingredientName === '' || isNaN(quantity) || quantity <= 0) {
        messageBoxUpdate('Ingredient name and quantity cannot be empty!', false);
        return;
    }

    // Add the ingredient to the recipe
    // This will check if the ingredient is already in the recipe
    ipcRenderer.send('add-ingredient-to-recipe', { recipeName, preparationText, ingredientName, quantity });
    

    let ingredientAdded = false;

    await new Promise((resolve) => {
        ipcRenderer.once('add-ingredient-to-recipe-response', (response, message) => {
            if (message === 'success') {
                ingredientAdded = true;
                messageBoxUpdate('Ingredient added to recipe!', true);
            } 
            if (message === 'Ingredient already exists') {
                messageBoxUpdate('Ingredient is already present in the recipe!', false);
            }
            else if (message === 'failure') {
                messageBoxUpdate('Failed to add ingredient to recipe!', false);
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


function messageBoxUpdate(messageText, messageBool){
    let boxColor = ""
    
    if(messageBool){
        boxColor = "#8cff69";
    }
    else if (!messageBool){
        boxColor = "#ff2b2b";
    }

    messageBoxDiv.style.color = boxColor;
    messageBoxDiv.textContent = messageText;
    messageBoxDiv.style.border = '1px solid ' + boxColor;
    messageBoxDiv.style.fontWeight = 'bold';
    
    setTimeout(function(){
        messageBoxDiv.textContent = '';
        messageBoxDiv.style.color = "";
        messageBoxDiv.style.border = '1px none';
    }, 3000);
}
