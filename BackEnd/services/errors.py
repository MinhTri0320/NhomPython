class AppError(Exception):
    """Lỗi nghiệp vụ: app.py sẽ đổi thành phản hồi JSON {"detail": ...}."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)
