import os
import json

CONFIG_FILE = os.path.expanduser("~/.zealflow_config.json")

def get_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return {"api_url": "http://localhost:8000"}

def save_config(api_url):
    with open(CONFIG_FILE, "w") as f:
        json.dump({"api_url": api_url}, f)
