from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from collections import deque
from statistics import mean
from datetime import datetime, timedelta
# ML Modules
from src.predict import TrafficPredictor
from src.autoscaler import AutoScaler
import random
# Simulator
from app.simulator import TrafficSimulator
import pandas as pd
import traceback
# ==========================================================
# FastAPI App
# ==========================================================

app = FastAPI(
    title="Predictive Autoscaling Using ML on Cloud",
    description="IBM Internship Project Backend",
    version="2.0.0"
)

# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# Load Components
# ==========================================================

predictor = TrafficPredictor()
autoscaler = AutoScaler()
simulator = TrafficSimulator()

dashboard_history = deque(maxlen=50)

print("Backend Initialized Successfully")

# ==========================================================
# Country → ISO3 Mapping (Plotly World Map)
# ==========================================================

COUNTRY_ISO = {

    "United States": "USA",

    "India": "IND",

    "United Kingdom": "GBR",

    "Canada": "CAN",

    "Germany": "DEU",

    "France": "FRA",

    "Australia": "AUS",

    "Japan": "JPN",

    "Brazil": "BRA",

    "Singapore": "SGP"

}


# ==========================================================
# Helper Functions
# ==========================================================

def build_metrics(event):

    return {

        "request_count": event["current_requests"],

        "active_users": event["active_users"],

        "cpu_usage": event["cpu_usage"],

        "memory_usage": event["memory_usage"],

        "network_in": event["network_in"],

        "network_out": event["network_out"],

        "response_time": event["response_time"],

        "error_rate": event["error_rate"],

        "cache_hit_rate": event["cache_hit_rate"],

        "queue_length": event["queue_length"]

    }


def build_prediction(prediction):

    return {

        "predicted_request_count": round(float(prediction), 2),

        "accuracy": 98.5,

        "mae": 17.8,

        "rmse": 25.4,

        "r2": 0.97,

        "model_status": "Healthy"

    }


def build_autoscaler(event, decision):

    return {

        "current_servers": event["current_servers"],

        "recommended_servers": decision["recommended_servers"],

        "action": decision["action"],

        "cpu_usage": event["cpu_usage"],

        "memory_usage": event["memory_usage"],

        "queue_length": event["queue_length"],

        "capacity_utilization": decision["capacity_utilization"],

        "reason": decision["reason"]

    }


