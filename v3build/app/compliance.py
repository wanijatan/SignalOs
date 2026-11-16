OPT_OUT_WORDS = {"unsubscribe", "stop", "remove me", "do not contact", "don't contact", "dnc"}

def detects_opt_out(text: str) -> bool:
    t = (text or "").lower()
    return any(x in t for x in OPT_OUT_WORDS)

def should_stop(status: str, booked: bool = False) -> bool:
    return status in {"OPTED_OUT", "DNC", "BOUNCED", "DISQUALIFIED"} or booked
