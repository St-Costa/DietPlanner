const { ipcRenderer } = require('electron');

const recipeTable = document.getElementById('recipeTable').getElementsByTagName('tbody')[0];
const addRecipeBtn = document.getElementById('to_addRecipePage');

// Add event listeners for sorting
document.getElementById('nameHeader').addEventListener('click', function() { sortTable(0); });
document.getElementById('kcalHeader').addEventListener('click', function() { sortTable(1); });
document.getElementById('proteinHeader').addEventListener('click', function() { sortTable(2); });
document.getElementById('fiberHeader').addEventListener('click', function() { sortTable(3); });
document.getElementById('fatHeader').addEventListener('click', function() { sortTable(4); });
document.getElementById('saturatedHeader').addEventListener('click', function() { sortTable(5); });
document.getElementById('carbHeader').addEventListener('click', function() { sortTable(6); });
document.getElementById('sugarHeader').addEventListener('click', function() { sortTable(7); });
document.getElementById('saltHeader').addEventListener('click', function() { sortTable(8); });
document.getElementById('cholHeader').addEventListener('click', function() { sortTable(9); });
document.getElementById('costHeader').addEventListener('click', function() { sortTable(10); });



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
        totalNutritionalValues.kcal += ingredientData.kcal * quantity / 100;
        totalNutritionalValues.protein += ingredientData.protein * quantity / 100;
        totalNutritionalValues.fiber += ingredientData.fiber * quantity / 100;
        totalNutritionalValues.fat += ingredientData.fat * quantity / 100;
        totalNutritionalValues.saturated += ingredientData.saturated * quantity / 100;
        totalNutritionalValues.carb += ingredientData.carb * quantity / 100;
        totalNutritionalValues.sugar += ingredientData.sugar * quantity / 100;
        totalNutritionalValues.salt += ingredientData.salt * quantity / 100;
        totalNutritionalValues.chol += ingredientData.chol * quantity / 100;
        if(ingredientData.unitWeight !== 0) {
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

    newRow.innerHTML = `
        <td>${recipeName}</td>
        <td>${recipeNutritionalValue.kcal.toFixed(0)}</td>
        <td>${recipeNutritionalValue.protein.toFixed(0)}</td>
        <td>${recipeNutritionalValue.fiber.toFixed(0)}</td>
        <td>${recipeNutritionalValue.fat.toFixed(0)}</td>
        <td>${recipeNutritionalValue.saturated.toFixed(0)}</td>
        <td>${recipeNutritionalValue.carb.toFixed(0)}</td>
        <td>${recipeNutritionalValue.sugar.toFixed(0)}</td>
        <td>${recipeNutritionalValue.salt.toFixed(2)}</td>
        <td>${recipeNutritionalValue.chol.toFixed(0)}</td>
        <td>${recipeNutritionalValue.cost.toFixed(2)}</td>
    `;

    recipeTable.appendChild(newRow);
}

/* ****************************** Sorting ****************************** */

function sortTable(n) {
    var rows, i, x, y, count = 0;
    var switching = true;

    var direction = "ascending";

    // Run loop until no switching is needed
    while (switching) {
        switching = false;
        var rows = recipeTable.rows;

        // Loop to go through all rows
        for (i = 0; i < (rows.length - 1); i++) {
            var Switch = false;

            // Fetch 2 elements that need to be compared
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];

            // Check the direction of order
            if (direction == "ascending") {
                // Check if 2 rows need to be switched
                if (isNaN(parseFloat(x.innerHTML))) {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        // If yes, mark Switch as needed and break loop
                        Switch = true;
                        break;
                    }
                } else {
                    if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
                        // If yes, mark Switch as needed and break loop
                        Switch = true;
                        break;
                    }
                }
            } else if (direction == "descending") {
                // Check direction
                if (isNaN(parseFloat(x.innerHTML))) {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        // If yes, mark Switch as needed and break loop
                        Switch = true;
                        break;
                    }
                } else {
                    if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
                        // If yes, mark Switch as needed and break loop
                        Switch = true;
                        break;
                    }
                }
            }
        }
        if (Switch) {
            // Function to switch rows and mark switch as completed
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;

            // Increase count for each switch
            count++;
        } else {
            // Run while loop again for descending order
            if (count == 0 && direction == "ascending") {
                direction = "descending";
                switching = true;
            }
        }
    }
}


