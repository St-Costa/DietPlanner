const { ipcRenderer } = require('electron');
const { sortTable } = require('./tableSorting');

const ingredientTable = document.getElementById('ingredientTable').getElementsByTagName('tbody')[0];
const typeFilterContainer = document.getElementById('typeFilterContainer');

// Add event listeners for sorting
document.getElementById('nameHeader').addEventListener('click', function() { sortTable(ingredientTable, 0); });
document.getElementById('typeHeader').addEventListener('click', function() { sortTable(ingredientTable,1); });
document.getElementById('kcalHeader').addEventListener('click', function() { sortTable(ingredientTable,2); });
document.getElementById('proteinHeader').addEventListener('click', function() { sortTable(ingredientTable, 3); });
document.getElementById('fiberHeader').addEventListener('click', function() { sortTable(ingredientTable, 4); });
document.getElementById('fatHeader').addEventListener('click', function() { sortTable(ingredientTable,5); });
document.getElementById('saturatedHeader').addEventListener('click', function() { sortTable(ingredientTable,6); });
document.getElementById('carbHeader').addEventListener('click', function() { sortTable(ingredientTable,7); });
document.getElementById('sugarHeader').addEventListener('click', function() { sortTable(ingredientTable,8); });
document.getElementById('saltHeader').addEventListener('click', function() { sortTable(ingredientTable,9); });
document.getElementById('cholHeader').addEventListener('click', function() { sortTable(ingredientTable,10); });
document.getElementById('costHeader').addEventListener('click', function() { sortTable(ingredientTable,11); });

// Open add ingredient page
const addIngredientBtn = document.getElementById('to_addIngredientPage');

// Open add ingredient window
addIngredientBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-ingredient-window');
});



// Listen for the refresh-ingredient-list message
ipcRenderer.on('refresh-ingredient-list', () => {
    console.log("Refreshing ingredients");
    fetchAndRenderIngredients();
});



// On opening of view, fetch and render recipes
document.addEventListener('DOMContentLoaded', fetchAndRenderIngredients);

async function fetchAndRenderIngredients() {
    try {
        // Render ingredients in table
        ipcRenderer.invoke('get-ingredient-names').then((ingredientData) => {
            // Read information from each recipe file
            ingredientData.forEach(ingredient => {
                ipcRenderer.invoke('read-ingredient-file', ingredient).then(async (ingredientData) => {
                    await renderTableRow(ingredientData);
                });
            });
        });

        // Render types in table
        ipcRenderer.invoke('get-ingredient-types').then((types) => {
            const allButton = document.createElement('button');
            allButton.textContent = 'All types';
            allButton.addEventListener('click', () => {
                filterByType("");
            });
            typeFilterContainer.appendChild(allButton);

            types.forEach(type => {
                const button = document.createElement('button');
                button.textContent = type;
                button.addEventListener('click', () => {
                    filterByType(type);
                });
                typeFilterContainer.appendChild(button);
            });
        });

    }
    catch (err) {
        console.error("Failed to fetch and render recipes:", err);
    }
}

async function renderTableRow(ingredientData) {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td class="left">${ingredientData.name}</td>
        <td>${ingredientData.type}</td>
        <td>${ingredientData.kcal}</td>
        <td>${ingredientData.protein}</td>
        <td>${ingredientData.fiber}</td>
        <td>${ingredientData.fat}</td>
        <td>${ingredientData.saturated}</td>
        <td>${ingredientData.carb}</td>
        <td>${ingredientData.sugar}</td>
        <td>${ingredientData.salt}</td>
        <td>${ingredientData.chol}</td>
        <td>${ingredientData.cost}</td>
        <td>${ingredientData.unitWeight}</td>
        <td>${ingredientData.unitName}</td>
    `;

    ingredientTable.appendChild(newRow);
}

async function filterByType(type) {
    const rows = ingredientTable.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const typeCell = rows[i].getElementsByTagName('td')[1];
        if (type === '' || typeCell.textContent === type) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}