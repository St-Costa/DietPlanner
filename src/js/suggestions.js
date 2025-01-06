const { ipcRenderer } = require('electron');

module.exports = {
    showSuggestions: async function showSuggestions(suggestionType, suggestionBox, inputElement, targetWindowId) {
        let suggestions = [];
        let allFiles = [];

        // Compute suggestions
        switch (suggestionType) {
            case 'ingredient':
                allFiles = await ipcRenderer.invoke('get-ingredient-names');
                break;
            case 'type':
                allFiles = await ipcRenderer.invoke('get-ingredient-types');
                break;
            default:
                console.log('Invalid suggestion type: ' + suggestionType);
        }

        if(allFiles.length === 0) return;
        
        const input = inputElement.value.toLowerCase();
        suggestions = allFiles.filter(name => name.toLowerCase().includes(input));

        // Show suggestions
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'block';
        currentFocus = -1;

        suggestions.forEach(suggestion => {
            const divSuggestion = document.createElement('div');
            divSuggestion.textContent = suggestion;
            
            
            divSuggestion.addEventListener('click', async function () {
                inputElement.value = suggestion;
                suggestionBox.innerHTML = '';

                let itemData = {};

                switch (suggestionType) {
                    case 'ingredient':
                        // Request file content
                        itemData = await ipcRenderer.invoke('read-ingredient-file', suggestion);
                        ipcRenderer.send('suggestion-clicked', {itemData, suggestionType, targetWindowId});
                        break;
                    case 'type':
                        //console.log("Type suggestion clicked: no need to do anything");
                        break;
                    default:
                        console.log('Invalid suggestion type: ' + suggestionType);
                }
                
            });
            suggestionBox.appendChild(divSuggestion);

        });
    },


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