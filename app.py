from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

@app.route('/')
def home():
    return "✅ Gold Price API is running. Use /gold-price to get current prices."

@app.route('/gold-price')
def get_gold_price():
    try:
        url = "https://www.goodreturns.in/gold-rates/chennai.html"
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        text = soup.get_text()
        pattern = r"Chennai\s*₹([\d,]+)\s*₹([\d,]+)\s*₹([\d,]+)"
        match = re.search(pattern, text)
        if match:
            gold_prices = {
                "24K": f"₹{match.group(1)}",
                "22K": f"₹{match.group(2)}",
                "18K": f"₹{match.group(3)}"
            }
            return jsonify(gold_prices)
        else:
            return jsonify({"error": "Gold prices not found in page text."})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)