from fastapi import FastAPI
from model import predict, TradeFeatures

app = FastAPI()

@app.post("/predict")
def predict_trade(features: TradeFeatures):
    return predict(features)

@app.get("/")
def read_root():
    return {"message": "Inference Server is running"}
