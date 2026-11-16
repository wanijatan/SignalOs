from app.scoring import score_prospect, score_breakdown
from app.compliance import detects_opt_out, should_stop

def test_score_range():
    assert 0 <= score_prospect(90, [90, 80], 100, 100) <= 100

def test_breakdown():
    x = score_breakdown(80, [80], 100, 100)
    assert x["total"] > 70
    assert set(x) == {"total","fit","intent_evidence","contactability","recency"}

def test_opt_out():
    assert detects_opt_out("Please unsubscribe me")
    assert not detects_opt_out("Send me details")

def test_stop():
    assert should_stop("OPTED_OUT")
    assert should_stop("ACTIVE", booked=True)
    assert not should_stop("ACTIVE", booked=False)
