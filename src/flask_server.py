
from flask import Flask
from threading import Thread

app = Flask(__name__)

@app.route('/flask')
def flask_home():
    return "Flask server is running!"

def run():
    app.run(host='0.0.0.0', port=5000)

def start_flask():
    t = Thread(target=run)
    t.start()
