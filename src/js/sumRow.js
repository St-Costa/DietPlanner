
let dynamicTable = null;

module.exports = {
    sumRowSetTable : function setTable(tableHTML){
        dynamicTable = tableHTML;
    },
    addSumRow : function addSumRow(emptyTdNumber){
        const newRow = document.createElement('tr');
        newRow.classList.add('sum-row');
    
        // Add empty td
        let emptyTd = '';
        for (let i = 0; i < emptyTdNumber; i++) {
            emptyTd += '<td></td>';
        }
        newRow.innerHTML = emptyTd;

        // Add the sum row
        newRow.innerHTML += `
            <td class="center sumRow" id="totKcal"></td>
            <td class="center sumRow" id="totProtein"></td>
            <td class="center sumRow" id="totFiber"></td>
            <td class="center sumRow" id="totFat"></td>
            <td class="center sumRow" id="totSat"></td>
            <td class="center sumRow" id="totCarb"></td>
            <td class="center sumRow" id="totSugar"></td>
            <td class="center sumRow" id="totSalt"></td>
            <td class="center sumRow" id="totChol"></td>
            <td class="center sumRow" id="totCost"></td>
            <td></td>
        `;
        return newRow;
    },
    updateSumRow : function updateSumRow(){
        const sumRow = dynamicTable.querySelector('.sum-row');
    
        let sumKcal     = 0;
        let sumProtein  = 0;
        let sumFiber    = 0;
        let sumFat      = 0;
        let sumSat      = 0;
        let sumCarb     = 0;
        let sumSugar    = 0;
        let sumSalt     = 0;
        let sumChol     = 0;
        let sumCost     = 0;
    
        for (let i = 0; i < dynamicTable.children.length; i++) {
            const row = dynamicTable.children[i];
            if (row.classList.contains('element-row')) {
                sumKcal     += parseInt(row.querySelector('#elementKcal').textContent);
                sumProtein  += parseInt(row.querySelector('#elementProtein').textContent);
                sumFiber    += parseInt(row.querySelector('#elementFiber').textContent);
                sumFat      += parseInt(row.querySelector('#elementFat').textContent);
                sumSat      += parseInt(row.querySelector('#elementSat').textContent);
                sumCarb     += parseInt(row.querySelector('#elementCarb').textContent);
                sumSugar    += parseInt(row.querySelector('#elementSugar').textContent);
                sumSalt     += parseFloat(row.querySelector('#elementSalt').textContent);
                sumChol     += parseInt(row.querySelector('#elementChol').textContent);
                sumCost     += parseFloat(row.querySelector('#elementCost').textContent);
            }
        }
    
        sumRow.querySelector('#totKcal').textContent    = isNaN(sumKcal)            ? "-" : sumKcal;
        sumRow.querySelector('#totProtein').textContent = isNaN(sumProtein)         ? "-" : sumProtein;
        sumRow.querySelector('#totFiber').textContent   = isNaN(sumFiber)           ? "-" : sumFiber;
        sumRow.querySelector('#totFat').textContent     = isNaN(sumFat)             ? "-" : sumFat;
        sumRow.querySelector('#totSat').textContent     = isNaN(sumSat)             ? "-" : sumSat;
        sumRow.querySelector('#totCarb').textContent    = isNaN(sumCarb)            ? "-" : sumCarb;
        sumRow.querySelector('#totSugar').textContent   = isNaN(sumSugar)           ? "-" : sumSugar;
        sumRow.querySelector('#totSalt').textContent    = isNaN(sumSalt.toFixed(2)) ? "-" : sumSalt.toFixed(2);
        sumRow.querySelector('#totChol').textContent    = isNaN(sumChol)            ? "-" : sumChol;
        sumRow.querySelector('#totCost').textContent    = isNaN(sumCost.toFixed(2)) ? "-" : sumCost.toFixed(2);
    }
}
