import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor

# =====================================================
# Load Dataset
# =====================================================

DATA_PATH = Path("data/processed/processed_cloud_traffic.csv")

df = pd.read_csv(DATA_PATH)

print("=" * 60)
print("Dataset Loaded")
print("=" * 60)

# =====================================================
# Create Future Target (15 Minutes Ahead)
# =====================================================

FORECAST_STEPS = 3      # 3 x 5 minutes = 15 minutes

df["target"] = df["request_count"].shift(-FORECAST_STEPS)

# Remove last rows without future target
df = df.dropna().reset_index(drop=True)

print(f"Forecast Horizon : {FORECAST_STEPS * 5} Minutes")

# =====================================================
# Features
# =====================================================

DROP_COLUMNS = [
    "timestamp",
    "request_count",
    "target"
]

X = df.drop(columns=DROP_COLUMNS)

y = df["target"]

print("Features :", X.shape[1])
print("Samples  :", len(df))

# =====================================================
# Train/Test Split
# =====================================================

split = int(len(df) * 0.8)

X_train = X.iloc[:split]
X_test = X.iloc[split:]

y_train = y.iloc[:split]
y_test = y.iloc[split:]

print("Training Samples :", len(X_train))
print("Testing Samples  :", len(X_test))

# =====================================================
# Train Model
# =====================================================

model = XGBRegressor(
    objective="reg:squarederror",
    n_estimators=500,
    learning_rate=0.05,
    max_depth=8,
    min_child_weight=3,
    subsample=0.8,
    colsample_bytree=0.8,
    gamma=0.1,
    random_state=42,
    n_jobs=-1
)

print("\nTraining...\n")

model.fit(X_train, y_train)

print("Training Completed")

# =====================================================
# Prediction
# =====================================================

pred = model.predict(X_test)

# =====================================================
# Metrics
# =====================================================

mae = mean_absolute_error(y_test, pred)
rmse = np.sqrt(mean_squared_error(y_test, pred))
r2 = r2_score(y_test, pred)

print("\n")
print("=" * 60)
print("FUTURE TRAFFIC PREDICTION")
print("=" * 60)

print(f"Forecast Horizon : {FORECAST_STEPS * 5} Minutes")
print(f"MAE  : {mae:.2f}")
print(f"RMSE : {rmse:.2f}")
print(f"R²   : {r2:.4f}")

# =====================================================
# Save Model
# =====================================================

MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

model.save_model(MODEL_DIR / "xgboost_model.json")

joblib.dump(
    model,
    MODEL_DIR / "xgboost_model.pkl"
)

print("\nModel Saved")

# =====================================================
# Save Feature Names
# =====================================================

joblib.dump(
    list(X.columns),
    MODEL_DIR / "feature_columns.pkl"
)

print("Feature Names Saved")

# =====================================================
# Save Predictions
# =====================================================

results = pd.DataFrame({

    "Actual Future Requests": y_test,

    "Predicted Future Requests": pred

})

results.to_csv(

    MODEL_DIR / "future_predictions.csv",

    index=False

)

print("Prediction File Saved")