const { ipcRenderer } = require('electron');
const { sortTable } = require('./tableSorting');



const recipeTable = document.getElementById('recipeTable').getElementsByTagName('tbody')[0];
const addRecipeBtn = document.getElementById('to_addRecipePage');

// Add event listeners for sorting
document.getElementById('nameHeader').addEventListener('click', function() { sortTable(recipeTable, 0); });
document.getElementById('kcalHeader').addEventListener('click', function() { sortTable(recipeTable, 1); });
document.getElementById('proteinHeader').addEventListener('click', function() { sortTable(recipeTable, 2); });
document.getElementById('fiberHeader').addEventListener('click', function() { sortTable(recipeTable, 3); });
document.getElementById('fatHeader').addEventListener('click', function() { sortTable(recipeTable, 4); });
document.getElementById('saturatedHeader').addEventListener('click', function() { sortTable(recipeTable, 5); });
document.getElementById('carbHeader').addEventListener('click', function() { sortTable(recipeTable, 6); });
document.getElementById('sugarHeader').addEventListener('click', function() { sortTable(recipeTable, 7); });
document.getElementById('saltHeader').addEventListener('click', function() { sortTable(recipeTable, 8); });
document.getElementById('cholHeader').addEventListener('click', function() { sortTable(recipeTable, 9); });
document.getElementById('costHeader').addEventListener('click', function() { sortTable(recipeTable, 10); });

// Add recipe button
addRecipeBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-recipe-window');
});


// On opening of view, fetch and render recipes
document.addEventListener('DOMContentLoaded', fetchAndRenderRecipes);

async function fetchAndRenderRecipes() {
    try {
        ipcRenderer.invoke('get-recipe-names').then((recipeData) => {
            // Read information from each recipe file
            recipeData.forEach(async recipe => {
                let recipeNutritionalValue = {};
                recipeNutritionalValue = await ipcRenderer.invoke('recipe-nutritional-values', recipe);
                await renderTableRow(recipe, recipeNutritionalValue);
            });
        });
    }
    catch (err) {
        console.error("Failed to fetch and render recipes:", err);
    }
}


async function renderTableRow(recipeName, recipeNutritionalValue) {
    const newRow = document.createElement('tr');

    let warningMissingIngredient = '';
    if(recipeNutritionalValue === 'ingredient-file-not-found') {
        warningMissingIngredient = `
                                    <div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>
                                        ⚠
                                    </div>`;
    }

    // If ingredient file is not found, display '-' for all values
    newRow.innerHTML = `
        <td class="left">${recipeName} ${warningMissingIngredient}</td>
        <td>${isNaN(recipeNutritionalValue.kcal)        ? "-" : recipeNutritionalValue.kcal.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.protein)     ? "-" : recipeNutritionalValue.protein.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.fiber)       ? "-" : recipeNutritionalValue.fiber.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.fat)         ? "-" : recipeNutritionalValue.fat.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.saturated)   ? "-" : recipeNutritionalValue.saturated.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.carb)        ? "-" : recipeNutritionalValue.carb.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.sugar)       ? "-" : recipeNutritionalValue.sugar.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.salt)        ? "-" : recipeNutritionalValue.salt.toFixed(2)}</td>
        <td>${isNaN(recipeNutritionalValue.chol)        ? "-" : recipeNutritionalValue.chol.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.cost)        ? "-" : recipeNutritionalValue.cost.toFixed(2)}</td>
        <td><button class="deleteAddButton" id="openGroceryList">≡</button></td>
    `;

    newRow.querySelector('#openGroceryList').addEventListener('click', function() {
        ipcRenderer.send('open-recipe-grocery-list-window', recipeName);
    });



    recipeTable.appendChild(newRow);
}

