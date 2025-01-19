const { ipcRenderer }   = require('electron');

module.exports = {
    renderTable : async function renderTable(tableList, table, messageBoxDiv){
        try{
            switch(tableList) {
                case 'recipeList':
                    await renderRecipeListTable(table);
                    break;
                default:
                    console.error("Table list not recognized");
            }    
        }
        catch(err){
            console.error("[renderTable] -> ", err);
            throw err;
        }
    }
}

// recipeList.js
async function renderRecipeListTable(table) {
    try {
        // Fetch recipe names
        const recipeList = await ipcRenderer.invoke('get-recipe-names');

        // Fetch nutritional values for each recipe + render rows
        recipeList.forEach(async recipe => {
            let recipeNutritionalValue = {};
            recipeNutritionalValue = await ipcRenderer.invoke('recipe-nutritional-values', recipe);
            await renderTableRow(table, recipe, recipeNutritionalValue);
        });
    }
    catch (err) {
        console.error("[renderRecipeListTable] -> ", err);
        throw err;
    }
}




async function renderTableRow(table, rowName, rowNutritionalValue) {
    const newRow = document.createElement('tr');

    // If ingredient file is not found, display warning
    let warningMissingIngredient = '';
    if(!rowNutritionalValue) {
        warningMissingIngredient = `
                                    <div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>
                                        ⚠
                                    </div>`;
    }

    // If ingredient file is not found, display '-' for all values
    newRow.innerHTML = `
        <td class="left">${rowName} ${warningMissingIngredient}</td>
        <td>${isNaN(rowNutritionalValue.kcal)        ? "-" : rowNutritionalValue.kcal.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.protein)     ? "-" : rowNutritionalValue.protein.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.fiber)       ? "-" : rowNutritionalValue.fiber.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.fat)         ? "-" : rowNutritionalValue.fat.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.saturated)   ? "-" : rowNutritionalValue.saturated.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.carb)        ? "-" : rowNutritionalValue.carb.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.sugar)       ? "-" : rowNutritionalValue.sugar.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.salt)        ? "-" : rowNutritionalValue.salt.toFixed(2)}</td>
        <td>${isNaN(rowNutritionalValue.chol)        ? "-" : rowNutritionalValue.chol.toFixed(0)}</td>
        <td>${isNaN(rowNutritionalValue.cost)        ? "-" : rowNutritionalValue.cost.toFixed(2)}</td>
        <td><button class="deleteAddButton" id="openGroceryList">≡</button></td>
    `;

    newRow.querySelector('#openGroceryList').addEventListener('click', function() {
        ipcRenderer.send('open-recipe-grocery-list-window', rowName);
    });

    table.appendChild(newRow);
}