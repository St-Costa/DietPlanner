const { ipcRenderer } = require('electron');

const addIngredientBtn = document.getElementById('addIngredient');

const ingredientNameInput = document.getElementById('ingredientName');
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

// Function to check if all inputs are filled
function checkInputs() {
    if (ingredientNameInput.value.trim() !== '' &&
        ingredientKcalInput.value.trim() !== '' &&
        ingredientProteinInput.value.trim() !== '' &&
        ingredientFiberInput.value.trim() !== '' &&
        ingredientFatInput.value.trim() !== '' &&
        ingredientSaturatedInput.value.trim() !== '' &&
        ingredientCarbInput.value.trim() !== '' &&
        ingredientSugarInput.value.trim() !== '' &&
        ingredientSaltInput.value.trim() !== '' &&
        ingredientCholInput.value.trim() !== '' &&
        ingredientCostInput.value.trim() !== '' &&
        ingredientUnitWeightInput.value.trim() !== '' &&
        ingredientUnitNameInput.value.trim() !== ''
        ) {
        addIngredientBtn.disabled = false;
    } else {
        addIngredientBtn.disabled = true;
    }
}

// Add event listeners to inputs
ingredientNameInput.addEventListener('input', checkInputs);
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
    ingredientKcalInput, ingredientProteinInput, ingredientFiberInput,
    ingredientFatInput, ingredientSaturatedInput, ingredientCarbInput,
    ingredientSugarInput, ingredientSaltInput, ingredientCholInput,
    ingredientCostInput, ingredientUnitWeightInput, ingredientUnitNameInput
];

allInputs.forEach(input => {
    input.addEventListener('focus', () => {
        suggestionBox_name.innerHTML = '';
    });
});

// Request ingredient names for autocompletion
ipcRenderer.send('get-ingredient-names');

ipcRenderer.on('ingredient-names-response', (event, fileNames) => {
    // Implement autocompletion
    ingredientNameInput.addEventListener('input', function () {
        const input = this.value.toLowerCase();
        const suggestions = fileNames.filter(name => name.toLowerCase().startsWith(input));
        showSuggestions(suggestions);
    });
});

function showSuggestions(suggestions) {
    suggestionBox_name.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', function () {
            ingredientNameInput.value = suggestion;
            suggestionBox_name.innerHTML = '';
            checkInputs(); // Check inputs after selecting a suggestion
            // Request file content
            ipcRenderer.send('read-ingredient-file', suggestion);
        });
        suggestionBox_name.appendChild(div);
    });
}

ipcRenderer.on('read-ingredient-file-response', (event, data) => {
    if (data) {
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
    ipcRenderer.send('create-file', fileName, fileContent);
});

ipcRenderer.on('create-file-response', (event, status) => {
    if (status === 'success') {
        alert('File created successfully');
    } else if (status === 'file-exists') {
        alert('File already exists');
    } else {
        alert('Failed to create file');
    }
});

ipcRenderer.on('update-file-response', (event, status) => {
    if (status === 'success') {
        alert('File updated successfully');
    } else {
        alert('Failed to update file');
    }
});

// Initially disable the button
addIngredientBtn.disabled = true;