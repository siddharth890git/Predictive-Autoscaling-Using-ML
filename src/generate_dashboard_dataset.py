import pandas as pd
import numpy as np

# -----------------------------
# Load dataset
# -----------------------------

df = pd.read_csv("data/processed/processed_cloud_traffic.csv")

np.random.seed(42)

# -----------------------------
# Countries
# -----------------------------

countries = [
    "United States",
    "India",
    "United Kingdom",
    "Germany",
    "Canada",
    "Japan",
    "Australia",
    "Brazil",
    "Singapore",
    "France",
    "South Korea",
    "UAE"
]

country_weights = [
    0.22,
    0.20,
    0.08,
    0.08,
    0.07,
    0.07,
    0.06,
    0.06,
    0.05,
    0.05,
    0.03,
    0.03
]

df["country"] = np.random.choice(
    countries,
    size=len(df),
    p=country_weights
)

# -----------------------------
# Region
# -----------------------------

region_map = {

    "United States":"North America",
    "Canada":"North America",

    "India":"Asia",
    "Japan":"Asia",
    "Singapore":"Asia",
    "South Korea":"Asia",
    "UAE":"Asia",

    "United Kingdom":"Europe",
    "Germany":"Europe",
    "France":"Europe",

    "Australia":"Oceania",

    "Brazil":"South America"
}

df["geo_region"] = df["country"].map(region_map)

# -----------------------------
# Device
# -----------------------------

devices = [
    "Mobile",
    "Desktop",
    "Tablet",
    "Smart TV"
]

device_weights = [
    0.45,
    0.22,
    0.08,
    0.25
]

df["device_type"] = np.random.choice(
    devices,
    len(df),
    p=device_weights
)

# -----------------------------
# Platform
# -----------------------------

platforms = [
    "Android",
    "iOS",
    "Web",
    "Android TV",
    "Apple TV"
]

platform_weights = [
    0.35,
    0.20,
    0.20,
    0.15,
    0.10
]

df["platform"] = np.random.choice(
    platforms,
    len(df),
    p=platform_weights
)

# -----------------------------
# Subscription
# -----------------------------

plans = [
    "Basic",
    "Standard",
    "Premium"
]

plan_weights = [
    0.30,
    0.40,
    0.30
]

df["subscription"] = np.random.choice(
    plans,
    len(df),
    p=plan_weights
)

# -----------------------------
# Content Type
# -----------------------------

content = [
    "Movie",
    "Series",
    "Live Sports",
    "Kids",
    "Documentary"
]

content_weights = [
    0.32,
    0.38,
    0.12,
    0.08,
    0.10
]

df["content_type"] = np.random.choice(
    content,
    len(df),
    p=content_weights
)

# -----------------------------
# Cloud Region
# -----------------------------

cloud_region = {

    "United States":"us-east-1",
    "Canada":"us-east-2",

    "India":"ap-south-1",
    "Singapore":"ap-southeast-1",
    "Japan":"ap-northeast-1",
    "South Korea":"ap-northeast-2",
    "UAE":"me-central-1",

    "Germany":"eu-central-1",
    "France":"eu-west-3",
    "United Kingdom":"eu-west-2",

    "Australia":"ap-southeast-2",

    "Brazil":"sa-east-1"

}

df["cloud_region"] = df["country"].map(cloud_region)

# -----------------------------
# Save
# -----------------------------

output = "data/processed/dashboard_dataset.csv"

df.to_csv(
    output,
    index=False
)

print("="*50)
print("Dashboard Dataset Generated")
print("="*50)
print(df.head())
print()
print(df.columns.tolist())
print()
print("Saved to:", output)