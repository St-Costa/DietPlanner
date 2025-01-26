const { ipcRenderer } = window.require('electron');
const { sumRowSetTable, addSumRow, updateSumRow } = require('./sumRow');

let tableType = '';
let dynamicTable = '';
let dataJSON = {};

module.exports = {

    // Set the table type and the table HTML element
    setTableType : function setTableType(type, tableHTML){
        tableType = type;
        dynamicTable = tableHTML;

        // For the sumRow.js module
        sumRowSetTable(dynamicTable);
    },

    // Render the table based on the given data
    renderRecipeAndPlanTable: async function renderRecipeAndPlanTable (givenDataJSON) {
        dataJSON = givenDataJSON;

        let elementsArray = [];
        let quantityArray = [];

        // Based on the table type, get the correct arrays
        switch (tableType) {
            case 'recipe':
                elementsArray = givenDataJSON.ingredientsArray;
                quantityArray = givenDataJSON.quantitiesArray;
                break;
            default:
                console.log('[renderRecipeAndPlanTable] -> Invalid table type: ' + tableType);
        }

        // Clear existing rows
        dynamicTable.innerHTML = '';

        // Create the table
        recipeTable(elementsArray, quantityArray);
    }
}


/************************
    RECIPE TABLE
************************/
async function recipeTable(ingredientsArray, quantitiesArray){
    for (let i = 0; i < ingredientsArray.length; i++) {
        const ingredientName    = ingredientsArray[i];
        const quantityGrams     = quantitiesArray[i];

        // Request ingredient file content
        let ingredientDataWithQuantity = {name: ingredientName};
        let warningMissingIngredient = "";
        try{
            ingredientDataWithQuantity = await ipcRenderer.invoke('read-ingredient-file-with-quantity', ingredientName, quantityGrams);
        }
        catch(err){
            ingredientDataWithQuantity.name += ` <div style='color: #ff5e00; font-size: 1.5em;display: inline-block;'>⚠</div>`   
        }

        // Create a new row for the ingredient
        const newRow = addIngredientRow(ingredientDataWithQuantity, quantityGrams, warningMissingIngredient);
        addCommonEventListenerToRow(newRow, ingredientName, ingredientDataWithQuantity);
        dynamicTable.appendChild(newRow);          
    }

    // Sum row
    const sumRow = addSumRow(3);
    dynamicTable.appendChild(sumRow);
    updateSumRow();
}


