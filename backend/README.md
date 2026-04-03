## ZealFlow Backend

### Auth + email verification setup

1. Copy [.env.example](.env.example) to `.env`.
2. Fill in:
	- `SUPABASE_URL`
	- `SUPABASE_KEY`
	- `SECRET_KEY`
3. Configure SMTP for verification emails:
	- `SMTP_HOST`, `SMTP_PORT`
	- `SMTP_USER`, `SMTP_PASSWORD`
	- `SMTP_FROM`

For Gmail, use an App Password (not your account password).

### Dev fallback when email fails

If `ALLOW_DEV_VERIFY_FALLBACK=true`, signup/resend responses include `verification_url` when SMTP delivery fails.

### Run

```bash
python -m uvicorn main:app --reload
```