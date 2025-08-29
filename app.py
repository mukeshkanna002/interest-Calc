from flask import Flask, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

app = Flask(__name__)

@app.route('/gold-price')
def get_gold_price():
    try:
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=options)
        driver.get("https://www.goodreturns.in/gold-rates/chennai.html")

        # Wait for the table to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "gold_silver_table"))
        )

        table = driver.find_element(By.CLASS_NAME, "gold_silver_table")
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
