const { ipcRenderer } = require('electron');
const { messageBoxUpdate } = require('./messageBoxUpdate');

const ingredientNameInput = document.getElementById('ingredientName');
const suggestionBox = document.getElementById('suggestionBox');
const unitNameSpan = document.getElementById('unitName');
const messageBoxDiv = document.getElementById('messageBox');
const unitAlternativeSpan = document.getElementById('unitAlternative');
const quantityGramsInput = document.getElementById('quantityGrams');
const quantityUnitInput = document.getElementById('quantityUnit');
const dynamicTable = document.getElementById('dynamicTable');
const addIngredientButton = document.getElementById('addIngredientButton');
const tdQuantityInput = document.getElementById('tdQuantityInput');





// INGREDIENT NAME AUTOCOMPLETE
ingredientNameInput.addEventListener('focus', async function () {
    let ingredientsNameList = await ipcRenderer.invoke('get-ingredient-names');
    const input = this.value.toLowerCase();
    const suggestions = ingredientsNameList.filter(name => name.toLowerCase().includes(input));
    
    showSuggestions(suggestions, suggestionBox, ingredientNameInput);
});
ingredientNameInput.addEventListener('input', async function () {
    let ingredientsNameList = await ipcRenderer.invoke('get-ingredient-names');
    const input = this.value.toLowerCase();
    const suggestions = ingredientsNameList.filter(name => name.toLowerCase().includes(input));
    console.log(suggestions);
    showSuggestions(suggestions, suggestionBox, ingredientNameInput);
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
            }
            else{
                clearSuggestedIngredientRow();
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

function clearSuggestedIngredientRow() {
    ingredientNameInput.value = '';
    tdQuantityInput.style.display = 'none';
    unitAlternativeSpan.style.display = 'none';
    addIngredientButton.style.display = 'none';
    addIngredientButton.className = 'deleteAddButton';
    unitWeight = 0;
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
});

document.getElementById('addIngredientButton').addEventListener('click', async function () {
    const ingredientName = ingredientNameInput.value.trim();
    const ingredientQuantity = parseFloat(quantityGramsInput.value);

    
    if (ingredientName === '' || isNaN(ingredientQuantity) || ingredientQuantity <= 0) {
        messageBoxUpdate(messageBoxDiv,'Ingredient name and quantity cannot be empty!', false);
        return;
    }

    const addIngredientResult = await ipcRenderer.invoke('add-ingredient-to-pantry', { ingredientName, ingredientQuantity });

    if (addIngredientResult === 'success') {
        messageBoxUpdate(messageBoxDiv,'Ingredient added to pantry!', true);
        clearSuggestedIngredientRow();
        renderPantryTable();
    } 
    else if (addIngredientResult === 'ingredient-already-in-pantry') {
        messageBoxUpdate(messageBoxDiv,'Ingredient is already present in the pantry!', false);
    }
    else if (addIngredientResult === 'file-creation-failure') {
        messageBoxUpdate(messageBoxDiv,'Failed to create the pantry file!', false);
    }
    else if (addIngredientResult === 'failure') {
        messageBoxUpdate(messageBoxDiv,'Failed to add ingredient to pantry!', false);
    }
});



async function renderPantryTable () {
    // Read pantry file
    const pantry = await ipcRenderer.invoke('read-pantry-file');
    if(pantry === 'failure'){
        messageBoxUpdate(messageBoxDiv,'Failed to read pantry file!', false);
    }
    else if (pantry === 'file-not-found') {
        return;
    }
    else{
        const ingredientsArray = pantry.ingredientsArray || [];
        const quantitiesArray = pantry.quantitiesArray || [];

        // Clear existing rows
        dynamicTable.innerHTML = '';

        for (let i = 0; i < ingredientsArray.length; i++) {
            const ingredientName = ingredientsArray[i];
            const quantityGrams = quantitiesArray[i];

            // Request ingredient file content
            const ingredientData = await ipcRenderer.invoke('read-ingredient-file', ingredientName);

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
                <td><button class="removeIngredient deleteAddButton">x</button></td>
            `;
            dynamicTable.appendChild(newRow);

            // Add a local variable to remember the value of the quantity before the modification
            let gramsBeforeModification = quantityGrams;

            // Add event listener to the remove button
            newRow.querySelector('.removeIngredient').addEventListener('click', function() {
                newRow.remove();
                updatePantry();
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
                        if (grams === 0) {
                            newRow.querySelector('.removeIngredient').click();
                            return;
                        } else {
                            const units = grams / ingredientData.unitWeight;
                            const unitInput = newRow.querySelector('#unitInput');
                            if (unitInput) {
                                unitInput.value = units.toFixed(2);
                            }
                        }
                    }
                    updatePantry();

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
                            if (grams === 0) {
                                newRow.querySelector('.removeIngredient').click();
                                return;
                            }
                        }
                        updatePantry();

                        // Update the originalGrams variable with the new value
                        gramsBeforeModification = parseFloat(newRow.querySelector('#gramsInput').value);
                    }
                });
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
                }
            });
            const unitInputField = newRow.querySelector('#unitInput');
            if (unitInputField) {
                unitInputField.addEventListener('input', function() {
                    const units = parseFloat(this.value);
                    if (!isNaN(units)) {
                        const grams = units * ingredientData.unitWeight;
                        newRow.querySelector('#gramsInput').value = grams.toFixed(0);
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
            });
            // When modify units without updating the recipe, revert to the original value
            if (unitInputField) {
                unitInputField.addEventListener('blur', function() {
                    this.value = (gramsBeforeModification / ingredientData.unitWeight).toFixed(2);
                    newRow.querySelector('#gramsInput').value = gramsBeforeModification.toFixed(0);
                });
            }
        }
    }
}

// On load render table
document.addEventListener('DOMContentLoaded', async () => {
    renderPantryTable();
});

async function updatePantry() {
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

    const updatedPantry = { ingredientsArray, quantitiesArray };

    // Update or create recipe file
    let resultOfUpdate = await ipcRenderer.invoke('update-pantry', updatedPantry);

    switch (resultOfUpdate) {
        case 'file-updated':
            messageBoxUpdate(messageBoxDiv,'Pantry updated!', true);
            renderPantryTable();
            break;

        case 'file-update-failure':
            messageBoxUpdate(messageBoxDiv,'Failed to update pantry!', false);
            break;
        
        case 'failure':
            messageBoxUpdate(messageBoxDiv,'Failed!', false);
            break;
    }
}
