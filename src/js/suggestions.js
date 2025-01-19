const { ipcRenderer } = require('electron');

module.exports = {
    showSuggestions: async function showSuggestions(suggestionType, suggestionBox, inputElement, targetWindowId) {
        let suggestions = [];

        let getFilesResult = {};

        try {

            // Find all names of the files in the directory
            switch (suggestionType) {
                case 'ingredient':
                    getFilesResult = await ipcRenderer.invoke('get-ingredient-names'); 
                    break;
                case 'type':
                    getFilesResult  = await ipcRenderer.invoke('get-ingredient-types'); 
                    break;
                case 'recipe':
                    getFilesResult = await ipcRenderer.invoke('get-recipe-names');
                    break;
                case 'dailyPlan':
                    getFilesResult = await ipcRenderer.invoke('get-dailyPlan-names');
                    break;
                default:
                    console.log('[showSuggestions] -> Invalid suggestion type: ' + suggestionType);
            }
            
        }
        catch(err){
            console.error("[showSuggestions] -> Error while getting suggestions: ", err);
            throw err;
        }

        // Filter suggestions based on user input
        const input = inputElement.value.toLowerCase();
        suggestions = getFilesResult.filter(name => name.toLowerCase().includes(input));
        

        // Show suggestions
        suggestionBox.innerHTML     = '';
        suggestionBox.style.display = 'block';
        currentFocus                = -1;

        suggestions.forEach(suggestion => {

            // HTMl stuff to show the suggestions
            const divSuggestion         = document.createElement('div');
            divSuggestion.style.width   = inputElement.offsetWidth + 'px !important';
            divSuggestion.textContent   = suggestion;
            
            
            divSuggestion.addEventListener('click', async function () {
                inputElement.value = suggestion;
                suggestionBox.innerHTML = '';

                let readFileResult = {};
                let readResultJSON = {};
                let itemDataJSON = {};

                try{
                    // Read the file content
                    switch (suggestionType) {
                        case 'ingredient':
                            // Request file content
                            readFileResult = await ipcRenderer.invoke('read-ingredient-file', suggestion);
                            break;
                        case 'type':
                            //console.log("Type suggestion clicked: no need to do anything");
                            break;
                        case 'recipe':
                            // Request file content
                            readFileResult = await ipcRenderer.invoke('read-recipe-file', suggestion);
                            break;
                        case 'dailyPlan':
                            // Request file content
                            readFileResult = await ipcRenderer.invoke('read-dailyPlan-file', suggestion);
                            break;
                        default:
                            console.log('[showSuggestions] -> Invalid suggestion type: ' + suggestionType);
                    }      
                    ipcRenderer.send('suggestion-clicked', {readFileResult, suggestionType, targetWindowId});                    
                }
                catch(err){
                    console.error("[showSuggestions] -> Error while reading file: ", err);
                    throw err;
                }
                
            });
            suggestionBox.appendChild(divSuggestion);
        });
        const rect = inputElement.getBoundingClientRect();
        //suggestionBox.style.left = `${rect.left}px`;
        //suggestionBox.style.top = `${rect.bottom}px`;
        suggestionBox.style.width = `${rect.width}px`;
    },

    // Navigate the suggestions with arrows and select with Enter
    navigateSuggestions: function navigateSuggestions(e, suggestionBox) {
        const suggestionItems = suggestionBox.getElementsByTagName('div');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(suggestionItems, suggestionBox);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(suggestionItems, suggestionBox);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                if (suggestionItems) suggestionItems[currentFocus].click();
            }
        }
    }

}


// Remove 'autocomplete-active' class from all items in the list
function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('autocomplete-active');
    }
}

// Adds 'autocomplete-active' class to the currently focused item in the list and adjusts the scroll position
function addActive(items, suggestionBox) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add('autocomplete-active');
    adjustScroll(items[currentFocus], suggestionBox);
}

// Adjusts the scroll position of the suggestion box to keep the active item in view
function adjustScroll(activeItem, suggestionBox) {
    const itemOffsetTop = activeItem.offsetTop;
    const itemHeight = activeItem.offsetHeight;
    const boxHeight = suggestionBox.clientHeight;
    const scrollTop = suggestionBox.scrollTop;

    if (itemOffsetTop < scrollTop) {
        suggestionBox.scrollTop = itemOffsetTop;
    } else if (itemOffsetTop + itemHeight > scrollTop + boxHeight) {
        suggestionBox.scrollTop = itemOffsetTop + itemHeight - boxHeight;
    }
}