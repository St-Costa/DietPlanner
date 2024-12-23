const { ipcRenderer } = require('electron');

const ingredientTable = document.getElementById('ingredientTable').getElementsByTagName('tbody')[0];
const ingredientHeader = document.getElementById('ingredientHeader');
const typeHeader = document.getElementById('typeHeader');
const kcalHeader = document.getElementById('kcalHeader');
const proteinHeader = document.getElementById('protHeader');
const fiberHeader = document.getElementById('fiberHeader');
const fatHeader = document.getElementById('fatHeader');
const saturatedHeader = document.getElementById('satfatHeader');
const carbHeader = document.getElementById('carbHeader');
const sugarHeader = document.getElementById('sugarHeader');
const saltHeader = document.getElementById('saltHeader');
const cholHeader = document.getElementById('cholHeader');
const costHeader = document.getElementById('costHeader');
const typeFilterContainer = document.getElementById('typeFilterContainer');

let ingredients = [];
let sortOrder = 'asc'; // Initial sort order
let currentSortColumn = 'name'; // Initial sort column

// Request ingredient list
ipcRenderer.send('get-ingredient-list');

// Request ingredient types
ipcRenderer.send('get-ingredient-types');

ipcRenderer.on('ingredient-list-response', (event, ingredientData) => {
    ingredients = ingredientData;
    renderTable(ingredients);
});

ipcRenderer.on('ingredient-types-response', (event, types) => {
    renderTypeButtons(types);
});

ingredientHeader.addEventListener('click', () => {
    currentSortColumn = 'name';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

typeHeader.addEventListener('click', () => {
    currentSortColumn = 'type';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

kcalHeader.addEventListener('click', () => {
    currentSortColumn = 'kcal';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

proteinHeader.addEventListener('click', () => {
    currentSortColumn = 'protein';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

fiberHeader.addEventListener('click', () => {
    currentSortColumn = 'fiber';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

fatHeader.addEventListener('click', () => {
    currentSortColumn = 'fat';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

saturatedHeader.addEventListener('click', () => {
    currentSortColumn = 'saturated';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

carbHeader.addEventListener('click', () => {
    currentSortColumn = 'carb';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

sugarHeader.addEventListener('click', () => {
    currentSortColumn = 'sugar';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

saltHeader.addEventListener('click', () => {
    currentSortColumn = 'salt';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

cholHeader.addEventListener('click', () => {
    currentSortColumn = 'chol';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

costHeader.addEventListener('click', () => {
    currentSortColumn = 'cost';
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortAndRenderTable();
});

function renderTypeButtons(types) {
    types.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type;
        button.addEventListener('click', () => filterByType(type));
        typeFilterContainer.appendChild(button);
    });
}

function filterByType(type) {
    const filteredIngredients = ingredients.filter(ingredient => ingredient.type === type);
    renderTable(filteredIngredients);
}

function sortAndRenderTable() {
    const sortedIngredients = ingredients.sort((a, b) => {
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