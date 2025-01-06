const { ipcRenderer } = require('electron');
const { errorHandling } = require('./messageBoxUpdate');
const { showSuggestions, navigateSuggestions } = require('./suggestions');

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

const messageBox = document.getElementById('messageBox');

let isUpdateMode = false;
let currentFocus = -1;

// Initially disable the button
addIngredientBtn.disabled = true;

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

function clearInputs() {
    ingredientNameInput.value = '';
    ingredientTypeInput.value = '';
    ingredientKcalInput.value = '';
    ingredientProteinInput.value = '';
    ingredientFiberInput.value = '';
    ingredientFatInput.value = '';
    ingredientSaturatedInput.value = '';
    ingredientCarbInput.value = '';
    ingredientSugarInput.value = '';
    ingredientSaltInput.value = '';
    ingredientCholInput.value = '';
    ingredientCostInput.value = '';
    ingredientUnitWeightInput.value = '';
    ingredientUnitNameInput.value = '';
    ingredientNameInput.disabled = false;
    addIngredientBtn.textContent = 'Add ingredient';
    isUpdateMode = false;
}

// Add event listeners to inputs
const inputs = [
    ingredientNameInput, ingredientTypeInput, ingredientKcalInput, ingredientProteinInput,
    ingredientFiberInput, ingredientFatInput, ingredientSaturatedInput, ingredientCarbInput,
    ingredientSugarInput, ingredientSaltInput, ingredientCholInput, ingredientCostInput,
    ingredientUnitWeightInput, ingredientUnitNameInput
];
inputs.forEach(input => input.addEventListener('input', checkInputs));




// ***
// Autocompletion for ingredient name
// ***

ingredientNameInput.addEventListener('focus', async function() {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('ingredient', suggestionBox_name, this, thisWindowId);
    
});
ingredientNameInput.addEventListener('input', async function() {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('ingredient', suggestionBox_name, this, thisWindowId);
});

// When click outside input field, hide suggestion box
// If the click is on the suggestion box, do not hide it
ingredientNameInput.addEventListener('blur', function(event) {
    if (suggestionBox_name.contains(event.relatedTarget)) {
        suggestionBox_name.style.display = 'none';
    }
});

ingredientNameInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_name);
});

ipcRenderer.on('suggested-ingredient-clicked', (event, ingredientData) => {
    console.log(ingredientData);
    isUpdateMode = true;
    addIngredientBtn.textContent = 'Update ingredient';
    ingredientNameInput.disabled = true;
    populateInputs(ingredientData);
});

// ***
// Autocompletion for ingredient name
// ***

// Request ingredient types for autocompletion
ingredientTypeInput.addEventListener('focus', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('type', suggestionBox_type, this, thisWindowId);
});
ingredientTypeInput.addEventListener('input', async function () {
    const thisWindowId = await ipcRenderer.invoke('get-window-id');
    showSuggestions('type', suggestionBox_type, this, thisWindowId);
});

// When click outside input field, hide suggestion box
// If the click is on the suggestion box, do not hide it
ingredientTypeInput.addEventListener('blur', function(event) {
    console.log(event);
    if (suggestionBox_name.contains(event.relatedTarget)) {
        suggestionBox_name.style.display = 'none';
    }
});
ingredientTypeInput.addEventListener('keydown', function (e) {
    navigateSuggestions(e, suggestionBox_type);
});

function populateInputs(ingredientData){
    ingredientTypeInput.value = ingredientData.type || '';
    ingredientKcalInput.value = ingredientData.kcal || '';
    ingredientProteinInput.value = ingredientData.protein || '';
    ingredientFiberInput.value = ingredientData.fiber || '';
    ingredientFatInput.value = ingredientData.fat || '';
    ingredientSaturatedInput.value = ingredientData.saturated || '';
    ingredientCarbInput.value = ingredientData.carb || '';
    ingredientSugarInput.value = ingredientData.sugar || '';
    ingredientSaltInput.value = ingredientData.salt || '';
    ingredientCholInput.value = ingredientData.chol || '';
    ingredientCostInput.value = ingredientData.cost || '';
    ingredientUnitWeightInput.value = ingredientData.unitWeight || '';
    ingredientUnitNameInput.value = ingredientData.unitName || '';
}

addIngredientBtn.addEventListener('click', async function (event) {
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
    const fileContent = {
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
    };

    // Send the JSON object to the main process
    let result = false;
    if (isUpdateMode) {
        result = await ipcRenderer.invoke('update-ingredient-file', ingredientName, fileContent);
        errorHandling(messageBox, result);
        clearInputs();
    } else {
        result = await ipcRenderer.invoke('create-ingredient-file', ingredientName, fileContent);
        errorHandling(messageBox, result);
        clearInputs();
    }

});

