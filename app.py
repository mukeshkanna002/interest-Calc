from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

@app.route("/")
def home():
    return "<h2>Welcome to the Gold Price API</h2><p>Use <code>/gold-price</code> to get current gold prices in Chennai.</p>"

@app.route("/gold-price")
def get_gold_price():
    try:
        url = "https://www.goodreturns.in/gold-rates/chennai.html"
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        table = soup.find('table', class_='gold_silver_table')
        if not table:
            return jsonify({"error": "Gold price table not found"}), 500
        rows = table.find_all('tr')
        gold_prices = {}
        for row in rows[1:]:
            cols = row.find_all('td')
            if len(cols) >= 2:
                purity = cols[0].get_text(strip=True)
                price = cols[1].get_text(strip=True)
                gold_prices[purity] = price
        return jsonify(gold_prices)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run()
