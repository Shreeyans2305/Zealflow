import argparse
import sys
import os
import json
import requests
import datetime
import questionary
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.align import Align
from zealflow_cli.config import get_config, save_config

console = Console()

LOGO_RAW = """
███████╗███████╗ █████╗ ██╗     ███████╗██╗      ██████╗ ██╗    ██╗
╚══███╔╝██╔════╝██╔══██╗██║     ██╔════╝██║     ██╔═══██╗██║    ██║
  ███╔╝ █████╗  ███████║██║     █████╗  ██║     ██║   ██║██║ █╗ ██║
 ███╔╝  ██╔══╝  ██╔══██║██║     ██╔══╝  ██║     ██║   ██║██║███╗██║
███████╗███████╗██║  ██║███████╗██║     ███████╗╚██████╔╝╚███╔███╔╝
╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ 
"""

def generate_3d_logo():
    logo = LOGO_RAW.replace("█", "[bold cyan]█[/bold cyan]")
    # Parse exactly the shading boundaries into deep blue natively
    for c in ["╚", "═", "╗", "╝", "╔", "║"]:
        logo = logo.replace(c, f"[bold blue]{c}[/bold blue]")
    return logo

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def render_header(subtitle=""):
    clear_screen()
    panel = Panel(
        Align.center(generate_3d_logo()),
        title="[bold yellow]Welcome To[/bold yellow]" if not subtitle else f"[bold yellow]{subtitle}[/bold yellow]",
        subtitle="[dim]Terminal UI v1.0[/dim]",
        border_style="cyan",
        expand=False
    )
    console.print(Align.center(panel))
    console.print()

def main():
    config = get_config()
    api_url = config.get("api_url", "http://localhost:8000").rstrip('/')
    
    # Bypass for configuration
    if len(sys.argv) > 1 and sys.argv[1] == "configure":
        parser = argparse.ArgumentParser()
        parser.add_argument("configure")
        parser.add_argument("--api-url", required=True)
        args = parser.parse_args()
        save_config(args.api_url)
        render_header("System Configuration")
        console.print(Align.center(f"[bold green]✓ Successfully Bound Terminal Target:[/bold green]\n[cyan]{args.api_url}[/cyan]"))
        return

    render_header()
    
    role = questionary.select(
        "Who are you logging in as?",
        choices=[
            "Respondent (End User)", 
            "System Administrator", 
            "Disconnect"
        ]
    ).ask()
    
    if role == "Disconnect" or not role:
        render_header("Disconnected")
        sys.exit(0)
        
    if role == "System Administrator":
        render_header("Administrative Interface")
        try:
            password = questionary.password("Enter Master Admin Password:").ask()
            if not password:
                return
                
            console.print("\n[dim]Authenticating globally...[/dim]")
            res = requests.post(f"{api_url}/auth/admin", json={"password": password})
            
            if res.status_code != 200:
                render_header("Access Denied")
                console.print(Align.center("[bold red]✗ Invalid Administrative Password.[/bold red]"))
                return
                
            admin_loop(api_url)
        except requests.ConnectionError:
            render_header("Network Error")
            console.print(Align.center(f"[bold red]✗ FATAL: Backend unreachable at {api_url}[/bold red]"))
        
    elif role == "Respondent (End User)":
        render_header("User Terminal")
        user_id = questionary.text("Enter your Name or Identifier:").ask()
        if not user_id:
            return
            
        try:
            user_loop(api_url, user_id)
        except requests.ConnectionError:
            render_header("Network Error")
            console.print(Align.center(f"[bold red]✗ FATAL: Backend unreachable at {api_url}[/bold red]"))

