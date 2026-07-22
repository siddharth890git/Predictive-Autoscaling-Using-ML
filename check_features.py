import joblib

cols = joblib.load("models/feature_columns.pkl")

print(cols)
print()
print("Total Features:", len(cols))