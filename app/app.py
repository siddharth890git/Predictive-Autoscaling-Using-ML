import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import streamlit as st
import pandas as pd
from streamlit_autorefresh import st_autorefresh
from simulator import TrafficSimulator
from dashboard import Dashboard
from live_analytics import LiveAnalytics

from src.predict import TrafficPredictor
from src.autoscaler import AutoScaler
from alerts import AlertPanel
from cards import Cards
# -----------------------------------
# Page Configuration
# -----------------------------------

st.set_page_config(
    page_title="Predictive Autoscaling",
    page_icon="☁️",
    layout="wide"
)
st_autorefresh(
    interval=2000,
    key="traffic_refresh"
)
# -----------------------------------
# Create Objects Once
# -----------------------------------

if "simulator" not in st.session_state:
    st.session_state.simulator = TrafficSimulator()

if "predictor" not in st.session_state:
    st.session_state.predictor = TrafficPredictor()

if "autoscaler" not in st.session_state:
    st.session_state.autoscaler = AutoScaler()

# -----------------------------------
# Header
# -----------------------------------

Dashboard.show_header()

# -----------------------------------
# Simulate Next Reading
# -----------------------------------

data = st.session_state.simulator.next()

# -----------------------------------
# Prediction
# -----------------------------------

prediction = st.session_state.predictor.predict(
    data["features"]
)

# -----------------------------------
# Autoscaling
# -----------------------------------

decision = st.session_state.autoscaler.decide(
    predicted_requests=prediction,
    current_instances=data["current_servers"],
    cpu_usage=data["cpu_usage"],
    memory_usage=data["memory_usage"]
)

# -----------------------------------
# Save History
# -----------------------------------

history_item = {

    "timestamp": data["timestamp"],

    "actual_requests": data["current_requests"],

    "future_requests": data["future_requests"],

    "predicted_requests": prediction,

    "cpu_usage": data["cpu_usage"],

    "memory_usage": data["memory_usage"],

    "recommended_servers": decision["recommended_instances"],

    "action": decision["action"],

    # Live Analytics Fields

    "country": data["country"],

    "geo_region": data["geo_region"],

    "device_type": data["device_type"],

    "platform": data["platform"],

    "subscription": data["subscription"],

    "content_type": data["content_type"],

    "cloud_region": data["cloud_region"]

}

st.session_state.simulator.add_history(
    history_item
)

history = st.session_state.simulator.get_history()

# -----------------------------------
# Dashboard Data
# -----------------------------------

dashboard_data = {

    "actual_requests": data["current_requests"],

    "predicted_requests": prediction,

    "future_requests": data["future_requests"],

    "current_servers": data["current_servers"],

    "recommended_servers": decision["recommended_instances"],

    "cpu_usage": data["cpu_usage"],

    "memory_usage": data["memory_usage"],

    "queue_length": data["queue_length"],

    "action": decision["action"],

    "reason": decision["reason"]

}

# -----------------------------------
# Render Dashboard
# -----------------------------------

Dashboard.show_metrics(
    dashboard_data
)

Dashboard.show_resource_metrics(
    dashboard_data
)

# Dashboard.show_decision(
#     dashboard_data
# )
st.subheader("📊 Live Infrastructure")

col1, col2, col3, col4 = st.columns(4)

with col1:

    Cards.metric_card(
        "Current Traffic",
        int(dashboard_data["actual_requests"]),
        "🌐",
        "#2563EB",
        "Live"
    )

with col2:

    Cards.metric_card(
        "Predicted (+15m)",
        int(dashboard_data["predicted_requests"]),
        "🤖",
        "#7C3AED",
        "Forecast"
    )

with col3:

    Cards.metric_card(
        "CPU Usage",
        f"{dashboard_data['cpu_usage']:.1f}%",
        "⚙️",
        "#EA580C",
        "Realtime"
    )

with col4:

    Cards.metric_card(
        "Servers",
        dashboard_data["recommended_servers"],
        "☁️",
        "#059669",
        dashboard_data["action"]
    )
    
AlertPanel.show(
    dashboard_data
)
Dashboard.show_charts(
    history
)

Dashboard.show_history(
    pd.DataFrame(history)
)
st.divider()

LiveAnalytics.country_map(history)

col1, col2 = st.columns(2)

with col1:
    LiveAnalytics.top_countries(history)

with col2:
    LiveAnalytics.device_distribution(history)

LiveAnalytics.subscription_distribution(history)

st.caption("Prediction Horizon : 15 Minutes")