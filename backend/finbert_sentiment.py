from transformers import pipeline
import re

# Load FinBERT model once at module level
finbert_nlp = pipeline("sentiment-analysis", model="ProsusAI/finbert")

def clean_tweet(text):
    text = re.sub(r"http\\S+", "", text)  # Remove URLs
    text = re.sub(r"@[A-Za-z0-9_]+", "", text)  # Remove mentions
    text = re.sub(r"#[A-Za-z0-9_]+", "", text)  # Remove hashtags
    return text.strip()

def analyze_sentiment(tweet_text):
    cleaned = clean_tweet(tweet_text)
    result = finbert_nlp(cleaned[:512])[0]  # Truncate to 512 tokens
    return {
        "label": result["label"],  # 'Positive', 'Negative', 'Neutral'
        "score": result["score"],
        "text": cleaned
    }

# Example usage:
if __name__ == "__main__":
    tweet = "TSLA to the moon! 🚀 #TSLA"
    print(analyze_sentiment(tweet))
