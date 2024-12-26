const { ipcRenderer } = require('electron');

const addIngredientBtn = document.getElementById('addIngredient');

const ingredientNameInput = document.getElementById('ingredientName');
const ingredientTypeInput = document.getElementById('ingredientType');
const ingredientKcalInput = document.getElementById('ingredientKcal');
const ingredientProteinInput = document.getElementById('ingredientProtein');
const ingredientFiberInput = document.getElementById('ingredientFiber');
const ingredientFatInput = document.getElementById('ingredientFat');
const ingredientSaturatedInput = document.getElementById('ingredientSaturated');
const ingredientCarbInput = document.getElementById('ingredientCarb');
const ingredientSugarInput = document.getElementById('ingredientSugar');
const ingredientSaltInput = document.getElementById('ingredientSalt');
const ingredientCholInput = document.getElementById('ingredientChol');
const ingredientCostInput = document.getElementById('ingredientCost');
const ingredientUnitWeightInput = document.getElementById('ingredientUnitWeight');
const ingredientUnitNameInput = document.getElementById('ingredientUnitName');

const suggestionBox_name = document.getElementById('suggestionBox_name');
const suggestionBox_type = document.getElementById('suggestionBox_type');

const div_resultOfCall = document.getElementById('resultOfClick');

let isUpdateMode = false;
let currentFocus = -1;

// Function to check if all inputs are filled
function checkInputs() {
    if (ingredientNameInput.value.trim() !== '' &&
        ingredientTypeInput.value.trim() !== '' &&
        ingredientKcalInput.value.trim() !== '' &&
        ingredientProteinInput.value.trim() !== '' &&
        ingredientFiberInput.value.trim() !== '' &&
        ingredientFatInput.value.trim() !== '' &&
        ingredientSaturatedInput.value.trim() !== '' &&
        ingredientCarbInput.value.trim() !== '' &&
        ingredientSugarInput.value.trim() !== '' &&
        ingredientSaltInput.value.trim() !== '' &&
        ingredientCholInput.value.trim() !== '' &&
        ingredientCostInput.value.trim() !== ''
        ) {
        addIngredientBtn.disabled = false;
        addIngredientBtn.textContent = isUpdateMode ? 'Update ingredient' : 'Add ingredient';
    } else {
        addIngredientBtn.disabled = true;
        addIngredientBtn.textContent = 'Empty inputs';
    }
}

// Add event listeners to inputs
ingredientNameInput.addEventListener('input', checkInputs);
ingredientTypeInput.addEventListener('input', checkInputs);
ingredientKcalInput.addEventListener('input', checkInputs);
ingredientProteinInput.addEventListener('input', checkInputs);
ingredientFiberInput.addEventListener('input', checkInputs);
ingredientFatInput.addEventListener('input', checkInputs);
ingredientSaturatedInput.addEventListener('input', checkInputs);
ingredientCarbInput.addEventListener('input', checkInputs);
ingredientSugarInput.addEventListener('input', checkInputs);
ingredientSaltInput.addEventListener('input', checkInputs);
ingredientCholInput.addEventListener('input', checkInputs);
ingredientCostInput.addEventListener('input', checkInputs);
ingredientUnitWeightInput.addEventListener('input', checkInputs);
ingredientUnitNameInput.addEventListener('input', checkInputs);

// Hide suggestion box when other inputs gain focus
const allInputs = [
    ingredientTypeInput, ingredientKcalInput, ingredientProteinInput, ingredientFiberInput,
    ingredientFatInput, ingredientSaturatedInput, ingredientCarbInput,
    ingredientSugarInput, ingredientSaltInput, ingredientCholInput,
    ingredientCostInput, ingredientUnitWeightInput, ingredientUnitNameInput
];

allInputs.forEach(input => {
    input.addEventListener('focus', () => {
        suggestionBox_name.innerHTML = '';
        suggestionBox_type.innerHTML = '';
    });
});

// Request ingredient names for autocompletion
ingredientNameInput.addEventListener('focus', function () {
    ipcRenderer.send('get-ingredient-names');
});

// Request ingredient types for autocompletion
ingredientTypeInput.addEventListener('focus', function () {
    ipcRenderer.send('get-ingredient-types');
});

ipcRenderer.on('ingredient-names-response', (event, fileNames) => {
    // Implement autocompletion for ingredient names
    ingredientNameInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = fileNames.filter(name => name.toLowerCase().includes(input));
        showSuggestions(suggestions, suggestionBox_name, ingredientNameInput);
    });

    ingredientNameInput.addEventListener('keydown', function (e) {
        const suggestionItems = suggestionBox_name.getElementsByTagName('div');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(suggestionItems, suggestionBox_name);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(suggestionItems, suggestionBox_name);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                if (suggestionItems) suggestionItems[currentFocus].click();
            }
        }
    });
});

ipcRenderer.on('ingredient-types-response', (event, types) => {
    // Implement autocompletion for ingredient types
    ingredientTypeInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = types.filter(type => type.toLowerCase().includes(input));
        showSuggestions(suggestions, suggestionBox_type, ingredientTypeInput);
    });

    ingredientTypeInput.addEventListener('keydown', function (e) {
        const suggestionItems = suggestionBox_type.getElementsByTagName('div');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(suggestionItems, suggestionBox_type);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(suggestionItems, suggestionBox_type);
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
        div.addEventListener('click', function () {
            inputElement.value = suggestion;
            suggestionBox.innerHTML = '';
            checkInputs(); // Check inputs after selecting a suggestion
            if (inputElement === ingredientNameInput) {
                // Request file content
                ipcRenderer.send('read-ingredient-file', suggestion);
                isUpdateMode = true;
                addIngredientBtn.textContent = 'Update ingredient';
                ingredientNameInput.disabled = true;
            }
        });
        suggestionBox.appendChild(div);
    });
}

