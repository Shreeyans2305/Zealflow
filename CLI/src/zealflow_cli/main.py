import argparse
import sys
import json
import requests
import datetime
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from zealflow_cli.config import get_config, save_config

console = Console()

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
    create_p.add_argument("--expires-minutes", type=int, default=0, help="Optional integer dictating time until the form strictly closes.")
    
    export_p = admin_sub.add_parser("export", help="Compile and wipe responses to local CSV")
    export_p.add_argument("form_id", help="Active Form ID to process")
    export_p.add_argument("--out", required=True, help="Local CSV destination")

    # Respondent Fill Process
    fill_parser = subparsers.add_parser("fill", help="Run interactive terminal prompt flow targeting active forms")
    fill_parser.add_argument("form_id", help="Form ID to load payload for")

    args = parser.parse_args()
    
    if args.command == "configure":
        save_config(args.api_url)
        console.print(f"[bold green]✓[/bold green] Bound terminal target: [cyan]{args.api_url}[/cyan]")
        return

    config = get_config()
    api_url = config.get("api_url", "http://localhost:8000")

    if args.command == "admin":
        if args.admin_command == "create":
            try:
                with open(args.file, "r") as f:
                    schema = json.load(f)
                
                payload = {"title": schema.get("title", "Headless Import"), "schema_data": schema}
                
                if args.expires_minutes > 0:
                    delta = datetime.datetime.utcnow() + datetime.timedelta(minutes=args.expires_minutes)
                    payload["expires_at"] = delta.isoformat()
                
                res = requests.post(f"{api_url}/forms", json=payload)
                if res.status_code == 200:
                    console.print(Panel(
                        f"[bold green]Form Imported Successfully![/bold green]\n\n"
                        f"Registry ID: [bold cyan]{res.json()['id']}[/bold cyan]\n"
                        f"Expires: {'In ' + str(args.expires_minutes) + ' minutes' if args.expires_minutes else 'Never'}",
                        title="Zealflow Admin", expand=False
                    ))
                else:
                    console.print(f"[bold red]✗ Rejection:[/bold red] {res.text}")
            except Exception as e:
                console.print(f"[bold red]✗ OS ERR:[/bold red] Could not read blueprint: {str(e)}")
                
        elif args.admin_command == "export":
            try:
                res = requests.get(f"{api_url}/forms/{args.form_id}/responses/csv")
                if res.status_code == 200:
                    with open(args.out, "w", encoding="utf-8") as f:
                        f.write(res.text)
                    console.print(f"[bold green]✓ Dumped native response matrix to [cyan]{args.out}[/cyan][/bold green]")
                else:
                    console.print(f"[bold yellow]⚠ No active response metrics found for {args.form_id}[/bold yellow]")
            except requests.ConnectionError:
                console.print(f"[bold red]✗ FATAL:[/bold red] Connection refused pointing to {api_url}")

    elif args.command == "fill":
        try:
            res = requests.get(f"{api_url}/forms/{args.form_id}")
            if res.status_code != 200:
                console.print(f"[bold red]✗ Form blueprint missing or connection failed (Code {res.status_code}).[/bold red]")
                return
                
            form_data = res.json()
            
            console.print(Panel(
                f"[bold cyan]{form_data['title'].upper()}[/bold cyan]",
                title="Zealflow Workspace", expand=False
            ))
            
            schema = form_data.get("schema_data", {})
            fields = schema.get("fields", [])
            
            if not fields:
                console.print("[dim]Cannot run empty schema block.[/dim]")
                return

            answers = {}
            for field in fields:
                req_warn = "[bold red]*[/bold red] " if field.get("required") else ""
                label_text = f"{req_warn}[bold]{field.get('label', 'Missing Label')}[/bold]"
                
                # Fetch Answer via Rich
                console.print("")
                ans = Prompt.ask(label_text)
                answers[field["id"]] = ans
                
            console.print("\n[dim]Submitting to native state node...[/dim]")
            payload = {"answers": answers}
            submit_res = requests.post(f"{api_url}/forms/{args.form_id}/responses", json=payload)
            
            if submit_res.status_code == 200:
                console.print(Panel(
                    "[bold green]Transaction secured. Thank you![/bold green]",
                    expand=False
                ))
            else:
                try:
                    error_msg = submit_res.json().get("detail", submit_res.text)
                except:
                    error_msg = submit_res.text
                console.print(Panel(f"[bold red]Integrity rejection[/bold red]\n\n{error_msg}", expand=False))
                
        except requests.ConnectionError:
            console.print(f"[bold red]✗ FATAL:[/bold red] Connection refused pointing to {api_url}")

if __name__ == "__main__":
    main()
