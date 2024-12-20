// Select buttons in index.html
//const addIngredientButton = document.getElementById('button_addIngredient');

document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('addIngredientButton');

    if (addButton) {
        addButton.addEventListener('click', () => {
            console.log('Il pulsante è stato cliccato!');
        });
    } else {
        console.error('Pulsante con id "addIngredientButton" non trovato.');
    }
});


addIngredientButton.addEventListener('click', () => {
    // Open new window to add ingredient
    console.log('Sto cliccando un creando un ingrediente');
    ipcRenderer.send('open-ingredient-window');
});
