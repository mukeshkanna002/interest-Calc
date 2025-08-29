from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route('/gold-price')
def get_gold_price():
    url = "https://www.goodreturns.in/gold-rates/chennai.html"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    table = soup.find('table', class_='gold_silver_table')
    rows = table.find_all('tr')
    gold_prices = {}
    for row in rows[1:]:
        cols = row.find_all('td')
        if len(cols) >= 2:
            purity = cols[0].get_text(strip=True)
            price = cols[1].get_text(strip=True)
            gold_prices[purity] = price
    return jsonify(gold_prices)
