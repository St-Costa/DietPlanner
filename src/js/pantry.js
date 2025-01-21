const { ipcRenderer }                           = require('electron');
const { messageBoxUpdate }                      = require('./messageBoxUpdate');
const { showSuggestions, navigateSuggestions }  = require('./suggestions');
const { errorHandling }                         = require('./messageBoxUpdate');

// messageBox for errors
const messageBoxDiv         = document.getElementById('messageBox');
let deactivateMessage       = false;

// Ingredient input field
const ingredientNameInput   = document.getElementById('ingredientName');
const suggestionBox         = document.getElementById('suggestionBox');
const unitNameSpan          = document.getElementById('unitName');
const unitAlternativeSpan   = document.getElementById('unitAlternative');
const quantityGramsInput    = document.getElementById('quantityGrams');
const quantityUnitInput     = document.getElementById('quantityUnit');
const addIngredientButton   = document.getElementById('addIngredientButton');

// Dynamic table of ingredients
const dynamicTable          = document.getElementById('dynamicTable');
const tdQuantityInput       = document.getElementById('tdQuantityInput');

// Local variables
let pantryLocal = {};

// On load render table
document.addEventListener('DOMContentLoaded', async () => {
    renderPantryTable();
});

// Errors
ipcRenderer.on('main-error', (event, errMsg) => {
    if (!deactivateMessage) {
        errorHandling(messageBoxDiv, false, errMsg);
    }
});
// Success
ipcRenderer.on('main-success', (event, errMsg) => {
    errorHandling(messageBoxDiv, true, errMsg);
});

// Refresh pantry table
ipcRenderer.on('refresh', async () => {
    clearSuggestedIngredientRow();
    renderPantryTable();
});


// INGREDIENT NAME AUTOCOMPLETE
ingredientNameInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('ingredient', suggestionBox, this, thisWindowId);
});
ingredientNameInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('ingredient', suggestionBox, this, thisWindowId);
});
ingredientNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox);
});

ipcRenderer.on('suggested-ingredient-clicked', async (event, ingredientData) => {
    // Reset quantity inputs
    quantityGramsInput.value    = 0;
    quantityUnitInput.value     = 0;

    // Request ingredient file content
    ingredientToAdd_details     = ingredientData;
    if (ingredientToAdd_details) {
        tdQuantityInput.style.display           = 'table-cell';
        addIngredientButton.style.display       = 'inline';
        if (ingredientToAdd_details.unitName) {
            unitNameSpan.textContent            = ingredientToAdd_details.unitName;
            unitAlternativeSpan.style.display   = 'inline';
            unitWeight                          = ingredientToAdd_details.unitWeight;
        } else {
            unitAlternativeSpan.style.display   = 'none';
            unitWeight                          = 0;
        }
    }
    else{
        clearSuggestedIngredientRow();
    }
});



// Update ingredient to add with nutritional values
quantityGramsInput.addEventListener('input', function () {
    const unitWeight                = ingredientToAdd_details.unitWeight || 0;
    if (unitWeight > 0) {
        const grams = parseFloat(this.value);
        if (!isNaN(grams)) {
            const units             = grams / unitWeight;
            quantityUnitInput.value = units.toFixed(2);
        } else {
            quantityUnitInput.value = '';
        }
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

// Add ingredient to pantry
document.getElementById('addIngredientButton').addEventListener('click', async function () {
    const ingredientName        = ingredientNameInput.value.trim();
    const ingredientQuantity    = parseFloat(quantityGramsInput.value);

    // Validate input
    if (ingredientName === '' || isNaN(ingredientQuantity) || ingredientQuantity <= 0) {
        messageBoxUpdate(messageBoxDiv,'Ingredient name and quantity cannot be empty!', false);
        return;
    }

    ipcRenderer.send('add-ingredient-to-pantry', { ingredientName, ingredientQuantity });
});



async function renderPantryTable () {
    // Clear existing rows
    dynamicTable.innerHTML = '';

    // Read pantry file
    let pantry = {};
    try{
        pantry = await ipcRenderer.invoke('read-pantry-file');
        pantryLocal = pantry;
    }
    catch(err){
        console.error(err);
        return;
    }


    // Render ingredients
    for (const ingredient of pantry.ingredientsArray) {
        const quantityGrams = pantry.quantitiesArray[pantry.ingredientsArray.indexOf(ingredient)];
        try{
            // Deactivate message because in case of error, it will be shown in the table row
            deactivateMessage = true;
            
            const ingredientData = await ipcRenderer.invoke('read-ingredient-file', ingredient);
            await renderTableRow(ingredientData, quantityGrams);

            deactivateMessage = false;
        }
        catch(err){
            deactivateMessage = false;

            console.error(err);
            const ingredientNoDetails = {name: ingredient};
            await renderTableRow(ingredientNoDetails, quantityGrams);
        }
    }
}

async function renderTableRow(ingredientData, quantityGrams){
    // Create new row
    const newRow = document.createElement('tr');
    newRow.classList.add('ingredient-row'); // to distinguish from the sum row

    // If ingredient file is not found, display warning
    let warningMissingIngredient = '';
    if(!deactivateMessage) {
        warningMissingIngredient = `
                                    <div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>
                                        ⚠
                                    </div>`;
    }

    // Add row to table
    newRow.innerHTML = `
        <td>${ingredientData.name} ${warningMissingIngredient}</td>
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

    // Add event listener to the remove button
    newRow.querySelector('.removeIngredient').addEventListener('click', function() {
        // Delete ingredient and quantity from local pantry
        const index = pantryLocal.ingredientsArray.indexOf(ingredientData.name);
        if (index > -1) {
            pantryLocal.ingredientsArray.splice(index, 1);
            pantryLocal.quantitiesArray.splice(index, 1);
        }

        // Update pantry file
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
                } 
                else {
                    pantryLocal.quantitiesArray[pantryLocal.ingredientsArray.indexOf(ingredientData.name)] = grams;
                    updatePantry();
                }
            }
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
                    if (grams === 0) {
                        newRow.querySelector('.removeIngredient').click();
                    } 
                    else {
                        pantryLocal.quantitiesArray[pantryLocal.ingredientsArray.indexOf(ingredientData.name)] = grams;
                        updatePantry();
                    }
                }
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
        this.value = quantityGrams.toFixed(0);
        const unitInput = newRow.querySelector('#unitInput');
        if (unitInput) {
            unitInput.value = (quantityGrams / ingredientData.unitWeight).toFixed(2);
        }             
    });
    // When modify units without updating the recipe, revert to the original value
    if (unitInputField) {
        unitInputField.addEventListener('blur', function() {
            this.value = (quantityGrams / ingredientData.unitWeight).toFixed(2);
            newRow.querySelector('#gramsInput').value = quantityGrams.toFixed(0);
        });
    }
}



async function updatePantry() {
    ipcRenderer.send('update-pantry', pantryLocal);
}

function clearSuggestedIngredientRow() {
    ingredientNameInput.value           = '';
    tdQuantityInput.style.display       = 'none';
    unitAlternativeSpan.style.display   = 'none';
    addIngredientButton.style.display   = 'none';
    addIngredientButton.className       = 'deleteAddButton';
    unitWeight                          = 0;
}