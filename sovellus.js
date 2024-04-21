const teatteriValinta = document.getElementById('teatteriValinta');
const hakuSyote = document.getElementById('hakuSyote');
const elokuvaTiedot = document.getElementById('elokuvaTiedot');

// Haetaan teatterilista Finnkino API:sta
fetch('http://www.finnkino.fi/xml/TheatreAreas/')
    .then(vastaus => vastaus.text())
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
        // Täytetään valintaelementti teatterilistalla
        const teatterit = data.getElementsByTagName('TheatreArea');
        for (let i = 0; i < teatterit.length; i++) {
            const vaihtoehto = document.createElement('option');
            vaihtoehto.value = teatterit[i].getElementsByTagName('ID')[0].textContent;
            vaihtoehto.text = teatterit[i].getElementsByTagName('Name')[0].textContent;
            teatteriValinta.add(vaihtoehto);
        }
    });

// Lisätään tapahtumakuuntelijat valinta- ja syöttöelementeille
teatteriValinta.addEventListener('change', haeJaNaytaElokuvat);
hakuSyote.addEventListener('input', haeJaNaytaElokuvat);

function haeJaNaytaElokuvat() {
    // Luodaan uusi XMLHttpRequest-olio
    var xhr = new XMLHttpRequest();

    // Määritetään se: GET-pyyntö URL-osoitteeseen /article/.../load
    xhr.open('GET', `http://www.finnkino.fi/xml/Schedule/?area=${teatteriValinta.value}&dt=${new Date().toISOString().split('T')[0]}`);

    // Lähetetään pyyntö verkon yli
    xhr.send();

    // Tätä kutsutaan vastauksen saapumisen jälkeen
    xhr.onload = function() {
        if (xhr.status != 200) { // analysoidaan HTTP-vastauksen tila
            alert(`Virhe ${xhr.status}: ${xhr.statusText}`); // esim. 404: Not Found
        } else { // näytetään tulos
            const data = (new window.DOMParser()).parseFromString(xhr.response, "text/xml");
            // Suodatetaan ja näytetään elokuvat hakusyötteen perusteella
            const naytokset = data.getElementsByTagName('Show');
            elokuvaTiedot.innerHTML = '';
            let elokuvaKartta = new Map();
            for (let i = 0; i < naytokset.length; i++) {
                const otsikko = naytokset[i].getElementsByTagName('Title')[0].textContent;
                const kuvaUrl = naytokset[i].getElementsByTagName('EventSmallImagePortrait')[0].textContent;
                const naytosaika = new Date(naytokset[i].getElementsByTagName('dttmShowStart')[0].textContent).toLocaleTimeString();
                if (otsikko.toLowerCase().includes(hakuSyote.value.toLowerCase())) {
                    if (!elokuvaKartta.has(otsikko)) {
                        elokuvaKartta.set(otsikko, {kuvaUrl: kuvaUrl, naytosajat: [naytosaika]});
                    } else {
                        elokuvaKartta.get(otsikko).naytosajat.push(naytosaika);
                    }
                }
            }
            // Muunnetaan Map taulukoksi ja järjestetään se
            let elokuvaTaulukko = Array.from(elokuvaKartta.entries());
            elokuvaTaulukko.sort((a, b) => a[0].localeCompare(b[0]));
            elokuvaTaulukko.forEach(([avain, arvo]) => {
                const div = document.createElement('div');
                const kuva = document.createElement('img');
                kuva.src = arvo.kuvaUrl;
                div.appendChild(kuva);
                const p = document.createElement('p');
                p.textContent = avain;
                div.appendChild(p);
                const ul = document.createElement('ul');
                arvo.naytosajat.forEach(naytosaika => {
                    const li = document.createElement('li');
                    li.textContent = naytosaika;
                    ul.appendChild(li);
                });
                div.appendChild(ul);
                elokuvaTiedot.appendChild(div);
            });
        }
    };

    xhr.onerror = function() {
        alert("Pyyntö epäonnistui");
    };
}
