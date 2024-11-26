class CarQuiz {
    constructor() {
        this.cars = [];
        this.filteredCars = [];
        this.chosenCars = [];
        this.battles = [];
        this.optionsArea = document.getElementById('options');
        this.questionArea = document.getElementById('quiz-question');
        this.resultArea = document.getElementById('result');
        this.loadCarsData();
    }

    async loadCarsData() {
        try {
            console.log('Tentativo di lettura del file CSV...');
            const response = await fetch('cars_database.csv');
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            console.log('Contenuto CSV:', csvText.substring(0, 200) + '...');
            
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    this.cars = results.data.filter(car => car.name);
                    this.showFilters();
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                    this.showError('Errore nel parsing del file CSV');
                }
            });
        } catch (error) {
            console.error('Error loading cars data:', error);
            this.showError('Errore nel caricamento dei dati delle auto');
        }
    }

    generateYearOptions(minYear, maxYear) {
        let options = [];
        for (let year = minYear; year <= maxYear; year++) {
            options.push(`<option value="${year}">${year}</option>`);
        }
        return options.join('');
    }

    showFilters() {
        // Trova i valori min e max per prezzo, anno e potenza
        const prices = this.cars.map(car => car.current_price_euro).filter(Boolean);
        const years = this.cars.map(car => car.year).filter(Boolean);
        const powers = this.cars.map(car => car.power_hp).filter(Boolean);
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const minPower = Math.min(...powers);
        const maxPower = Math.max(...powers);

        // Raccoglie tutti i tipi di trazione unici
        const driveTypes = [...new Set(this.cars.map(car => car.drive).filter(Boolean))];

        this.optionsArea.innerHTML = `
            <div class="filters-container">
                <h2>Personalizza il tuo quiz</h2>
                
                <div class="filters-grid">
                    <div class="filter-group">
                        <label>Prezzo (in €)</label>
                        <div class="range-inputs">
                            <input type="number" id="minPrice" 
                                value="${minPrice}" min="${minPrice}" max="${maxPrice}" 
                                step="1000" class="filter-input">
                            <span>a</span>
                            <input type="number" id="maxPrice" 
                                value="${maxPrice}" min="${minPrice}" max="${maxPrice}" 
                                step="1000" class="filter-input">
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>Anno</label>
                        <div class="range-inputs">
                            <select id="minYear" class="year-select">
                                ${this.generateYearOptions(minYear, maxYear)}
                            </select>
                            <span>a</span>
                            <select id="maxYear" class="year-select">
                                ${this.generateYearOptions(minYear, maxYear)}
                            </select>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label>Potenza (CV)</label>
                        <div class="range-inputs">
                            <input type="number" id="minPower" 
                                value="${minPower}" min="${minPower}" max="${maxPower}" 
                                step="10" class="filter-input">
                            <span>a</span>
                            <input type="number" id="maxPower" 
                                value="${maxPower}" min="${minPower}" max="${maxPower}" 
                                step="10" class="filter-input">
                        </div>
                    </div>

                    <div class="filter-group drive-type-group">
                        <label>Trazione</label>
                        <div class="checkbox-group">
                            ${driveTypes.map(type => `
                                <label class="checkbox-label">
                                    <input type="checkbox" name="driveType" 
                                        value="${type}" checked>
                                    <span class="checkbox-text">${this.getDriveTypeLabel(type)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <button id="startQuiz" class="start-quiz-btn">Inizia il Quiz</button>
            </div>
        `;

        // Imposta i valori di default per le select degli anni
        document.getElementById('minYear').value = minYear;
        document.getElementById('maxYear').value = maxYear;

        // Aggiungi event listener per validazione anni
        document.getElementById('minYear').addEventListener('change', (e) => {
            const maxYearSelect = document.getElementById('maxYear');
            if (Number(e.target.value) > Number(maxYearSelect.value)) {
                maxYearSelect.value = e.target.value;
            }
        });

        document.getElementById('maxYear').addEventListener('change', (e) => {
            const minYearSelect = document.getElementById('minYear');
            if (Number(e.target.value) < Number(minYearSelect.value)) {
                minYearSelect.value = e.target.value;
            }
        });

        // Aggiungi gli event listener per il pulsante di start
        document.getElementById('startQuiz').addEventListener('click', () => {
            const minPrice = Number(document.getElementById('minPrice').value);
            const maxPrice = Number(document.getElementById('maxPrice').value);
            const minYear = Number(document.getElementById('minYear').value);
            const maxYear = Number(document.getElementById('maxYear').value);
            const minPower = Number(document.getElementById('minPower').value);
            const maxPower = Number(document.getElementById('maxPower').value);
            
            // Raccogli le trazioni selezionate
            const selectedDriveTypes = Array.from(
                document.querySelectorAll('input[name="driveType"]:checked')
            ).map(checkbox => checkbox.value);

            if (selectedDriveTypes.length === 0) {
                alert('Seleziona almeno un tipo di trazione.');
                return;
            }

            this.filteredCars = this.cars.filter(car => 
                car.current_price_euro >= minPrice &&
                car.current_price_euro <= maxPrice &&
                car.year >= minYear &&
                car.year <= maxYear &&
                car.power_hp >= minPower &&
                car.power_hp <= maxPower &&
                selectedDriveTypes.includes(car.drive)
            );

            if (this.filteredCars.length < 2) {
                alert('Non ci sono abbastanza auto che corrispondono ai criteri selezionati. Prova ad allargare i filtri.');
                return;
            }

            // Mischia le auto filtrate
            this.filteredCars.sort(() => 0.5 - Math.random());
            this.startQuiz();
        });

        // Aggiungi la validazione degli input numerici
        const numericInputs = document.querySelectorAll('.filter-input');
        numericInputs.forEach(input => {
            input.addEventListener('change', () => {
                const value = Number(input.value);
                const min = Number(input.min);
                const max = Number(input.max);
                if (value < min) input.value = min;
                if (value > max) input.value = max;
            });
        });
    }

    getDriveTypeLabel(type) {
        const labels = {
            'FWD': 'Trazione Anteriore (FWD)',
            'RWD': 'Trazione Posteriore (RWD)',
            'AWD': 'Trazione Integrale (AWD)'
        };
        return labels[type] || type;
    }

    startQuiz() {
        this.currentOptions = this.filteredCars.slice(0, 2);
        this.remainingCars = this.filteredCars.slice(2);
        this.renderOptions();
    }

    formatValue(key, value) {
        const formatters = {
            power_hp: v => `${v} CV`,
            torque_nm: v => `${v} Nm`,
            displacement_cc: v => `${(v/1000).toFixed(1)}L`,
            drive: v => `${v}`,
            cylinders: v => `${v} cilindri`,
            max_speed_kmh: v => `${v} km/h`,
            acceleration_0_100: v => `0-100 km/h in ${v}s`,
            weight_kg: v => `${v} kg`,
            production_units: v => `${v.toLocaleString()} unità prodotte`,
            current_price_euro: v => `€${(v/1000).toFixed(0)}k`
        };
        return formatters[key] ? formatters[key](value) : value;
    }

    renderOptions() {
        this.optionsArea.innerHTML = '';

        if (this.currentOptions.length === 0) {
            this.showResult();
            return;
        }

        this.currentOptions.forEach(car => {
            const button = document.createElement('button');
            button.classList.add('quiz-btn');
            
            // Immagine
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('car-image');
            const image = document.createElement('img');
            image.src = car.image;
            image.alt = car.name;
            imageContainer.appendChild(image);
            
            // Nome e Anno
            const nameElement = document.createElement('div');
            nameElement.classList.add('car-name');
            nameElement.textContent = `${car.name} (${car.year})`;

            button.appendChild(imageContainer);
            button.appendChild(nameElement);
            
            // Specifiche tecniche
            const specsContainer = document.createElement('div');
            specsContainer.classList.add('car-specs');
            
            // Specifica quali campi mostrare e in che ordine
            const specsToShow = [
                { key: 'engine_type', label: 'Motore' },
                { key: 'displacement_cc', label: 'Cilindrata' },
                { key: 'drive', label: 'Trazione' },
                { key: 'power_hp', label: 'Potenza' },
                { key: 'torque_nm', label: 'Coppia' },
                { key: 'cylinders', label: 'Cilindri' },
                { key: 'max_speed_kmh', label: 'Velocità max' },
                { key: 'acceleration_0_100', label: 'Accelerazione' },
                { key: 'weight_kg', label: 'Peso' },
                { key: 'production_units', label: 'Produzione' },
                { key: 'current_price_euro', label: 'Valore attuale' }
            ];

            specsToShow.forEach(spec => {
                if (car[spec.key]) {
                    const specElement = document.createElement('div');
                    specElement.classList.add('car-spec-item');
                    specElement.innerHTML = `
                        <span class="car-spec-label">${spec.label}:</span> 
                        ${this.formatValue(spec.key, car[spec.key])}
                    `;
                    specsContainer.appendChild(specElement);
                }
            });

            // Descrizione
            if (car.description) {
                const descElement = document.createElement('div');
                descElement.classList.add('car-spec-item', 'car-description');
                descElement.innerHTML = `<span class="car-spec-label">Info:</span> ${car.description}`;
                specsContainer.appendChild(descElement);
            }
            
            button.appendChild(specsContainer);
            button.addEventListener('click', () => this.selectCar(car));
            this.optionsArea.appendChild(button);
        });


    }

    selectCar(selectedCar) {
        this.battles.push({
            car1: this.currentOptions[0],
            car2: this.currentOptions[1],
            winner: selectedCar
        });
        
        this.chosenCars.push(selectedCar);
        const remainingAvailableCars = this.remainingCars.filter(car => 
            car !== selectedCar && !this.chosenCars.includes(car)
        );

        if (remainingAvailableCars.length > 0) {
            const nextCar = remainingAvailableCars[0];
            this.currentOptions = [selectedCar, nextCar];
            this.remainingCars = remainingAvailableCars.slice(1);
            this.renderOptions();
        } else {
            this.currentOptions = [];
            this.renderOptions();
        }
    }

    showError(message) {
        this.optionsArea.innerHTML = `
            <div class="error-message">
                ${message}<br>
                <button onclick="location.reload()">Riprova</button>
            </div>
        `;
    }

    showResult() {
        this.optionsArea.innerHTML = '';
        this.questionArea.textContent = 'Quiz Completato!';
        
        const resultText = document.createElement('p');
        resultText.innerHTML = `
            <strong>La tua cronologia di scelte:</strong>
        `;
        this.resultArea.innerHTML = ''; // Pulisce eventuali risultati precedenti
        this.resultArea.appendChild(resultText);

        const battlesList = document.createElement('div');
        battlesList.classList.add('battles-list');
        
        this.battles.forEach((battle, index) => {
            const battleItem = document.createElement('div');
            battleItem.classList.add('battle-item');
            
            // Crea il testo della sfida con il vincitore in grassetto
            const car1Text = battle.car1.name === battle.winner.name ? 
                `<strong>${battle.car1.name}</strong>` : battle.car1.name;
            const car2Text = battle.car2.name === battle.winner.name ? 
                `<strong>${battle.car2.name}</strong>` : battle.car2.name;
            
            battleItem.innerHTML = `${car1Text} vs ${car2Text}`;
            
            battlesList.appendChild(battleItem);
        });
        
        this.resultArea.appendChild(battlesList);
    }
}

// Inizializzazione del quiz quando il DOM è completamente caricato
document.addEventListener('DOMContentLoaded', () => {
    new CarQuiz();
});