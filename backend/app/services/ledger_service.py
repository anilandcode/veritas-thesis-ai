import datetime
from sqlalchemy.orm import Session
from app import models

def compute_draft_hash(section_key: str, text: str) -> str:
    """
    Zero-dependency string hashing algorithm matching React's client-side implementation.
    """
    combined = f"{section_key}:{text or ''}"
    hash_val = 0
    for char in combined:
        # Replicate JS bitwise logic: hash = (hash << 5) - hash + combined.charCodeAt(i)
        hash_val = (hash_val << 5) - hash_val + ord(char)
        # Emulate JS 32-bit signed integer conversion: hash |= 0
        hash_val &= 0xFFFFFFFF
        if hash_val >= 0x80000000:
            hash_val -= 0x100000000
            
    abs_hash = abs(hash_val)
    return hex(abs_hash)[2:].upper()

def get_formatted_signature(section_key: str, text: str, date_str: str = None) -> str:
    """
    Generates the full VERITAS-AUTH-SIG-[HASH]-[DATE] string.
    """
    hex_hash = compute_draft_hash(section_key, text)
    if not date_str:
        # Use current date in M/D/YYYY format (standard Javascript Date.toLocaleDateString() format)
        now = datetime.datetime.now()
        # Formats without leading zeros for parity with standard JS locales
        date_str = f"{now.month}/{now.day}/{now.year}"
    return f"VERITAS-AUTH-SIG-{hex_hash}-{date_str}"

def log_ledger_entry(
    thesis_id: int,
    section_key: str,
    action: str,
    draft_text: str,
    plagiarism_index: float,
    synthesis_count: int,
    db: Session
) -> models.AuthorshipLedger:
    """
    Logs an organic drafting action into the immutable AuthorshipLedger database table.
    """
    verification_sig = get_formatted_signature(section_key, draft_text)
    
    ledger_item = models.AuthorshipLedger(
        thesis_id=thesis_id,
        section_key=section_key,
        action=action,
        draft_text=draft_text,
        character_count=len(draft_text) if draft_text else 0,
        plagiarism_index=plagiarism_index,
        synthesis_count=synthesis_count,
        verification_sig=verification_sig
    )
    
    db.add(ledger_item)
    db.commit()
    db.refresh(ledger_item)
    return ledger_item
