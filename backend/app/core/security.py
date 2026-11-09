import html
import re
from typing import Optional
from fastapi import Request, HTTPException


class SecurityMiddleware:
    """
    Security helpers: sanitization, input validation, and lightweight request protection.
    """

    @staticmethod
    def sanitize_input(text: str) -> str:
        """
        Strips dangerous control characters or null bytes without altering legitimate text.
        """
        if not text:
            return ""
        # Remove null bytes
        sanitized = text.replace("\x00", "")
        return sanitized

    @staticmethod
    def validate_text_size(text: str, max_chars: int = 500_000) -> None:
        """
        Guards against excessive payloads causing CPU exhaustion.
        """
        if len(text) > max_chars:
            raise HTTPException(
                status_code=413,
                detail=f"Payload text exceeds maximum character limit of {max_chars} characters."
            )


security = SecurityMiddleware()

