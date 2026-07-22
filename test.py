import pandas as pd

df = pd.read_csv("data/processed/dashboard_dataset.csv")

print(df.columns.tolist())