const { ipcRenderer } = require('electron');
const { messageBoxUpdate } = require('./messageBoxUpdate');

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




// ***
// Autocompletion for ingredient name
// ***

ingredientNameInput.addEventListener('focus', async function () {
    let ingredientsName = await ipcRenderer.invoke('get-ingredient-names');
    showSuggestions(ingredientsName, suggestionBox_name, ingredientNameInput);
});

ingredientNameInput.addEventListener('input', async function () {
    let ingredientsName = await ipcRenderer.invoke('get-ingredient-names');
    const input = this.value.toLowerCase();
    const suggestions = ingredientsName.filter(name => name.toLowerCase().includes(input));
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

// ***
// Autocompletion for ingredient name
// ***

// Request ingredient types for autocompletion
ingredientTypeInput.addEventListener('focus', async function () {
    let ingredientTypes = await ipcRenderer.invoke('get-ingredient-types');
    showSuggestions(ingredientTypes, suggestionBox_type, ingredientTypeInput);
});
ingredientTypeInput.addEventListener('input', async function () {
    let ingredientTypes = await ipcRenderer.invoke('get-ingredient-types');
    const input = this.value.toLowerCase();
    const suggestions = ingredientTypes.filter(type => type.toLowerCase().includes(input));
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

// ***
// Show suggestions
// ***

function showSuggestions(suggestions, suggestionBox, inputElement) {
    suggestionBox.innerHTML = '';
    suggestionBox.style.display = 'block';
    currentFocus = -1;
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', async function () {
            inputElement.value = suggestion;
            suggestionBox.innerHTML = '';
            checkInputs(); // Check inputs after selecting a suggestion
            if (inputElement === ingredientNameInput) {
                // Request file content
                let ingredientData = await ipcRenderer.invoke('read-ingredient-file', suggestion);
                populateInputs(ingredientData);
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
        if (result == 'success') {
            messageBoxUpdate(messageBox, 'File updated successfully!', true);
            clearInputs();
        } else if (result == 'failure') {
            messageBoxUpdate(messageBox, 'Failed to update file!', false);
        } else if (result == "file-not-found"){
            messageBoxUpdate(messageBox, 'File not found!', false);
        }
    } else {
        result = await ipcRenderer.invoke('create-ingredient-file', ingredientName, fileContent);
        if (result == 'success'){
            messageBoxUpdate(messageBox, 'File created successfully!', true);
            clearInputs();
        }
        else if (result == 'failure'){
            messageBoxUpdate(messageBox, 'Failed to create file!', false);
        }
        else if (result == "file-exists"){
            messageBoxUpdate(messageBox, 'File already exists!', false);
        }
    }

});

