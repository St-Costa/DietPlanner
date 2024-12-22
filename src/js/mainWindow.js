const { ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');

const addIngredientBtn = document.getElementById('addIngredientButton');

addIngredientBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-ingredient-window');
});