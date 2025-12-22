from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
from pydantic import EmailStr

class EmailService:
    @staticmethod
    async def send_report_email(email: EmailStr, subject: str, body: str):
        if not settings.smtp_user or not settings.smtp_password or not (settings.smtp_from or settings.smtp_user):
            # Skip if SMTP not configured correctly
            print("SMTP not configured, skipping email.")
            return False
            
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.smtp_user,
            MAIL_PASSWORD=settings.smtp_password,
            MAIL_FROM=settings.smtp_from or settings.smtp_user,
            MAIL_PORT=settings.smtp_port,
            MAIL_SERVER=settings.smtp_server,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True
        )

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=body,
            subtype=MessageType.html
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        return True