def admin_loop(api_url):
    while True:
        render_header("Admin Engineering Workspace")
        
        action = questionary.select(
            "What would you like to do?",
            choices=[
                "Create Global Form from local JSON", 
                "Export Form Responses to CSV", 
                "View Live Analytics",
                "Logout"
            ]
        ).ask()
        
        if action == "Logout" or not action:
            render_header("Logged Out")
            break
            
        if action == "Create Global Form from local JSON":
            render_header("Blueprint Importer")
            file_path = questionary.path("Path to local schema.json:").ask()
            expires = questionary.text("Minutes until precise structural expiration (Type 0 for immortal):", default="0").ask()
            
            try:
                with open(file_path, "r") as f:
                    schema = json.load(f)
                
                payload = {"title": schema.get("title", "Headless Import"), "schema_data": schema}
                
                exp_mins = int(expires) if expires.isdigit() else 0
                if exp_mins > 0:
                    delta = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=exp_mins)
                    payload["expires_at"] = delta.isoformat()
                
                console.print("\n[dim]Injecting core blueprint...[/dim]")
                res = requests.post(f"{api_url}/forms", json=payload)
                
                render_header("Blueprint Importer")
                if res.status_code == 200:
                    console.print(Align.center(Panel(
                        f"[bold green]Blueprint Embedded Successfully![/bold green]\n\n"
                        f"Active Registry ID: [bold cyan]{res.json()['id']}[/bold cyan]\n"
                        f"Status: [yellow]{'Closes in ' + expires + ' minutes' if exp_mins > 0 else 'Immortal'}[/yellow]", 
                        expand=False,
                        border_style="green"
                    )))
                else:
                    console.print(Align.center(f"[bold red]✗ Architecture Error: {res.text}[/bold red]"))
                
                input("\nPress Enter to return to Dashboard...")
                
            except Exception as e:
                console.print(Align.center(f"[bold red]✗ File Error: {str(e)}[/bold red]"))
                input("\nPress Enter to return to Dashboard...")
                
        elif action == "Export Form Responses to CSV":
            render_header("Data Export Engine")
            form_id = questionary.text("Enter target Form ID to dump:").ask()
            out_file = questionary.text("Target Output CSV path:", default="responses.csv").ask()
            
            if not form_id or not out_file:
                continue
                
            console.print("\n[dim]Compiling structural response matrix...[/dim]")
            res = requests.get(f"{api_url}/forms/{form_id}/responses/csv")
            
            render_header("Data Export Engine")
            if res.status_code == 200:
                with open(out_file, "w", encoding="utf-8") as f:
                    f.write(res.text)
                console.print(Align.center(Panel(f"[bold green]✓ Successfully dumped array data to:[/bold green]\n[cyan]{out_file}[/cyan]", expand=False, border_style="green")))
            else:
                console.print(Align.center(f"[bold red]✗ Failed to compile dump: {res.text}[/bold red]"))
                
            input("\nPress Enter to return to Dashboard...")
            
        elif action == "View Live Analytics":
            render_header("Live Analytics Telemetry")
            form_id = questionary.text("Enter target Form ID to visualize:").ask()
            if not form_id: continue
            form_id = form_id.strip()
            
            console.print("\n[dim]Fetching live JSON payloads...[/dim]")
            res = requests.get(f"{api_url}/forms/{form_id}/responses")
            
            if res.status_code != 200:
                console.print(Align.center(f"[bold red]✗ Failed to compile analytics: {res.text}[/bold red]"))
                input("\nPress Enter to return to Dashboard...")
                continue
                
            data = res.json()
            if not data:
                console.print(Align.center(Panel("[bold yellow]No submissions recorded yet.[/bold yellow]")))
                input("\nPress Enter to return to Dashboard...")
                continue
                
            metrics = {}
            for sub in data:
                for k, v in sub["answers"].items():
                    if k == "respondent_id_metadata": continue
                    if k not in metrics: metrics[k] = {}
                    ans_str = str(v)
                    metrics[k][ans_str] = metrics[k].get(ans_str, 0) + 1
                    
            render_header("Live Analytics Telemetry")
            console.print(Align.center(f"[bold cyan]Total Global Submissions:[/bold cyan] [bold yellow]{len(data)}[/bold yellow]\n"))
            
            from rich.table import Table
            for q_id, counts in metrics.items():
                table = Table(title=f"Field ID: [magenta]{q_id}[/magenta]", show_header=False, border_style="cyan")
                for answer_text, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
                    bar_length = int((count / len(data)) * 30)
                    bar = "[green]" + ("█" * bar_length) + "[/green]"
                    table.add_row(f"[bold]{answer_text}[/bold]", bar, f"[cyan]{count}[/cyan]")
                    
                console.print(Align.center(table))
                console.print("")
                
            input("\nPress Enter to return to Dashboard...")

