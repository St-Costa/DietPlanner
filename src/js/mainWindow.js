const { ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');


const ingredientListBtn = document.getElementById('ingredientListButton');



ingredientListBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-ingredient-list-window');
});



