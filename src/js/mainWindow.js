const { ipcRenderer } = require('electron');
const path = require('path');
const url = require('url');


const ingredientListBtn = document.getElementById('ingredientListButton');

ingredientListBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-ingredient-list-window');
});


const addRecipeBtn = document.getElementById('addRecipe');

addRecipeBtn.addEventListener('click', function (event) {
    console.log("Opening add recipe");
    ipcRenderer.send('open-add-recipe-window');
});


const recipeListBtn = document.getElementById('recipeListButton');

recipeListBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-recipe-list-window');
});

const pantryBtn = document.getElementById('modifyPantry');

pantryBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-pantry-window');
});

const addDailyPlanBtn = document.getElementById('addDailyPlan');
addDailyPlanBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-daily-plan-window');
});