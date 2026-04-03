import argparse
import sys
import json
import requests
from zealflow_cli.config import get_config, save_config

def main():
    parser = argparse.ArgumentParser(description="Zealflow Terminal Interface")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Configure
    config_parser = subparsers.add_parser("configure", help="Configure the backend API location")
    config_parser.add_argument("--api-url", required=True, help="Base API string (e.g. http://localhost:8000)")

    # Admin Operations
    admin_parser = subparsers.add_parser("admin", help="Admin specific controls")
    admin_sub = admin_parser.add_subparsers(dest="admin_command", required=True)
    
    create_p = admin_sub.add_parser("create", help="Create blueprint from local schema file")
    create_p.add_argument("file", help="Path to pure JSON schema export file")
    
    export_p = admin_sub.add_parser("export", help="Compile and wipe responses to local CSV")
    export_p.add_argument("form_id", help="Active Form ID to process")
    export_p.add_argument("--out", required=True, help="Local CSV destination")

    # Respondent Fill Process
    fill_parser = subparsers.add_parser("fill", help="Run interactive terminal prompt flow targeting active forms")
    fill_parser.add_argument("form_id", help="Form ID to load payload for")

    args = parser.parse_args()
    
    if args.command == "configure":
        save_config(args.api_url)
        print(f"[ ZEALFLOW ] Bound terminal target: {args.api_url}")
        return

    config = get_config()
    api_url = config.get("api_url", "http://localhost:8000")

    if args.command == "admin":
        if args.admin_command == "create":
            try:
                with open(args.file, "r") as f:
                    schema = json.load(f)
                
                payload = {"title": schema.get("title", "Headless Import"), "schema_data": schema}
                res = requests.post(f"{api_url}/forms", json=payload)
                if res.status_code == 200:
                    print(f"[ SUCCESS ] Form imported natively! Registry ID -> {res.json()['id']}")
                else:
                    print(f"[ ERR ] Rejection: {res.text}")
            except Exception as e:
                print(f"[ OS ERR ] Could not read blueprint: {str(e)}")
                
        elif args.admin_command == "export":
            try:
                res = requests.get(f"{api_url}/forms/{args.form_id}/responses/csv")
                if res.status_code == 200:
                    with open(args.out, "w", encoding="utf-8") as f:
                        f.write(res.text)
                    print(f"[ SUCCESS ] Dumped native response matrix to {args.out}")
                else:
                    print(f"[ ERR ] No active response metrics found for {args.form_id}")
            except requests.ConnectionError:
                print(f"[ FATAL ] Connection refused pointing to {api_url}")

    elif args.command == "fill":
        try:
            res = requests.get(f"{api_url}/forms/{args.form_id}")
            if res.status_code != 200:
                print("[ 404 ] Form blueprint missing. Cannot proceed.")
                return
                
            form_data = res.json()
            print(f"\n===== ZEALFLOW WORKSPACE =====")
            print(f"[{form_data['title'].upper()}]")
            print("==============================\n")
            
            schema = form_data.get("schema_data", {})
            fields = schema.get("fields", [])
            
            if not fields:
                print("Cannot run empty schema block.")
                return

            answers = {}
            for field in fields:
                req_warn = "[*] " if field.get("required") else ""
                
                print(f"{req_warn}{field.get('label', 'Missing Label')}")
                if "placeholder" in field and field["placeholder"]:
                    ans = input(f"   ({field['placeholder']}) -> ")
                else:
                    ans = input(f"   -> ")

                answers[field["id"]] = ans
                print("")
                
            print("\nSubmitting to native state node...")
            payload = {"answers": answers}
            submit_res = requests.post(f"{api_url}/forms/{args.form_id}/responses", json=payload)
            
            if submit_res.status_code == 200:
                print("[ OK ] Transaction secured. Thank you.")
            else:
                print(f"[ ERR ] Integrity rejection: {submit_res.text}")
        except requests.ConnectionError:
            print(f"[ FATAL ] Connection refused pointing to {api_url}")

if __name__ == "__main__":
    main()
