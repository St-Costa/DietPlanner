const { ipcRenderer }   = require('electron');
const { sortTable }     = require('./tableSorting');
const { errorHandling } = require('./messageBoxUpdate');
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


// On opening of view, fetch and render recipes
document.addEventListener('DOMContentLoaded', renderTableAndHandleErrors);

async function renderTableAndHandleErrors() {
    try {
        await renderTable('recipeList', recipeTable, messageBoxDiv);
    }
    catch(err){
        console.error("[renderTable] -> ", err);
        errorHandling(messageBoxDiv, false, "Failed to render the table!");
        throw err;
    }
}