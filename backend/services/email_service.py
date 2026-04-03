import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Zealflow <noreply@example.com>")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_verification_email(to_email: str, username: str, token: str) -> None:
    verify_url = f"{FRONTEND_URL}/verify?token={token}"

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

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
