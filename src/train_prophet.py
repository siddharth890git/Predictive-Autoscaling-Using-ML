import pandas as pd
import joblib
from pathlib import Path

from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# =====================================================
# Load Dataset
# =====================================================

DATA_PATH = Path("data/processed/processed_cloud_traffic.csv")

df = pd.read_csv(DATA_PATH)

print("=" * 50)
print("Dataset Loaded Successfully")
print("=" * 50)

# Prophet requires ds and y columns
prophet_df = df[["timestamp", "request_count"]].copy()

prophet_df.columns = ["ds", "y"]

prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])

# =====================================================
# Train/Test Split
# =====================================================

split = int(len(prophet_df) * 0.8)

train = prophet_df.iloc[:split]
test = prophet_df.iloc[split:]

print(f"Training : {len(train)}")
print(f"Testing  : {len(test)}")

# =====================================================
# Train Prophet
# =====================================================

print("\nTraining Prophet...\n")

model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=True
)

model.fit(train)

print("Training Completed")

# =====================================================
# Prediction
# =====================================================

future = test[["ds"]]

forecast = model.predict(future)

pred = forecast["yhat"].values

# =====================================================
# Evaluation
# =====================================================

mae = mean_absolute_error(test["y"], pred)
rmse = np.sqrt(mean_squared_error(test["y"], pred))
r2 = r2_score(test["y"], pred)

print("\n")
print("=" * 50)
print("PROPHET PERFORMANCE")
print("=" * 50)

print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")

# =====================================================
# Save Model
# =====================================================

MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

joblib.dump(model, MODEL_DIR / "prophet_model.pkl")

print("\nModel Saved Successfully")

# =====================================================
# Save Predictions
# =====================================================

results = pd.DataFrame({
    "Actual": test["y"].values,
    "Predicted": pred
})

results.to_csv(
    MODEL_DIR / "prophet_predictions.csv",
    index=False
)

print("Prediction File Saved")