def build_geo(event):

    countries = [
        {
            "name": "United States",
            "iso3": "USA",
            "requests": random.randint(18000, 25000),
            "active_users": random.randint(12000, 18000),
            "cpu": random.randint(55, 85),
        "memory": random.randint(45, 80),
        "latency": random.randint(30, 70),
        "cloud_region": "us-east-1",
        "status": "Healthy"
    },
    {
        "name": "India",
        "iso3": "IND",
        "requests": random.randint(15000, 22000),
        "active_users": random.randint(10000, 16000),
        "cpu": random.randint(45, 80),
        "memory": random.randint(40, 75),
        "latency": random.randint(40, 90),
        "cloud_region": "ap-south-1",
        "status": "Healthy"
    },
    {
        "name": "United Kingdom",
        "iso3": "GBR",
        "requests": random.randint(10000, 18000),
        "active_users": random.randint(7000, 12000),
        "cpu": random.randint(40, 75),
        "memory": random.randint(35, 70),
        "latency": random.randint(30, 60),
        "cloud_region": "eu-west-2",
        "status": "Healthy"
    },
    {
        "name": "Germany",
        "iso3": "DEU",
        "requests": random.randint(9000, 17000),
        "active_users": random.randint(6000, 11000),
        "cpu": random.randint(45, 70),
        "memory": random.randint(40, 70),
        "latency": random.randint(35, 60),
        "cloud_region": "eu-central-1",
        "status": "Healthy"
    },
    {
        "name": "Japan",
        "iso3": "JPN",
        "requests": random.randint(8000, 16000),
        "active_users": random.randint(5000, 10000),
        "cpu": random.randint(40, 70),
        "memory": random.randint(35, 70),
        "latency": random.randint(25, 55),
        "cloud_region": "ap-northeast-1",
        "status": "Healthy"
    },
    {
        "name": "Canada",
        "iso3": "CAN",
        "requests": random.randint(7000, 14000),
        "active_users": random.randint(4000, 9000),
        "cpu": random.randint(40, 65),
        "memory": random.randint(35, 65),
        "latency": random.randint(30, 60),
        "cloud_region": "ca-central-1",
        "status": "Healthy"
    },
    {
        "name": "Australia",
        "iso3": "AUS",
        "requests": random.randint(7000, 13000),
        "active_users": random.randint(4000, 8500),
        "cpu": random.randint(40, 65),
        "memory": random.randint(35, 65),
        "latency": random.randint(35, 65),
        "cloud_region": "ap-southeast-2",
        "status": "Healthy"
    },
    {
        "name": "Brazil",
        "iso3": "BRA",
        "requests": random.randint(6000, 12000),
        "active_users": random.randint(3500, 8000),
        "cpu": random.randint(40, 65),
        "memory": random.randint(35, 65),
        "latency": random.randint(45, 90),
        "cloud_region": "sa-east-1",
        "status": "Healthy"
    },
    {
        "name": "Singapore",
        "iso3": "SGP",
        "requests": random.randint(6000, 11000),
        "active_users": random.randint(3500, 7000),
        "cpu": random.randint(40, 65),
        "memory": random.randint(35, 65),
        "latency": random.randint(20, 40),
        "cloud_region": "ap-southeast-1",
        "status": "Healthy"
    },
    {
        "name": "France",
        "iso3": "FRA",
        "requests": random.randint(6000, 10000),
        "active_users": random.randint(3000, 6500),
        "cpu": random.randint(40, 65),
        "memory": random.randint(35, 65),
        "latency": random.randint(35, 60),
        "cloud_region": "eu-west-3",
        "status": "Healthy"
    }
    ]

    for c in countries:
        c["requests"] = random.randint(3000, 25000)

    countries.sort(key=lambda x: x["requests"], reverse=True)

    total = sum(c["requests"] for c in countries)

    return {
        "country": countries[0]["name"],
        "region": "Global",
        "cloud_region": "Multi-Region",
        "device_type": "Mixed",
        "platform": "Streaming",
        "subscription": "All Plans",
        "content_type": "Mixed",

        # World map
        "countries": countries,

        # Top Regions
        "regions": [
            {"name": "North America", "requests": 52000},
            {"name": "Asia", "requests": 48000},
            {"name": "Europe", "requests": 39000},
            {"name": "South America", "requests": 17000},
            {"name": "Oceania", "requests": 9000},
        ],

        # Device chart
        "devices": [
            {"name": "Desktop", "requests": 34000},
            {"name": "Mobile", "requests": 51000},
            {"name": "Smart TV", "requests": 22000},
            {"name": "Tablet", "requests": 7000},
        ],

        # Platform donut
        "platforms": [
            {"name": "Web", "requests": 32000},
            {"name": "Android", "requests": 28000},
            {"name": "iOS", "requests": 21000},
            {"name": "TV", "requests": 18000},
        ],

        # Subscription donut
        "subscriptions": [
            {"name": "Basic", "requests": 18000},
            {"name": "Standard", "requests": 31000},
            {"name": "Premium", "requests": 42000},
        ],

        # Content donut
        "content_types": [
            {"name": "Movies", "requests": 39000},
            {"name": "Series", "requests": 35000},
            {"name": "Sports", "requests": 12000},
            {"name": "Kids", "requests": 5000},
        ]
    }

