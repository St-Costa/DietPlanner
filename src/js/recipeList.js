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
            recipeData.forEach(recipe => {
                let recipeNutritionalValue = {};
                ipcRenderer.invoke('read-recipe-file', recipe).then(async (recipeData) => {
                    recipeNutritionalValue = await computeRecipeNutritionalValues(recipeData.ingredientsArray, recipeData.quantitiesArray);
                    
                    if(recipeNutritionalValue === 'ingredient-file-not-found') {
                        recipeNutritionalValue = {
                            name: recipeNutritionalValue, // 'ingredient-file-not-found'
                            type: '-',
                            kcal: '-',
                            protein: '-',
                            fiber: '-',
                            fat: '-',
                            saturated: '-',
                            carb: '-',
                            sugar: '-',
                            salt: '-',
                            chol: '-',
                            cost: '-'
                        };
                    }
                    await renderTableRow(recipe, recipeNutritionalValue);
                });
            });
        });
    }
    catch (err) {
        console.error("Failed to fetch and render recipes:", err);
    }
}

async function computeRecipeNutritionalValues (ingredientArray, quantityArray) {
    let totalNutritionalValues = {
        name: '',
        type: '',
        kcal: 0,
        protein: 0,
        fiber: 0,
        fat: 0,
        saturated: 0,
        carb: 0,
        sugar: 0,
        salt: 0,
        chol: 0,
        cost: 0
    };

    for (let i = 0; i < ingredientArray.length; i++) {
        const ingredientName = ingredientArray[i];
        const quantity = quantityArray[i];

        const ingredientData = await ipcRenderer.invoke('read-ingredient-file', ingredientName);
        
        // Ingredient file might be deleted
        if(ingredientData === 'file-not-found') {
            return 'ingredient-file-not-found';
        }
        
        totalNutritionalValues.kcal += ingredientData.kcal * quantity / 100;
        totalNutritionalValues.protein += ingredientData.protein * quantity / 100;
        totalNutritionalValues.fiber += ingredientData.fiber * quantity / 100;
        totalNutritionalValues.fat += ingredientData.fat * quantity / 100;
        totalNutritionalValues.saturated += ingredientData.saturated * quantity / 100;
        totalNutritionalValues.carb += ingredientData.carb * quantity / 100;
        totalNutritionalValues.sugar += ingredientData.sugar * quantity / 100;
        totalNutritionalValues.salt += ingredientData.salt * quantity / 100;
        totalNutritionalValues.chol += ingredientData.chol * quantity / 100;
        if(ingredientData.unitWeight !== "") {
            totalNutritionalValues.cost += ingredientData.cost * quantity / ingredientData.unitWeight;
        }
        else {
            totalNutritionalValues.cost += ingredientData.cost * quantity / 100;
        }
    }

    return totalNutritionalValues;
}

async function renderTableRow(recipeName, recipeNutritionalValue) {
    const newRow = document.createElement('tr');

    let warningMissingIngredient = '';
    if(recipeNutritionalValue.name === 'ingredient-file-not-found') {
        warningMissingIngredient = `
                                    <div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>
                                        ⚠
                                    </div>`;
    }

    // If ingredient file is not found, display '-' for all values
    newRow.innerHTML = `
        <td class="left">${recipeName} ${warningMissingIngredient}</td>
        <td>${isNaN(recipeNutritionalValue.kcal) ? recipeNutritionalValue.kcal : recipeNutritionalValue.kcal.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.protein) ? recipeNutritionalValue.protein : recipeNutritionalValue.protein.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.fiber) ? recipeNutritionalValue.fiber : recipeNutritionalValue.fiber.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.fat) ? recipeNutritionalValue.fat : recipeNutritionalValue.fat.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.saturated) ? recipeNutritionalValue.saturated : recipeNutritionalValue.saturated.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.carb) ? recipeNutritionalValue.carb : recipeNutritionalValue.carb.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.sugar) ? recipeNutritionalValue.sugar : recipeNutritionalValue.sugar.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.salt) ? recipeNutritionalValue.salt : recipeNutritionalValue.salt.toFixed(2)}</td>
        <td>${isNaN(recipeNutritionalValue.chol) ? recipeNutritionalValue.chol : recipeNutritionalValue.chol.toFixed(0)}</td>
        <td>${isNaN(recipeNutritionalValue.cost) ? recipeNutritionalValue.cost : recipeNutritionalValue.cost.toFixed(2)}</td>
        <td><button class="deleteAddButton" id="openGroceryList">≡</button></td>
    `;

    newRow.querySelector('#openGroceryList').addEventListener('click', function() {
        ipcRenderer.send('open-recipe-grocery-list-window', recipeName);
    });



    recipeTable.appendChild(newRow);
}

