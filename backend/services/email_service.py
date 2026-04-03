import os
import smtplib
from email.utils import parseaddr
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "Zealflow <noreply@example.com>").strip()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"


def build_verification_url(token: str) -> str:
    return f"{FRONTEND_URL}/verify?token={token}"


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

    parsed_from = parseaddr(SMTP_FROM)[1]
    envelope_from = parsed_from if parsed_from and ("@" in parsed_from) and (" " not in parsed_from) else SMTP_USER

    if SMTP_USE_SSL:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(envelope_from, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            if SMTP_USE_TLS:
                server.starttls()
                server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(envelope_from, [to_email], msg.as_string())
