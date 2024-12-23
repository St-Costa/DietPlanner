const { ipcRenderer } = require('electron');

const ingredientTable = document.getElementById('ingredientTable').getElementsByTagName('tbody')[0];
const typeFilterContainer = document.getElementById('typeFilterContainer');
const headers = document.querySelectorAll('th');

let ingredients = [];
let filteredIngredients = [];
let sortOrder = 'asc'; // Initial sort order
let currentSortColumn = 'name'; // Initial sort column
let currentFilterType = ''; // Initial filter type

const addIngredientBtn = document.getElementById('to_addIngredientPage');

addIngredientBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-ingredient-window');
});

// Request ingredient list
ipcRenderer.send('get-ingredient-list');

// Request ingredient types
ipcRenderer.send('get-ingredient-types');

ipcRenderer.on('ingredient-list-response', (event, ingredientData) => {
    ingredients = ingredientData;
    filteredIngredients = ingredientData;
    renderTable(filteredIngredients);
});

ipcRenderer.on('ingredient-types-response', (event, types) => {
    renderTypeButtons(types);
});

// Listen for the refresh-ingredient-list message
ipcRenderer.on('refresh-ingredient-list', () => {
    console.log("Refreshing ingredients");
    ipcRenderer.send('get-ingredient-list');
});

function renderTypeButtons(types) {
    // Add "All types" button
    const allButton = document.createElement('button');
    allButton.textContent = 'All types';
    allButton.addEventListener('click', () => {
        currentFilterType = '';
        filterAndRenderTable();
    });
    typeFilterContainer.appendChild(allButton);

    // Add buttons for each type
    types.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type;
        button.addEventListener('click', () => {
            currentFilterType = type;
            filterAndRenderTable();
        });
        typeFilterContainer.appendChild(button);
    });
}

function filterAndRenderTable() {
    if (currentFilterType) {
        filteredIngredients = ingredients.filter(ingredient => ingredient.type === currentFilterType);
    } else {
        filteredIngredients = ingredients;
    }
    sortAndRenderTable();
}

headers.forEach(header => {
    header.addEventListener('click', () => {
        const column = header.id.replace('Header', '').toLowerCase();
        currentSortColumn = column;
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        sortAndRenderTable();
    });
});

function sortAndRenderTable() {
    const sortedIngredients = filteredIngredients.sort((a, b) => {
        const valA = isNaN(a[currentSortColumn]) ? a[currentSortColumn] : Number(a[currentSortColumn]);
        const valB = isNaN(b[currentSortColumn]) ? b[currentSortColumn] : Number(b[currentSortColumn]);

        if (typeof valA === 'string' && typeof valB === 'string') {
            if (valA.toLowerCase() < valB.toLowerCase()) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (valA.toLowerCase() > valB.toLowerCase()) {
                return sortOrder === 'asc' ? 1 : -1;
            }
        } else if (!isNaN(valA) && !isNaN(valB)) {
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
    });
    renderTable(sortedIngredients);
}

function renderTable(data) {
    ingredientTable.innerHTML = '';
    data.forEach(ingredient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ingredient.name}</td>
            <td class="center">${ingredient.type}</td>
            <td class="center">${ingredient.kcal}</td>
            <td class="center">${ingredient.protein}</td>
            <td class="center">${ingredient.fiber}</td>
            <td class="center">${ingredient.fat}</td>
            <td class="center">${ingredient.saturated}</td>
            <td class="center">${ingredient.carb}</td>
            <td class="center">${ingredient.sugar}</td>
            <td class="center">${ingredient.salt}</td>
            <td class="center">${ingredient.chol}</td>
            <td class="center">${ingredient.cost}</td>
            <td class="center">${ingredient.unitWeight}</td>
            <td class="center">${ingredient.unitName}</td>
        `;
        ingredientTable.appendChild(row);
    });
}