def clamp(v, lo=0, hi=100):
    return max(lo, min(hi, float(v)))

def score_prospect(fit_score, evidence_scores=None, contactability=0, recency=0):
    evidence_scores = evidence_scores or []
    evidence = sum(evidence_scores) / len(evidence_scores) if evidence_scores else 0
    # Explainable baseline: fit 35%, intent evidence 40%, contactability 15%, recency 10%.
    total = 0.35*clamp(fit_score) + 0.40*clamp(evidence) + 0.15*clamp(contactability) + 0.10*clamp(recency)
    return round(clamp(total), 2)

def score_breakdown(fit_score, evidence_scores=None, contactability=0, recency=0):
    evidence_scores = evidence_scores or []
    evidence = sum(evidence_scores) / len(evidence_scores) if evidence_scores else 0
    total = score_prospect(fit_score, evidence_scores, contactability, recency)
    return {
        "total": total,
        "fit": round(0.35*clamp(fit_score), 2),
        "intent_evidence": round(0.40*clamp(evidence), 2),
        "contactability": round(0.15*clamp(contactability), 2),
        "recency": round(0.10*clamp(recency), 2),
    }
