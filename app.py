from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

app = Flask(__name__)

@app.route('/')
def home():
    return "✅ Gold Price Scraper is running. Visit /gold-price to get live prices."

@app.route('/gold-price')
def get_gold_price():
    try:
        # Set up headless Chrome browser
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=chrome_options)
        driver.get("https://www.goodreturns.in/gold-rates/chennai.html")

        # Find the gold price table
        tables = driver.find_elements(By.CLASS_NAME, "gold_silver_table")
        if not tables:
            driver.quit()
            return jsonify({"error": "Gold price table not found"})

        table = tables[0]
        rows = table.find_elements(By.TAG_NAME, "tr")

        gold_prices = {}
        for row in rows[1:]:
            cols = row.find_elements(By.TAG_NAME, "td")
            if len(cols) >= 2:
                purity = cols[0].text.strip()
                price = cols[1].text.strip()
                gold_prices[purity] = price

        driver.quit()
        return jsonify(gold_prices)

    except Exception as e:
        return jsonify({"error": str(e)})
