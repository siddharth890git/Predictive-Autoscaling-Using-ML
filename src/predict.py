from pathlib import Path
import joblib
import pandas as pd
from xgboost import XGBRegressor


class TrafficPredictor:

    def __init__(self):

        self.model = XGBRegressor()

        self.model.load_model(
            Path("models") / "xgboost_model.json"
        )

        # Load feature names saved during training
        self.feature_columns = joblib.load(
            Path("models") / "feature_columns.pkl"
        )

        print("✅ XGBoost Model Loaded Successfully")

    def predict(self, features):

        if isinstance(features, pd.Series):
            features = features.to_frame().T

        elif isinstance(features, dict):
            features = pd.DataFrame([features])

        # Ensure correct feature order
        features = features[self.feature_columns]

        prediction = self.model.predict(features)

        return float(prediction[0])