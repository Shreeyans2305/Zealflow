import sys
import json
import requests
import datetime
import questionary
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from zealflow_cli.config import get_config, save_config

console = Console()

def main():
    config = get_config()
    api_url = config.get("api_url", "http://localhost:8000")
    
    # Support basic configure alias bypass natively
    if len(sys.argv) > 1 and sys.argv[1] == "configure":
        import argparse
        parser = argparse.ArgumentParser()
        parser.add_argument("configure")
        parser.add_argument("--api-url", required=True)
        args = parser.parse_args()
        save_config(args.api_url)
        console.print(f"[bold green]✓ Bound terminal target: [cyan]{args.api_url}[/cyan][/bold green]")
        return

    console.print(Panel("[bold cyan]Welcome to Zealflow Terminal[/bold cyan]", expand=False))
    
    role = questionary.select(
        "Identity Selection:",
        choices=["Respondent (User)", "System Administrator", "Terminate"]
    ).ask()
    
    if role == "Terminate" or not role:
        sys.exit(0)
        
    if role == "System Administrator":
        try:
            password = questionary.password("Enter Master Admin Password:").ask()
            if not password:
                return
                
            res = requests.post(f"{api_url}/auth/admin", json={"password": password})
            if res.status_code != 200:
                console.print("[bold red]✗ Access Denied. Invalid Password.[/bold red]")
                return
                
            console.print("[bold green]✓ Administrative Access Granted[/bold green]")
            admin_loop(api_url)
        except requests.ConnectionError:
            console.print(f"[bold red]✗ FATAL: Backend unreachable at {api_url}[/bold red]")
        
    elif role == "Respondent (User)":
        user_id = questionary.text("Enter your Name or Identifier:").ask()
        if not user_id:
            return
            
        try:
            user_loop(api_url, user_id)
        except requests.ConnectionError:
            console.print(f"[bold red]✗ FATAL: Backend unreachable at {api_url}[/bold red]")

def admin_loop(api_url):
    while True:
        action = questionary.select(
            "Admin Engineering Workspace:",
            choices=["Create Global Form from JSON", "Export Form Responses to CSV", "Logout"]
        ).ask()
        
        if action == "Logout" or not action:
            break
            
        if action == "Create Global Form from JSON":
            file_path = questionary.path("Target path to schema.json:").ask()
            expires = questionary.text("Minutes until strict structural expiration (0 for immortal):", default="0").ask()
            
            try:
                with open(file_path, "r") as f:
                    schema = json.load(f)
                
                payload = {"title": schema.get("title", "Headless Import"), "schema_data": schema}
                
                exp_mins = int(expires) if expires.isdigit() else 0
                if exp_mins > 0:
                    delta = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=exp_mins)
                    payload["expires_at"] = delta.isoformat()
                
                res = requests.post(f"{api_url}/forms", json=payload)
                if res.status_code == 200:
                    console.print(Panel(
                        f"[bold green]Blueprint Embedded Successfully![/bold green]\n"
                        f"Active Registry ID: [cyan]{res.json()['id']}[/cyan]", 
                        expand=False
                    ))
                else:
                    console.print(f"[bold red]✗ Architecture Error: {res.text}[/bold red]")
            except Exception as e:
                console.print(f"[bold red]✗ File Error: {str(e)}[/bold red]")
                
        elif action == "Export Form Responses to CSV":
            form_id = questionary.text("Enter target Form ID to dump:").ask()
            out_file = questionary.text("Target Output CSV path:", default="responses.csv").ask()
            if not form_id or not out_file:
                continue
                
            res = requests.get(f"{api_url}/forms/{form_id}/responses/csv")
            if res.status_code == 200:
                with open(out_file, "w", encoding="utf-8") as f:
                    f.write(res.text)
                console.print(f"[bold green]✓ Structurally dumped array data to {out_file}[/bold green]")
            else:
                console.print(f"[bold red]✗ Failed to compile dump: {res.text}[/bold red]")

def user_loop(api_url, user_id):
    res = requests.get(f"{api_url}/forms")
    if res.status_code != 200:
        console.print("[bold red]✗ Encountered error mapping forms list.[/bold red]")
        return
        
    forms = res.json()
    if not forms:
        console.print("[bold yellow]⚠ No active blueprints found. Administration has likely not published any structurally immortal files.[/bold yellow]")
        return
        
    choices = [f"{f['title']}  ->  ( ID: {f['id']} )" for f in forms] + ["Disconnect"]
    selection = questionary.select("Select an active webform prompt architecture:", choices=choices).ask()
    
    if selection == "Disconnect" or not selection:
        return
        
    # Isolate ID correctly stripping trailing format
    form_id = selection.split("( ID: ")[-1].replace(" )", "")
    
    # Engage structural respondent loop
    res = requests.get(f"{api_url}/forms/{form_id}")
    if res.status_code != 200:
        console.print("[bold red]✗ Target blueprint lookup crashed.[/bold red]")
        return
        
    form_data = res.json()
    console.print(Panel(f"[bold cyan]{form_data['title'].upper()}[/bold cyan]", expand=False))
    
    schema = form_data.get("schema_data", {})
    fields = schema.get("fields", [])
    
    answers = {"respondent_id_metadata": user_id}
    for field in fields:
        req_warn = "[bold red]*[/bold red] " if field.get("required") else ""
        label_text = f"{req_warn}[bold]{field.get('label', 'Missing Label')}[/bold]"
        
        console.print("")
        ans = Prompt.ask(label_text)
        answers[field["id"]] = ans
        
    payload = {"answers": answers}
    submit_res = requests.post(f"{api_url}/forms/{form_id}/responses", json=payload)
    if submit_res.status_code == 200:
        console.print("")
        console.print(Panel("[bold green]Transaction successfully secured. Thank you![/bold green]", expand=False))
    else:
        try:
            error_msg = submit_res.json().get("detail", submit_res.text)
        except:
            error_msg = submit_res.text
        console.print(Panel(f"[bold red]Integrity Rejection[/bold red]\n\n{error_msg}", expand=False))

if __name__ == "__main__":
    main()
