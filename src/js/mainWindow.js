const { ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');

const addIngredientBtn = document.getElementById('addIngredientButton');
const ingredientListBtn = document.getElementById('ingredientListButton');

addIngredientBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-ingredient-window');
});

ingredientListBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-ingredient-list-window');
});



