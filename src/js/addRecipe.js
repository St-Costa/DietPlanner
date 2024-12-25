const { ipcRenderer } = require('electron');

const ingredientNameInput = document.getElementById('ingredientName');
const suggestionBox = document.getElementById('suggestionBox');
const unitWeightDiv = document.getElementById('unitWeight');
const unitNameSpan = document.getElementById('unitName');
const quantityGramsInput = document.getElementById('quantityGrams');
const quantityUnitInput = document.getElementById('quantityUnit');
const fractionRow = document.getElementById('fractionRow');
const unitNameRow = document.getElementById('unitNameRow');
const recipeNameInput = document.getElementById('recipeName');
const suggestionBoxRecipe = document.getElementById('suggestionBox_recipe');

let currentFocus = -1;
let unitWeight = 0;

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
        if (data.unitWeight) {
            unitWeight = parseFloat(data.unitWeight);
            unitWeightDiv.textContent = `${unitWeight} g`;
            unitWeightDiv.style.color = '#ff5e00';
            fractionRow.style.display = '';
            unitNameRow.style.display = '';
        } else {
            unitWeight = 0;
            unitWeightDiv.textContent = '(unit weight)';
            fractionRow.style.display = 'none';
            unitNameRow.style.display = 'none';
        }
        if (data.unitName) {
            unitNameSpan.textContent = data.unitName;
            unitNameSpan.style.color = '#ff5e00';
        } else {
            unitNameSpan.textContent = '(unit name)';
        }
    }
});

quantityGramsInput.addEventListener('input', function () {
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

quantityUnitInput.addEventListener('input', function () {
    if (unitWeight > 0) {
        const units = parseFloat(this.value);
        if (!isNaN(units)) {
            const grams = units * unitWeight;
            quantityGramsInput.value = grams.toFixed(2);
        } else {
            quantityGramsInput.value = '';
        }
    }
});

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