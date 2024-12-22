const { ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');

const addIngredientBtn = document.getElementById('addIngredient');

addIngredientBtn.addEventListener('click', function (event) {
    // Collect input values
    const ingredientName = document.getElementById('ingredientName').value;
    const ingredientKcal = document.getElementById('ingredientKcal').value;
    const ingredientProtein = document.getElementById('ingredientProtein').value;

    // Create a JSON object
    const fileContent = JSON.stringify({
        name: ingredientName,
        kcal: ingredientKcal,
        protein: ingredientProtein,
    }, null, 2); // Pretty print with 2 spaces

    const fileName = ingredientName + '.txt';
    ipcRenderer.send('create-file', fileName, fileContent);
});

ipcRenderer.on('create-file-response', (event, status) => {
    if (status === 'file-exists') {
        alert('File already exists!');
    }
});