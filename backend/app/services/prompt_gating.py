import re

def intercept_cheating_attempts(message: str) -> str | None:
    """
    Scans the student's message for common shortcuts or bypass commands.
    Returns a custom Socratic mentoring prompt if cheating is detected, otherwise None.
    """
    cheating_patterns = [
        r"\bwrite\s+(?:for\s+me|this\s+section|my\s+thesis|the\s+draft|the\s+paragraph)\b",
        r"\bgive\s+me\s+the\s+exact\s+(?:text|paragraph|words|draft)\b",
        r"\bgenerate\s+(?:this\s+section|for\s+me|a\s+draft|the\s+text)\b",
        r"\bdo\s+it\s+for\s+me\b",
        r"\bcan\s+you\s+write\b",
        r"\bjust\s+write\b",
        r"\bcopy\s+paste\b",
        r"\bwrite\s+it\s+for\s+me\b",
    ]
    
    msg_lower = message.strip().lower()
    for pattern in cheating_patterns:
        if re.search(pattern, msg_lower):
            return (
                "I am here to coach your academic reasoning and guide your writing, not to author your thesis. "
                "Veritas AI is designed to support student authorship. Let's do the thinking together: "
                "what is the primary argument or technical finding from our indexed literature that you want to synthesize in your own words?"
            )
            
    return None