function addActive(items, suggestionBox) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add('autocomplete-active');
    adjustScroll(items[currentFocus], suggestionBox);
}

function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('autocomplete-active');
    }
}

function adjustScroll(activeItem, suggestionBox) {
    const itemOffsetTop = activeItem.offsetTop;
    const itemHeight = activeItem.offsetHeight;
    const boxHeight = suggestionBox.clientHeight;
    const scrollTop = suggestionBox.scrollTop;

    if (itemOffsetTop < scrollTop) {
        suggestionBox.scrollTop = itemOffsetTop;
    } else if (itemOffsetTop + itemHeight > scrollTop + boxHeight) {
        suggestionBox.scrollTop = itemOffsetTop + itemHeight - boxHeight;
    }
}

ipcRenderer.on('read-ingredient-file-response', (event, data) => {
    if (data) {
        ingredientTypeInput.value = data.type || '';
        ingredientKcalInput.value = data.kcal || '';
        ingredientProteinInput.value = data.protein || '';
        ingredientFiberInput.value = data.fiber || '';
        ingredientFatInput.value = data.fat || '';
        ingredientSaturatedInput.value = data.saturated || '';
        ingredientCarbInput.value = data.carb || '';
        ingredientSugarInput.value = data.sugar || '';
        ingredientSaltInput.value = data.salt || '';
        ingredientCholInput.value = data.chol || '';
        ingredientCostInput.value = data.cost || '';
        ingredientUnitWeightInput.value = data.unitWeight || '';
        ingredientUnitNameInput.value = data.unitName || '';
        checkInputs(); // Check inputs after populating fields
    }
});

addIngredientBtn.addEventListener('click', function (event) {
    // Collect input values
    const ingredientName = ingredientNameInput.value;
    const ingredientType = ingredientTypeInput.value;
    const ingredientKcal = ingredientKcalInput.value;
    const ingredientProtein = ingredientProteinInput.value;
    const ingredientFiber = ingredientFiberInput.value;
    const ingredientFat = ingredientFatInput.value;
    const ingredientSaturated = ingredientSaturatedInput.value;
    const ingredientCarb = ingredientCarbInput.value;
    const ingredientSugar = ingredientSugarInput.value;
    const ingredientSalt = ingredientSaltInput.value;
    const ingredientChol = ingredientCholInput.value;
    const ingredientCost = ingredientCostInput.value;
    const ingredientUnitWeight = ingredientUnitWeightInput.value;
    const ingredientUnitName = ingredientUnitNameInput.value;

    // Create a JSON object
    const fileContent = JSON.stringify({
        name: ingredientName,
        type: ingredientType,
        kcal: ingredientKcal,
        protein: ingredientProtein,
        fiber: ingredientFiber,
        fat: ingredientFat,
        saturated: ingredientSaturated,
        carb: ingredientCarb,
        sugar: ingredientSugar,
        salt: ingredientSalt,
        chol: ingredientChol,
        cost: ingredientCost,
        unitWeight: ingredientUnitWeight,
        unitName: ingredientUnitName
    }, null, 2); // Pretty print with 2 spaces

    const fileName = `${ingredientName}.json`;

    // Send the JSON object to the main process
    if (isUpdateMode) {
        ipcRenderer.send('update-file', fileName, fileContent);
    } else {
        ipcRenderer.send('create-file', fileName, fileContent);
    }

    // Check and update ingredient type
    ipcRenderer.send('check-update-ingredient-type', ingredientType);
});

ipcRenderer.on('create-file-response', (event, status) => {
    if (status === 'success') {
        //alert('File created successfully');
        div_resultOfCall.innerHTML = 'File created successfully';
        div_resultOfCall.style.color = '#4dff00';
    } else if (status === 'file-exists') {
        //alert('File already exists');
        div_resultOfCall.innerHTML = 'File already exists';
        div_resultOfCall.style.color = '#ff0000';
    } else {
        //alert('Failed to create file');
        div_resultOfCall.innerHTML = 'Failed to create file';
        div_resultOfCall.style.color = '#ff0000';
    }

    setTimeout(() => {div_resultOfCall.innerHTML = '';}, 1500);
});

ipcRenderer.on('update-file-response', (event, status) => {
    if (status === 'success') {
        //alert('File updated successfully');
        div_resultOfCall.innerHTML = 'File updated successfully';
        div_resultOfCall.style.color = '#4dff00';
    } else {
        //alert('Failed to update file');
        div_resultOfCall.innerHTML = 'Failed to update file';
        div_resultOfCall.style.color = '#ff0000';
    }

    addIngredientBtn.disabled = true;
    setTimeout(() => {window.close();}, 1500);
});

ipcRenderer.on('check-update-ingredient-type-response', (event, status) => {
    if (status === 'success') {
        console.log('Ingredient type added successfully');
    } else if (status === 'exists') {
        console.log('Ingredient type already exists');
    } else {
        console.error('Failed to update ingredient type');
    }
});

// Initially disable the button
addIngredientBtn.disabled = true;