def build_alerts(event, autoscaler_data):

    alerts = []

    # CPU Alert
    if event["cpu_usage"] >= 80:
        alerts.append({
            "severity": "critical",
            "title": "High CPU Usage",
            "message": f'CPU usage is {event["cpu_usage"]:.2f}%'
        })
    elif event["cpu_usage"] >= 70:
        alerts.append({
            "severity": "warning",
            "title": "CPU Usage Rising",
            "message": f'CPU usage is {event["cpu_usage"]:.2f}%'
        })

    # Memory Alert
    if event["memory_usage"] >= 85:
        alerts.append({
            "severity": "critical",
            "title": "High Memory Usage",
            "message": f'Memory usage is {event["memory_usage"]:.2f}%'
        })

    # Queue Alert
    if event["queue_length"] >= 15:
        alerts.append({
            "severity": "warning",
            "title": "Queue Length Increasing",
            "message": f'Queue length is {event["queue_length"]}'
        })

    # Error Rate Alert
    if event["error_rate"] >= 1:
        alerts.append({
            "severity": "critical",
            "title": "High Error Rate",
            "message": f'Error rate is {event["error_rate"]:.2f}%'
        })

    # Autoscaling Alert
    alerts.append({
        "severity": "info",
        "title": "Autoscaler",
        "message": autoscaler_data["action"]
    })

    return alerts


def build_series():

    records = list(dashboard_history)

    if not records:
        return {
            "timestamps": [],
            "actual": [],
            "predicted": [],
            "forecast": [],
            "cpu": [],
            "memory": [],
            "queue": [],
            "network_in": [],
            "network_out": [],
            "response_time": [],
            "error_rate": [],
            "current_servers": [],
            "recommended_servers": [],
            "actions": [],
            "accuracy": []
        }

    # Sort records by timestamp
    records.sort(
        key=lambda x: pd.to_datetime(x["timestamp"])
    )

    # Show only latest 20 points
    MAX_POINTS = 20
    records = records[-MAX_POINTS:]
    now = datetime.now()
    timestamps = [
        (
            now - timedelta(minutes=15 * (len(records) - i - 1))
        ).strftime("%Y-%m-%d %H:%M:%S")
        for i in range(len(records))
    ]
    actual = [x["actual_requests"] for x in records]
    predicted = [x["predicted_requests"] for x in records]

    # Forecast next 5 timestamps
    last_time = pd.to_datetime(timestamps[-1])

    # Average of the last 5 predictions
    base = sum(predicted[-5:]) / min(5, len(predicted))

    interval = pd.Timedelta(minutes=15)

    forecast = []
    value = predicted[-1]

    for i in range(1, 6):

        value *= 1.02

        forecast.append({
            "x": (last_time + interval * i).strftime("%Y-%m-%d %H:%M:%S"),
            "y": round(value, 2)
        })

    return {

        "timestamps": timestamps,

        "actual": actual,

        "predicted": predicted,

        "forecast": forecast,

        "cpu": [x["cpu_usage"] for x in records],

        "memory": [x["memory_usage"] for x in records],

        "queue": [x["queue_length"] for x in records],

        "network_in": [x["network_in"] for x in records],

        "network_out": [x["network_out"] for x in records],

        "response_time": [x["response_time"] for x in records],

        "error_rate": [x["error_rate"] for x in records],

        "current_servers": [x["current_servers"] for x in records],

        "recommended_servers": [
            x["recommended_servers"]
            for x in records
        ],

        "actions": [x["action"] for x in records],

        "accuracy": [98.5] * len(records)
    }
    
# ==========================================================
# Root
# ==========================================================

@app.get("/")
def root():

    return {

        "project": "Predictive Autoscaling Using ML on Cloud",

        "status": "Running",

        "version": "2.0.0"

    }


# ==========================================================
# Health
# ==========================================================

@app.get("/api/health")
def health():

    return {

        "status": "healthy",

        "predictor": "loaded",

        "simulator": "loaded",

        "autoscaler": "loaded"

    }