function addIngredientRow(ingredientDataWithQuantity, quantityGrams, warningMissingIngredient){
    const newRow = document.createElement('tr');

    newRow.classList.add('element-row'); // to distinguish from the sum row
    
    newRow.innerHTML = `
        <td>${ingredientDataWithQuantity.name} ${warningMissingIngredient}</td>
        <td class="left">
            <input type="number" id="gramsInput" value="${quantityGrams}" class="numberInput" step="0.1"> g
            ${ingredientDataWithQuantity.unitWeight ? `
            <div style="display: inline;">
                ||
                <input class="numberInput" id="unitInput" type="number" value="${(quantityGrams / ingredientDataWithQuantity.unitWeight).toFixed(2)}" placeholder="[0,∞]" min="0" step="0.01" oninput="validity.valid||(value='');"> 
                of 
                <span>${ingredientDataWithQuantity.unitName}</span>
            </div>` : ''}
        </td>
        <td class="center">                     ${ingredientDataWithQuantity.type       ? ingredientDataWithQuantity.type                   : '-'}</td>
        <td class="center" id="elementKcal">    ${ingredientDataWithQuantity.kcal       ? ingredientDataWithQuantity.kcal.toFixed(0)        : '-'}</td>
        <td class="center" id="elementProtein"> ${ingredientDataWithQuantity.protein    ? ingredientDataWithQuantity.protein.toFixed(0)     : '-'}</td>
        <td class="center" id="elementFiber">   ${ingredientDataWithQuantity.fiber      ? ingredientDataWithQuantity.fiber.toFixed(0)       : '-'}</td>
        <td class="center" id="elementFat">     ${ingredientDataWithQuantity.fat        ? ingredientDataWithQuantity.fat.toFixed(0)         : '-'}</td>
        <td class="center" id="elementSat">     ${ingredientDataWithQuantity.saturated  ? ingredientDataWithQuantity.saturated.toFixed(0)   : '-'}</td>
        <td class="center" id="elementCarb">    ${ingredientDataWithQuantity.carb       ? ingredientDataWithQuantity.carb.toFixed(0)        : '-'}</td>
        <td class="center" id="elementSugar">   ${ingredientDataWithQuantity.sugar      ? ingredientDataWithQuantity.sugar.toFixed(0)       : '-'}</td>
        <td class="center" id="elementSalt">    ${ingredientDataWithQuantity.salt       ? ingredientDataWithQuantity.salt.toFixed(2)        : '-'}</td>
        <td class="center" id="elementChol">    ${ingredientDataWithQuantity.chol       ? ingredientDataWithQuantity.chol.toFixed(0)        : '-'}</td>
        <td class="center" id="elementCost">    ${ingredientDataWithQuantity.cost       ? ingredientDataWithQuantity.cost.toFixed(2)        : '-'}</td>
        <td><button class="removeRow deleteAddButton">x</button></td>
    `;

    // Add event listener to the gram input field
    newRow.querySelector('#gramsInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const grams = parseFloat(this.value);
            if (!isNaN(grams)) {
                // Remove the row if the grams are 0
                if (grams === 0) {
                    newRow.querySelector('.removeRow').click();
                    return;
                } 
                // Update the row
                else {
                    const units = grams / ingredientDataWithQuantity.unitWeight;
                    const unitInput = newRow.querySelector('#unitInput');
                    if (unitInput) {
                        unitInput.value = units.toFixed(2);
                    }
                }
            }

            locallyModifydataJSON(ingredientDataWithQuantity.name, grams);
            createOrUpdateFile();
        }
    });

    // Add event listener to the unit input field
    const unitInput = newRow.querySelector('#unitInput');
    if (unitInput) {
        unitInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const units = parseFloat(this.value);
                let grams = 0;
                if (!isNaN(units)) {
                    grams = units * ingredientDataWithQuantity.unitWeight;
                    newRow.querySelector('#gramsInput').value = grams.toFixed(2);
                    // Remove the row if the grams are 0
                    if (grams === 0) {
                        newRow.querySelector('.removeRow').click();
                        return;
                    }
                }

                locallyModifydataJSON(ingredientDataWithQuantity.name, grams);
                createOrUpdateFile();
            }
        });
    }

    // Change temporary values when the user types in the input fields
    newRow.querySelector('#gramsInput').addEventListener('input', function() {
        const grams = parseFloat(this.value);
        if (!isNaN(grams)) {
            const units = grams / ingredientDataWithQuantity.unitWeight;
            const unitInput = newRow.querySelector('#unitInput');
            if (unitInput) {
                unitInput.value = units.toFixed(2);
            }
            updateRowDetails(newRow, ingredientDataWithQuantity.name, grams);
        }
    });
    const unitInputField = newRow.querySelector('#unitInput');
    if (unitInputField) {
        unitInputField.addEventListener('input', function() {
            const units = parseFloat(this.value);
            if (!isNaN(units)) {
                const grams = units * ingredientDataWithQuantity.unitWeight;
                newRow.querySelector('#gramsInput').value = grams.toFixed(0);
                updateRowDetails(newRow, ingredientDataWithQuantity.name, grams);
            }
        });
    }

    // When modify grams without updating the recipe, revert to the original value
    newRow.querySelector('#gramsInput').addEventListener('blur', function() {
        this.value = dataJSON.quantitiesArray[dataJSON.ingredientsArray.indexOf(ingredientDataWithQuantity.name)].toFixed(0);
        const unitInput = newRow.querySelector('#unitInput');
        if (unitInput) {
            unitInput.value = (this.value / ingredientDataWithQuantity.unitWeight).toFixed(2);
        }
        updateRowDetails(newRow, ingredientDataWithQuantity.name, this.value);                
    });
    // When modify units without updating the recipe, revert to the original value
    if (unitInputField) {
        unitInputField.addEventListener('blur', function() {
            gramsBeforeModification = dataJSON.quantitiesArray[dataJSON.ingredientsArray.indexOf(ingredientDataWithQuantity.name)].toFixed(0);
            this.value = (gramsBeforeModification / ingredientDataWithQuantity.unitWeight).toFixed(2);
            newRow.querySelector('#gramsInput').value = gramsBeforeModification;
            updateRowDetails(newRow, ingredientDataWithQuantity.name, gramsBeforeModification);
        });
    }

    // Function to update ingredient details only in the row (not in recipe)
    async function updateRowDetails(newRow, ingredientName, quantityGrams) {
        const ingredientDataWithQuantity = await ipcRenderer.invoke('read-ingredient-file-with-quantity', ingredientName, quantityGrams);

        newRow.querySelector('#elementKcal').textContent    = ingredientDataWithQuantity.kcal.toFixed(0);
        newRow.querySelector('#elementProtein').textContent = ingredientDataWithQuantity.protein.toFixed(0);
        newRow.querySelector('#elementFiber').textContent   = ingredientDataWithQuantity.fiber.toFixed(0);
        newRow.querySelector('#elementFat').textContent     = ingredientDataWithQuantity.fat.toFixed(0);
        newRow.querySelector('#elementSat').textContent     = ingredientDataWithQuantity.saturated.toFixed(0);
        newRow.querySelector('#elementCarb').textContent    = ingredientDataWithQuantity.carb.toFixed(0);
        newRow.querySelector('#elementSugar').textContent   = ingredientDataWithQuantity.sugar.toFixed(0);
        newRow.querySelector('#elementSalt').textContent    = ingredientDataWithQuantity.salt.toFixed(2);
        newRow.querySelector('#elementChol').textContent    = ingredientDataWithQuantity.chol.toFixed(0);
        newRow.querySelector('#elementCost').textContent    = ingredientDataWithQuantity.cost.toFixed(2);
        updateSumRow();                    
    }

    return newRow;
}

