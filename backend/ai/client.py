"""
Groq client — initialised once at import time.
Raises a clear error at startup if GROQ_API_KEY is missing.
"""

import os
from groq import Groq

_api_key = os.getenv("GROQ_API_KEY")
if not _api_key:
    raise EnvironmentError(
        "GROQ_API_KEY is not set. "
        "Copy backend/.env.example to backend/.env and add your key."
    )

client = Groq(api_key=_api_key)

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