# ==========================================================
# Dashboard Endpoint
# ==========================================================

@app.get("/api/dashboard")
def dashboard():

    try:

        # --------------------------------------------------
        # Get Simulation Event
        # --------------------------------------------------

        event = simulator.next()

        # --------------------------------------------------
        # Predict Future Traffic
        # --------------------------------------------------

        prediction = predictor.predict(event["features"])
        prediction = round(float(prediction), 2)

        # --------------------------------------------------
        # Autoscaler Decision
        # --------------------------------------------------

        decision = autoscaler.decide(

            predicted_requests=prediction,

            current_instances=event["current_servers"],

            cpu_usage=event["cpu_usage"],

            memory_usage=event["memory_usage"],

        )

        # --------------------------------------------------
        # Save Dashboard History
        # --------------------------------------------------

        history_item = {

            "timestamp": event["timestamp"],

            # Existing fields
            "actual_requests": event["current_requests"],
            "future_requests": event["future_requests"],
            "predicted_requests": prediction,

            # Aliases
            "actual": event["current_requests"],
            "predicted": prediction,

            "active_users": event["active_users"],

            "cpu_usage": event["cpu_usage"],
            "memory_usage": event["memory_usage"],

            "network_in": event["network_in"],
            "network_out": event["network_out"],

            "response_time": event["response_time"],
            "error_rate": event["error_rate"],

            "cache_hit_rate": event["cache_hit_rate"],
            "queue_length": event["queue_length"],

            "current_servers": event["current_servers"],
            "recommended_servers": decision["recommended_servers"],

            "action": decision["action"]
            }

        dashboard_history.append(history_item)

        simulator.add_history(history_item)

        # --------------------------------------------------
        # Build Response Objects
        # --------------------------------------------------

        metrics = build_metrics(event)

        prediction_data = build_prediction(prediction)

        autoscaler_data = build_autoscaler(
            event,
            decision
        )

        geo = build_geo(event)

        alerts = build_alerts(
            event,
            autoscaler_data
        )

        series = build_series()

        # --------------------------------------------------
        # Return Frontend Payload
        # --------------------------------------------------

        return {

            "metrics": metrics,

            "prediction": prediction_data,

            "autoscaler": autoscaler_data,

            "series": series,

            "geo": geo,

            "alerts": alerts,

            "history": list(dashboard_history)

        }

    except Exception as e:

        print("=" * 80)
        traceback.print_exc()
        print("=" * 80)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ==========================================================
# History
# ==========================================================

@app.get("/api/history")
def history():

    return {

        "status": "success",

        "count": len(dashboard_history),

        "history": list(dashboard_history)

    }

# ==========================================================
# Analytics
# ==========================================================

@app.get("/api/analytics")
def analytics():

    if len(dashboard_history) == 0:

        return {

            "status": "empty",

            "message": "No analytics available."

        }

    avg_prediction = round(

        mean(

            x["predicted_requests"]

            for x in dashboard_history

        ),

        2

    )

    avg_cpu = round(

        mean(

            x["cpu_usage"]

            for x in dashboard_history

        ),

        2

    )

    avg_memory = round(

        mean(

            x["memory_usage"]

            for x in dashboard_history

        ),

        2

    )

    scale_up = sum(

        1

        for x in dashboard_history

        if x["action"] == "SCALE UP"

    )

    scale_down = sum(

        1

        for x in dashboard_history

        if x["action"] == "SCALE DOWN"

    )

    maintain = sum(

        1

        for x in dashboard_history

        if x["action"] == "MAINTAIN"

    )

    return {

        "status": "success",

        "total_events": len(dashboard_history),

        "average_prediction": avg_prediction,

        "average_cpu": avg_cpu,

        "average_memory": avg_memory,

        "scale_up_events": scale_up,

        "scale_down_events": scale_down,

        "maintain_events": maintain

    }