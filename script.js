class CarQuiz {
    constructor() {
        this.cars = [];
        this.chosenCars = [];
        this.battles = []; // Array per tenere traccia di tutte le sfide
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
                    this.cars = results.data
                        .filter(car => car.name) // Filtra eventuali righe vuote
                        .sort(() => 0.5 - Math.random()); // Mischia le auto
                    this.startQuiz();
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

    startQuiz() {
        this.currentOptions = this.cars.slice(0, 2);
        this.remainingCars = this.cars.slice(2);
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
            acceleration_0_100: v => `${v}s 0-100 km/h`,
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
        // Registra la sfida corrente
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