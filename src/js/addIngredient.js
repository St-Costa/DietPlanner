const { ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');

const addIngredientBtn = document.getElementById('addIngredient');
const ingredientNameInput = document.getElementById('ingredientName');
const suggestionBox = document.getElementById('suggestionBox');

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
    suggestionBox.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', function () {
            ingredientNameInput.value = suggestion;
            suggestionBox.innerHTML = '';
        });
        suggestionBox.appendChild(div);
    });
}

addIngredientBtn.addEventListener('click', function (event) {
    // Collect input values
    const ingredientName = document.getElementById('ingredientName').value;
    const ingredientKcal = document.getElementById('ingredientKcal').value;
    const ingredientProtein = document.getElementById('ingredientProtein').value;

    // Create a JSON object
    const fileContent = JSON.stringify({
        name: ingredientName,
        kcal: ingredientKcal,
        protein: ingredientProtein
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