def user_loop(api_url, user_id):
    render_header("Network Synchronization")
    console.print("\n[dim]Connecting to global forms registry...[/dim]")
    
    res = requests.get(f"{api_url}/forms")
    
    render_header(f"Welcome, {user_id.title()}")
    if res.status_code != 200:
        console.print(Align.center("[bold red]✗ Encountered error mapping forms list.[/bold red]"))
        return
        
    forms = res.json()
    if not forms:
        console.print(Align.center(Panel("[bold yellow]⚠ No active blueprints found.[/bold yellow]\n\nAdministration has likely not published any structurally immortal files.", expand=False, border_style="yellow")))
        input("\nPress Enter to exit...")
        return
        
    choices = [f"{f['title']}  ->  ( ID: {f['id']} )" for f in forms] + ["Disconnect"]
    selection = questionary.select("Select an active webform prompt architecture:", choices=choices).ask()
    
    if selection == "Disconnect" or not selection:
        return
        
    # Isolate ID correctly stripping trailing format
    form_id = selection.split("( ID: ")[-1].replace(" )", "")
    
    # Engage structural respondent loop
    render_header("Fetching Structure")
    res = requests.get(f"{api_url}/forms/{form_id}")
    if res.status_code != 200:
        render_header("Error")
        console.print(Align.center("[bold red]✗ Target blueprint lookup crashed.[/bold red]"))
        input("\nPress Enter to exit...")
        return
        
    form_data = res.json()
    
    # Form Filling GUI Loop
    render_header(form_data['title'].upper())
    
    schema = form_data.get("schema_data", {})
    fields = schema.get("fields", [])
    
    answers = {"respondent_id_metadata": user_id}
    
    # Draft Cache Injection Setup
    draft_file = os.path.expanduser(f"~/.zealflow_draft_{form_id}_{user_id}.json")
    if os.path.exists(draft_file):
        resume = questionary.confirm("⚠ Suspended Draft Cache Detected. Resume previous session?").ask()
        if resume:
            try:
                with open(draft_file, "r") as f:
                    cached = json.load(f)
                    answers.update(cached)
                console.print("[dim]✓ Draft session restored...[/dim]")
            except Exception:
                pass
    
    for field in fields:
        f_id = field["id"]
        
        # Active Conditional Routing (Skip Logic)
        show_if = field.get("show_if")
        if show_if:
            target_id = show_if.get("id")
            expected_val = show_if.get("equals")
            if target_id and target_id in answers:
                if str(answers[target_id]).lower() != str(expected_val).lower():
                    continue # Bypassing question cleanly 
                    
        # Exclude questions actively restored from draft natively
        if f_id in answers and f_id != "respondent_id_metadata":
            continue

        req_warn = "[bold red]*[/bold red] " if field.get("required") else ""
        label_text = f"{req_warn}[bold]{field.get('label', 'Missing Label')}[/bold]"
        
        console.print("")
        ans = Prompt.ask(label_text)
        answers[f_id] = ans
        
        # Flush checkpoint automatically to OS dump file
        try:
            with open(draft_file, "w") as f:
                json.dump(answers, f)
        except Exception:
            pass
        
    console.print("\n[dim]Submitting payload...[/dim]")
    payload = {"answers": answers}
    submit_res = requests.post(f"{api_url}/forms/{form_id}/responses", json=payload)
    
    render_header(form_data['title'].upper())
    if submit_res.status_code == 200:
        # Transaction Success, eradicate Draft dump safely
        if os.path.exists(draft_file):
            os.remove(draft_file)
            
        console.print(Align.center(Panel("[bold green]Transaction successfully secured. Thank you![/bold green]", expand=False, border_style="green")))
    else:
        try:
            error_msg = submit_res.json().get("detail", submit_res.text)
        except:
            error_msg = submit_res.text
        console.print(Align.center(Panel(f"[bold red]Integrity Rejection[/bold red]\n\n{error_msg}", expand=False, border_style="red")))
        
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