/************************
    RECIPE TABLE -> [END]
************************/



function addCommonEventListenerToRow(row, ingredientName, ingredientData){
    // Change ingredient name color on button hover
    row.querySelector('.removeRow').addEventListener('mouseover', function() {
        row.querySelector('td').style.color = '#ff5e00';
    });
    row.querySelector('.removeRow').addEventListener('mouseout', function() {
        row.querySelector('td').style.color = '';
    });

    // Remove ingredient button
    row.querySelector('.removeRow').addEventListener('click', function() {
        row.remove();
        locallyModifydataJSON(ingredientName, 0);
        console.log(dataJSON);
        createOrUpdateFile();
    });
}

function locallyModifydataJSON(modifingElementName, modifingElementQuantity){
    switch(tableType){
        case 'recipe':
            const indexToModify = dataJSON.ingredientsArray.indexOf(modifingElementName);
            if(modifingElementQuantity === 0){
                dataJSON.ingredientsArray.splice(indexToModify, 1);
                dataJSON.quantitiesArray.splice(indexToModify, 1);   
            }
            else{
                dataJSON.quantitiesArray[indexToModify] = modifingElementQuantity;
            }
            break;
        default:
            console.log('[locallyModifydataJSON] -> Invalid table type: ' + tableType);
    }
}

async function createOrUpdateFile(){
    switch(tableType){
        case 'recipe':
        case 'dailyPlan':
            await ipcRenderer.invoke('update-or-create-file', dataJSON, tableType);
            break;
        default:
            console.log('[createOrUpdateRecipe] -> Invalid table type: ' + tableType);
    }
}