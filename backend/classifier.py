from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

MODEL_VERSION = "starter-tfidf-v1"

_SCAM_EXAMPLES = [
    "urgent account suspended verify password immediately click this link",
    "your package is held pay a small delivery fee now",
    "congratulations you won a prize send gift card to claim",
    "remote job no experience guaranteed income pay onboarding fee",
    "your bank account is locked confirm your one time code",
    "tax refund waiting enter social security and bank details",
    "your mailbox is full sign in immediately to avoid losing access",
    "act now limited time offer payment required to secure account",
    "recruiter selected you for a job pay refundable equipment deposit",
    "crypto investment guaranteed returns send funds today",
    "your subscription expires today update billing information here",
    "verify your identity to prevent account closure",
    "we detected unusual activity log in using this link",
    "wire transfer required before your parcel can be released",
    "work from home earn thousands weekly pay a processing fee",
    "your payroll failed send your password to restore access",
    "gift card payment is required to unlock your prize",
    "click here immediately to confirm your bank details",
    "job offer available without interview send passport and fee",
    "security alert your account will be deleted unless you act now",
    "you have been selected claim your reward with a small fee",
    "share the verification code so we can secure your account",
    "invoice overdue pay now to avoid legal action",
    "claim inheritance send bank information and processing funds",
    "your delivery failed pay customs fee using this link",
    "investment guaranteed profit send bitcoin to double your money",
    "confirm your login credentials to avoid account suspension",
    "urgent wire funds to this new account confidentially",
    "remote assistant job pay for training before your first shift",
    "download this attachment to view your account warning",
    "your account will be suspended unless you verify now",
    "payment with prepaid cards required to receive job equipment",
]

_SAFE_EXAMPLES = [
    "the library is open until six today",
    "your appointment is confirmed for next Tuesday",
    "thanks for attending the project meeting notes are attached",
    "the public careers page lists current job openings",
    "your order has shipped track it from the official store app",
    "monthly statement is available in your banking application",
    "please review the draft when you have time",
    "the community event starts at the park on Saturday",
    "your dentist appointment reminder is for ten in the morning",
    "the invoice is available in the vendor portal you already use",
    "team lunch has moved to Friday at noon",
    "your library books are due next week",
    "the company careers website has information about this role",
    "your receipt is ready in the official retailer account",
    "class materials are posted on the school learning portal",
    "the meeting agenda includes project updates and planning",
    "your reservation is confirmed call the hotel number on its website",
    "the city recycling schedule is updated on the municipal website",
    "please bring your employee badge to the office",
    "your flight itinerary is available in the airline application",
    "the event organizer posted the schedule on their official site",
    "your payment was received and the receipt is in your account",
    "the job description and application are on our careers page",
    "your package is out for delivery there is no payment requested",
    "the weekly newsletter includes product updates and announcements",
    "your insurance documents are in the member portal",
    "the school office will be closed on the public holiday",
    "the support team replied to your question in the help center",
    "the project review is scheduled for Thursday afternoon",
    "your subscription renews next month manage it in account settings",
    "the conference registration details are on the event website",
    "the company will never ask for your password by email",
]

_pipeline = make_pipeline(
    TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1),
    LogisticRegression(max_iter=1000, random_state=17, class_weight="balanced"),
)
_pipeline.fit(
    [f"{kind} {text}" for kind, examples in (("scam", _SCAM_EXAMPLES), ("safe", _SAFE_EXAMPLES)) for text in examples],
    [1] * len(_SCAM_EXAMPLES) + [0] * len(_SAFE_EXAMPLES),
)


def scam_probability(content: str, scan_type: str) -> float:
    return float(_pipeline.predict_proba([f"{scan_type} {content}"])[0][1])
