const { ipcRenderer } = require('electron');

const ingredientTable = document.getElementById('ingredientTable').getElementsByTagName('tbody')[0];

// Request ingredient list
ipcRenderer.send('get-ingredient-list');

ipcRenderer.on('ingredient-list-response', (event, ingredients) => {
    ingredients.forEach(ingredient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ingredient.name}</td>
            <td class="center">${ingredient.type}</td>
            <td class="number">${ingredient.kcal}</td>
            <td class="number">${ingredient.protein}</td>
            <td class="number">${ingredient.fiber}</td>
            <td class="number">${ingredient.fat}</td>
            <td class="number">${ingredient.saturated}</td>
            <td class="number">${ingredient.carb}</td>
            <td class="number">${ingredient.sugar}</td>
            <td class="number">${ingredient.salt}</td>
            <td class="number">${ingredient.chol}</td>
            <td class="number">${ingredient.cost}</td>
            <td class="center">${ingredient.unitWeight}</td>
            <td class="center">${ingredient.unitName}</td>
        `;
        ingredientTable.appendChild(row);
    });
});