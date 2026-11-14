"""Gửi email (Story 15, 17).

Nếu chưa cấu hình SMTP_HOST trong .env thì KHÔNG gửi thật, chỉ in nội dung email
(kèm liên kết) ra cửa sổ chạy BackEnd để tiện phát triển.
"""
import logging
import smtplib
from email.message import EmailMessage

from config.settings import settings

log = logging.getLogger("uvicorn.error")


def send_mail(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        log.warning("[EMAIL - chế độ phát triển] Gửi tới: %s\nTiêu đề: %s\n%s", to, subject, body)
        return

    msg = EmailMessage()
    msg["From"] = settings.MAIL_FROM or settings.SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
        smtp.starttls()
        if settings.SMTP_USER:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(msg)
