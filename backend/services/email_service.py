import os
import smtplib
from contextlib import contextmanager
from collections.abc import Iterable
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parseaddr

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "Zealflow <noreply@example.com>").strip()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
SMTP_TIMEOUT_SECONDS = int(os.getenv("SMTP_TIMEOUT_SECONDS", "15"))


def build_verification_url(token: str) -> str:
    return f"{FRONTEND_URL}/verify?token={token}"


def _envelope_from() -> str:
    parsed_from = parseaddr(SMTP_FROM)[1]
    return parsed_from if parsed_from and "@" in parsed_from and " " not in parsed_from else SMTP_USER


def _smtp_modes() -> list[str]:
    if SMTP_USE_SSL:
        return ["ssl"]
    if SMTP_USE_TLS:
        return ["starttls", "plain"]
    return ["plain", "starttls"]


@contextmanager
def _open_smtp(mode: str):
    if mode == "ssl":
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS)

    try:
        server.ehlo()
        if mode == "starttls":
            server.starttls()
            server.ehlo()
        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)
        yield server
    finally:
        try:
            server.quit()
        except Exception:
            pass


def _send_message(msg: MIMEMultipart, to_email: str) -> None:
    last_error: Exception | None = None
    for mode in _smtp_modes():
        try:
            with _open_smtp(mode) as server:
                server.sendmail(_envelope_from(), [to_email], msg.as_string())
            return
        except Exception as exc:
            last_error = exc

    if last_error:
        raise RuntimeError(f"SMTP send failed: {last_error}") from last_error
    raise RuntimeError("SMTP send failed")


def send_verification_email(to_email: str, username: str, token: str) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be configured to send emails")

    verify_url = build_verification_url(token)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your Zealflow account"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    text_body = f"""Hi {username},

Verify your Zealflow workspace by visiting the link below:

{verify_url}

This link is valid for 24 hours. If you didn't create this account, ignore this email.

— Zealflow
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
             max-width: 480px; margin: 48px auto; color: #1a1a1a; padding: 0 24px;">
  <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">
    Verify your Zealflow account
  </h2>
  <p style="color: #555; margin-bottom: 28px; font-size: 15px; line-height: 1.5;">
    Hi {username}, click the button below to activate your workspace.
  </p>
  <a href="{verify_url}"
     style="display: inline-block; background: #4F46E5; color: #ffffff;
            text-decoration: none; padding: 12px 28px; border-radius: 8px;
            font-size: 15px; font-weight: 500;">
    Verify Email
  </a>
  <p style="margin-top: 28px; color: #888; font-size: 13px;">
    Or paste this link in your browser:<br>
    <span style="color: #4F46E5;">{verify_url}</span>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #aaa; font-size: 12px;">
    If you didn't sign up for Zealflow, you can safely ignore this email.
  </p>
</body>
</html>"""

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    _send_message(msg, to_email)


def normalize_email_list(value: object) -> list[str]:
    if not value:
        return []

    if isinstance(value, str):
            raw_items = [part.strip() for part in value.replace("\\n", ",").replace(";", ",").replace("\n", ",").split(",")]
    elif isinstance(value, Iterable):
        raw_items = []
        for item in value:
            parts = str(item).replace("\\n", ",").replace(";", ",").replace("\n", ",").split(",")
            raw_items.extend(part.strip() for part in parts)
    else:
        raw_items = []

    seen = set()
    emails: list[str] = []
    for item in raw_items:
        if not item:
            continue
        parsed = parseaddr(item)[1] or item
        parsed = parsed.strip().lower()
        if "@" not in parsed or parsed in seen:
            continue
        seen.add(parsed)
        emails.append(parsed)
    return emails


def send_form_publish_email(
    to_email: str,
    form_title: str,
    form_url: str,
    custom_message: str,
    admin_name: str | None = None,
) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be configured to send emails")

    display_name = admin_name or "Zealflow Admin"
    safe_message = (custom_message or "").strip() or "A new form is now available."

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New form published: {form_title}"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    text_body = f"""Hi,

{safe_message}

Open the form here:
{form_url}

— {display_name}
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
             max-width: 520px; margin: 48px auto; color: #1a1a1a; padding: 0 24px;">
  <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">
    {form_title}
  </h2>
  <p style="color: #555; margin-bottom: 28px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
    {safe_message}
  </p>
  <a href="{form_url}"
     style="display: inline-block; background: #4F46E5; color: #ffffff;
            text-decoration: none; padding: 12px 28px; border-radius: 8px;
            font-size: 15px; font-weight: 500;">
    Open Form
  </a>
  <p style="margin-top: 28px; color: #888; font-size: 13px;">
    Or paste this link in your browser:<br>
    <span style="color: #4F46E5;">{form_url}</span>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #aaa; font-size: 12px;">
    Sent by {display_name} via Zealflow.
  </p>
</body>
</html>"""

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    _send_message(msg, to_email)


def send_bulk_form_publish_emails(
        recipients: list[str],
        form_title: str,
        form_url: str,
        custom_message: str,
        admin_name: str | None = None,
) -> int:
        if not SMTP_USER or not SMTP_PASSWORD:
                raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be configured to send emails")

        cleaned = normalize_email_list(recipients)
        if not cleaned:
                return 0

        display_name = admin_name or "Zealflow Admin"
        safe_message = (custom_message or "").strip() or "A new form is now available."

        def _build_message(to_email: str) -> MIMEMultipart:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"New form published: {form_title}"
                msg["From"] = SMTP_FROM
                msg["To"] = to_email

                text_body = f"""Hi,

{safe_message}

Open the form here:
{form_url}

— {display_name}
"""

                html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                         max-width: 520px; margin: 48px auto; color: #1a1a1a; padding: 0 24px;">
    <h2 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">
        {form_title}
    </h2>
    <p style="color: #555; margin-bottom: 28px; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
        {safe_message}
    </p>
    <a href="{form_url}"
         style="display: inline-block; background: #4F46E5; color: #ffffff;
                        text-decoration: none; padding: 12px 28px; border-radius: 8px;
                        font-size: 15px; font-weight: 500;">
        Open Form
    </a>
    <p style="margin-top: 28px; color: #888; font-size: 13px;">
        Or paste this link in your browser:<br>
        <span style="color: #4F46E5;">{form_url}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
    <p style="color: #aaa; font-size: 12px;">
        Sent by {display_name} via Zealflow.
    </p>
</body>
</html>"""

                msg.attach(MIMEText(text_body, "plain"))
                msg.attach(MIMEText(html_body, "html"))
                return msg

        sent_count = 0
        last_error: Exception | None = None

        for mode in _smtp_modes():
                try:
                        with _open_smtp(mode) as server:
                                for recipient in cleaned:
                                        try:
                                                msg = _build_message(recipient)
                                                server.sendmail(_envelope_from(), [recipient], msg.as_string())
                                                sent_count += 1
                                        except Exception as exc:
                                                last_error = exc
                        return sent_count
                except Exception as exc:
                        last_error = exc

        if sent_count == 0 and last_error:
                raise RuntimeError(f"SMTP bulk send failed: {last_error}") from last_error
        return sent_count
