const { ipcRenderer }   = require('electron');
const { sortTable }     = require('./tableSorting');
const { renderTable }   = require('./recipeAndPlanList');


// recipe Table
const recipeTable   = document.getElementById('recipeTable').getElementsByTagName('tbody')[0];

// Message box
const messageBoxDiv = document.getElementById('messageBox');

// Add event listeners for sorting
document.getElementById('nameHeader').addEventListener('click',         function() { sortTable(recipeTable, 0);  });
document.getElementById('kcalHeader').addEventListener('click',         function() { sortTable(recipeTable, 1);  });
document.getElementById('proteinHeader').addEventListener('click',      function() { sortTable(recipeTable, 2);  });
document.getElementById('fiberHeader').addEventListener('click',        function() { sortTable(recipeTable, 3);  });
document.getElementById('fatHeader').addEventListener('click',          function() { sortTable(recipeTable, 4);  });
document.getElementById('saturatedHeader').addEventListener('click',    function() { sortTable(recipeTable, 5);  });
document.getElementById('carbHeader').addEventListener('click',         function() { sortTable(recipeTable, 6);  });
document.getElementById('sugarHeader').addEventListener('click',        function() { sortTable(recipeTable, 7);  });
document.getElementById('saltHeader').addEventListener('click',         function() { sortTable(recipeTable, 8);  });
document.getElementById('cholHeader').addEventListener('click',         function() { sortTable(recipeTable, 9);  });
document.getElementById('costHeader').addEventListener('click',         function() { sortTable(recipeTable, 10); });

// Add recipe button
const addRecipeBtn = document.getElementById('to_addRecipePage');
addRecipeBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-add-recipe-window');
});

// Refresh the list when a recipe is created/deleted in another page
ipcRenderer.on('refresh', (event, args) => {
    console.log("Refreshing because:", args);
    renderTable('recipeList', recipeTable, messageBoxDiv)
});


// On opening of view, fetch and render recipes
document.addEventListener('DOMContentLoaded', renderTable('recipeList', recipeTable, messageBoxDiv));