import requests
from bs4 import BeautifulSoup
import pandas as pd
from time import sleep
import random
import re
from datetime import datetime

class AutoScout24Scraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive'
        }
        self.base_url = "https://www.autoscout24.it"
        self.results = []

    def clean_price(self, price_text):
        """Pulisce e converte il prezzo da stringa a float"""
        if price_text:
            price = re.sub(r'[^\d]', '', price_text)
            try:
                return float(price)
            except ValueError:
                return None
        return None

    def clean_km(self, km_text):
        """Pulisce e converte il chilometraggio da stringa a int"""
        if km_text:
            km = re.sub(r'[^\d]', '', km_text)
            try:
                return int(km)
            except ValueError:
                return None
        return None

    def format_url(self, make, model, year=None):
        """
        Formatta l'URL secondo la struttura corretta di AutoScout24
        """
        # Sostituisce gli spazi con trattini e converte in minuscolo
        make = make.lower().replace(' ', '-')
        model = model.lower().replace(' ', '-')
        
        # Costruisce l'URL base
        url = f"{self.base_url}/lst/{make}/{model}"
        
        # Aggiunge l'anno se specificato
        if year:
            url += f"/re_{year}"
            
        return url

    def search_car(self, make, model, year=None):
        """
        Cerca un modello specifico su AutoScout24.it
        """
        try:
            search_url = self.format_url(make, model, year)
            print(f"Ricerca su URL: {search_url}")
            
            # Aggiunge un delay random
            sleep(random.uniform(2, 4))
            
            response = requests.get(search_url, headers=self.headers)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Trova tutti gli annunci nella pagina
            listings = soup.find_all('article', class_=lambda x: x and 'cldt-summary-full-item' in x)
            
            if not listings:
                print(f"Nessun annuncio trovato per {make} {model} {year if year else ''}")
                return
            
            car_data = []
            for listing in listings:
                try:
                    # Estrae il prezzo
                    price_element = listing.find('p', class_=lambda x: x and 'Price_price' in x)
                    if not price_element:
                        price_element = listing.find('span', class_=lambda x: x and 'price' in str(x).lower())
                    
                    price = self.clean_price(price_element.text if price_element else None)
                    
                    # Estrae il chilometraggio
                    details = listing.find_all(['span', 'p'], class_=lambda x: x and ('VehicleDetailTable' in str(x) or 'mileage' in str(x).lower()))
                    km = None
                    year_found = None
                    
                    for detail in details:
                        detail_text = detail.text.lower()
                        if 'km' in detail_text:
                            km = self.clean_km(detail_text)
                        elif re.search(r'\d{4}', detail_text):
                            year_match = re.search(r'\d{4}', detail_text)
                            year_found = year_match.group(0) if year_match else None
                    
                    if price:  # Salva solo se trova un prezzo valido
                        car_data.append({
                            'price': price,
                            'km': km,
                            'year': year_found
                        })
                        
                except Exception as e:
                    print(f"Errore nell'elaborazione di un annuncio: {str(e)}")
                    continue
            
            # Calcola le statistiche se ci sono dati
            if car_data:
                prices = [car['price'] for car in car_data if car['price']]
                kms = [car['km'] for car in car_data if car['km']]
                
                self.results.append({
                    'make': make.upper(),
                    'model': model.upper(),
                    'target_year': year,
                    'average_price': round(sum(prices) / len(prices), 2),
                    'min_price': min(prices),
                    'max_price': max(prices),
                    'average_km': round(sum(kms) / len(kms)) if kms else None,
                    'num_listings': len(car_data),
                    'search_date': datetime.now().strftime('%Y-%m-%d')
                })
                
                print(f"Trovati {len(car_data)} annunci per {make} {model} {year if year else ''}")
            else:
                print(f"Nessun annuncio trovato per {make} {model} {year if year else ''}")
                
        except requests.exceptions.RequestException as e:
            print(f"Errore durante la ricerca di {make} {model}: {str(e)}")
        except Exception as e:
            print(f"Errore generico durante la ricerca di {make} {model}: {str(e)}")

    def export_results(self, filename='prezzi_auto.csv'):
        """Esporta i risultati in un file CSV"""
        if not self.results:
            print("Nessun risultato da esportare")
            return None
        
        df = pd.DataFrame(self.results)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\nRisultati esportati in {filename}")
        return df

    def print_summary(self):
        """Stampa un riepilogo dei risultati"""
        if not self.results:
            print("Nessun risultato da mostrare")
            return

        print("\nRIEPILOGO RICERCA:")
        print("-" * 80)
        for result in self.results:
            print(f"\nModello: {result['make']} {result['model']} {result['target_year'] if result['target_year'] else 'tutti gli anni'}")
            print(f"Annunci trovati: {result['num_listings']}")
            print(f"Prezzo medio: €{result['average_price']:,.2f}")
            print(f"Range prezzi: €{result['min_price']:,.2f} - €{result['max_price']:,.2f}")
            if result['average_km']:
                print(f"Chilometraggio medio: {result['average_km']:,} km")
            print("-" * 40)

# Test con alcuni modelli
if __name__ == "__main__":
    cars_to_search = [
    {'make': 'abarth', 'model': '131', 'year': 1980},
    {'make': 'acura', 'model': 'integra', 'year': 2001},  # semplificato da Type R per aumentare risultati
    {'make': 'acura', 'model': 'nsx', 'year': 1991},
    {'make': 'alfa-romeo', 'model': '155'},  # Q4 incluso nella ricerca generale
    {'make': 'alfa-romeo', 'model': '155', 'year': 1993},  # V6 TI versione
    {'make': 'alfa-romeo', 'model': '2000-gt', 'year': 1971},
    {'make': 'alfa-romeo', 'model': '75-turbo', 'year': 1987},
    {'make': 'alfa-romeo', 'model': 'montreal', 'year': 1970},
    {'make': 'alpine', 'model': 'a110', 'year': 1973},
    {'make': 'alpine', 'model': 'a610'},
    {'make': 'audi', 'model': 'quattro', 'year': 1985},  # S1 Rally semplificato
    {'make': 'audi', 'model': 'r8'},  # GT incluso nella ricerca generale
    {'make': 'audi', 'model': 'rs4', 'year': 2006},
    {'make': 'audi', 'model': 's2', 'year': 1990},
    {'make': 'audi', 'model': 'sport-quattro', 'year': 1984},
    {'make': 'audi', 'model': 'tt', 'year': 1998},
    {'make': 'audi', 'model': 'v8', 'year': 1988},
    {'make': 'bmw', 'model': '3.0-csl'},
    {'make': 'bmw', 'model': '325i', 'year': 1989},  # swap S54 non specificabile nella ricerca
    {'make': 'bmw', 'model': '535i', 'year': 1991}
]
    
    scraper = AutoScout24Scraper()
    
    for car in cars_to_search:
        scraper.search_car(**car)
    
    scraper.print_summary()
    scraper.export_results('prezzi_auto_autoscout24.csv')