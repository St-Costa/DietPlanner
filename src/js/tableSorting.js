module.exports = {
    sortTable: function sortTable(table, n) {
        var rows, i, x, y, count = 0;
        var switching = true;
    
        var direction = "ascending";
    
        // Run loop until no switching is needed
        while (switching) {
            switching = false;
            var rows = table.rows;
    
            // Loop to go through all rows
            for (i = 0; i < (rows.length - 1); i++) {
                var Switch = false;
    
                // Fetch 2 elements that need to be compared
                x = rows[i].getElementsByTagName("TD")[n];
                y = rows[i + 1].getElementsByTagName("TD")[n];
    
                // Check the direction of order
                if (direction == "ascending") {
                    // Check if 2 rows need to be switched
                    if (isNaN(parseFloat(x.innerHTML))) {
                        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                            // If yes, mark Switch as needed and break loop
                            Switch = true;
                            break;
                        }
                    } else {
                        if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
                            // If yes, mark Switch as needed and break loop
                            Switch = true;
                            break;
                        }
                    }
                } else if (direction == "descending") {
                    // Check direction
                    if (isNaN(parseFloat(x.innerHTML))) {
                        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                            // If yes, mark Switch as needed and break loop
                            Switch = true;
                            break;
                        }
                    } else {
                        if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
                            // If yes, mark Switch as needed and break loop
                            Switch = true;
                            break;
                        }
                    }
                }
            }
            if (Switch) {
                // Function to switch rows and mark switch as completed
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
    
                // Increase count for each switch
                count++;
            } else {
                // Run while loop again for descending order
                if (count == 0 && direction == "ascending") {
                    direction = "descending";
                    switching = true;
                }
            }
        }
    }
    
}

