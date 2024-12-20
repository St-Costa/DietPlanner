function creaRicetta() {
    const ingredientiSelezionati = document.getElementById('ingredienti').selectedOptions;
    const nomeRicetta = document.getElementById('nomeRicetta').value;

    // Estrai gli ingredienti selezionati
    let ingredienti = [];
    for (let i = 0; i < ingredientiSelezionati.length; i++) {
        ingredienti.push(ingredientiSelezionati[i].value);
    }

    // Mostra la ricetta
    const ricettaDiv = document.getElementById('ricettaCreata');
    ricettaDiv.innerHTML = `
        <h2>Ricetta: ${nomeRicetta}</h2>
        <h3>Ingredienti:</h3>
        <ul>
            ${ingredienti.map(ingrediente => `<li>${ingrediente}</li>`).join('')}
        </ul>
    `;
}
