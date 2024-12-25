const { ipcRenderer } = require('electron');

const ingredientNameInput = document.getElementById('ingredientName');
const suggestionBox = document.getElementById('suggestionBox');
const unitNameSpan = document.getElementById('unitName');
const unitAlternativeSpan = document.getElementById('unitAlternative');
const quantityGramsInput = document.getElementById('quantityGrams');
const quantityUnitInput = document.getElementById('quantityUnit');
const recipeNameInput = document.getElementById('recipeName');
const suggestionBoxRecipe = document.getElementById('suggestionBox_recipe');
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
ipcRenderer.send('get-ingredient-names');

// Request recipe names for autocompletion
ipcRenderer.send('get-recipe-names');

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
            if (inputElement === ingredientNameInput) {
                // Request file content
                quantityGramsInput.value = 0;
                quantityUnitInput.value = 0;
                ipcRenderer.send('read-ingredient-file', suggestion);
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

ipcRenderer.on('read-ingredient-file-response', (event, data) => {
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
            //unitNameSpan.textContent = '(unit name)';
        }
        updateIngredientDetails();
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