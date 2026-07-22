<div align="center">

# Software Requirements Specification (SRS)

## Predictive Autoscaling Using Machine Learning on Cloud

**Document Version:** 2.0.0 &nbsp;|&nbsp; **Date:** July 2026 &nbsp;|&nbsp; **Classification:** IBM Internal

</div>

---

## Document Control

| Field | Details |
| :--- | :--- |
| **Project Title** | Predictive Autoscaling Using Machine Learning on Cloud |
| **Document Type** | Software Requirements Specification (IEEE 830-1998 Compliant) |
| **Organization** | IBM SkillsBuild Internship Program |
| **Prepared By** | Siddharth Negi, Kartikeya Singh, Chitranshi Maheshwari, Apoorv Aditya Jha, Abhinav Pandey |
| **Reviewed By** | [Mentor Name], IBM Technical Reviewer |
| **Version** | 2.0.0 |
| **Last Updated** | July 2026 |

### Revision History

| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| 1.0.0 | May 2026 | Team | Initial draft with core requirements |
| 1.5.0 | June 2026 | Team | Added ML pipeline and dashboard specifications |
| 2.0.0 | July 2026 | Team | Final release — production-verified specifications |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Architecture](#3-system-architecture)
4. [Functional Requirements](#4-functional-requirements)
5. [Data Requirements](#5-data-requirements)
6. [Machine Learning Requirements](#6-machine-learning-requirements)
7. [API Specification](#7-api-specification)
8. [User Interface Requirements](#8-user-interface-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [External Interface Requirements](#10-external-interface-requirements)
11. [System Constraints & Assumptions](#11-system-constraints--assumptions)
12. [Acceptance Criteria](#12-acceptance-criteria)
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete and detailed description of the functional and non-functional requirements for the **Predictive Autoscaling Using Machine Learning on Cloud** system. It is intended for use by:

- Development engineers implementing the system
- Quality assurance engineers validating the system
- IBM technical reviewers evaluating the internship deliverable
- Academic faculty conducting the university viva examination

### 1.2 Scope

The system is an intelligent, end-to-end machine learning pipeline that:

1. **Ingests** historical cloud infrastructure telemetry data (CPU, Memory, Network I/O, Request Counts).
2. **Engineers** 38 predictive features from raw metrics using temporal, lag, rolling, and derived transformations.
3. **Trains** an XGBoost gradient-boosted regression model to forecast cloud traffic 15 minutes (3 × 5-minute intervals) ahead.
4. **Evaluates** autoscaling decisions (Scale Up / Scale Down / Maintain) through a deterministic, multi-metric rule engine.
5. **Serves** predictions and infrastructure state via a high-performance FastAPI REST backend.
6. **Visualizes** the entire pipeline on a decoupled, real-time HTML5/JavaScript analytics dashboard with 9 interactive panels.

The system is **not** a production cloud controller. It is a simulation-based proof-of-concept that demonstrates the viability and superiority of ML-driven autoscaling over traditional reactive approaches.

### 1.3 Definitions, Acronyms & Abbreviations

| Term | Definition |
| :--- | :--- |
| **SRS** | Software Requirements Specification |
| **ML** | Machine Learning |
| **XGBoost** | Extreme Gradient Boosting — a scalable tree-based ML framework |
| **API** | Application Programming Interface |
| **REST** | Representational State Transfer |
| **CORS** | Cross-Origin Resource Sharing |
| **MAE** | Mean Absolute Error |
| **RMSE** | Root Mean Squared Error |
| **R²** | Coefficient of Determination |
| **SLA** | Service Level Agreement |
| **ASG** | Auto Scaling Group (AWS) |
| **KPI** | Key Performance Indicator |
| **EDA** | Exploratory Data Analysis |
| **CRUD** | Create, Read, Update, Delete |

### 1.4 References

| # | Reference | Source |
| :--- | :--- | :--- |
| 1 | IEEE 830-1998 — Recommended Practice for SRS | IEEE Standards Association |
| 2 | XGBoost: A Scalable Tree Boosting System | Chen & Guestrin, KDD 2016 |
| 3 | Gartner Cloud Infrastructure Report, 2024 | Gartner Inc. |
| 4 | FastAPI Official Documentation | https://fastapi.tiangolo.com |
| 5 | AWS Auto Scaling Documentation | https://aws.amazon.com/autoscaling |

---

## 2. Overall Description

### 2.1 Product Perspective

This system operates as a **standalone simulation engine** that replicates the behavior of a cloud autoscaler in a controlled environment. It is designed to be horizontally extensible — the Python-based autoscaler logic can be replaced with native cloud provider APIs (e.g., AWS ASG, IBM IKS) for production deployment with minimal architectural changes.

### 2.2 Product Functions (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                   SYSTEM FUNCTION MAP                        │
├─────────────────────────────────────────────────────────────┤
│  F1. Data Ingestion & Preprocessing                         │
│  F2. Feature Engineering Pipeline (38 Features)             │
│  F3. XGBoost Model Training & Serialization                 │
│  F4. Real-Time Traffic Simulation Engine                     │
│  F5. Predictive Inference Engine (<5ms Latency)             │
│  F6. Autoscaling Decision Engine (Scale Up/Down/Maintain)   │
│  F7. RESTful API Backend (FastAPI, 5 Endpoints)             │
│  F8. Real-Time Analytics Dashboard (9 Panels)               │
│  F9. Global Geographic Analytics & Visualization            │
│  F10. Alert & Notification System                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 User Classes & Characteristics

| User Class | Description | Technical Level |
| :--- | :--- | :--- |
| **Cloud Engineer** | Monitors infrastructure health and scaling decisions | High |
| **Data Scientist** | Reviews model accuracy, feature importance, and predictions | High |
| **Operations Manager** | Tracks KPIs, cost optimization, and SLA compliance | Medium |
| **Academic Reviewer** | Evaluates the end-to-end ML pipeline and system design | High |

### 2.4 Operating Environment

| Component | Specification |
| :--- | :--- |
| **Operating System** | Windows 10/11, Ubuntu 20.04+, macOS 12+ |
| **Runtime** | Python 3.11+ |
| **Containerization** | Docker 24.0+, Docker Compose 2.20+ |
| **Browser** | Chrome 110+, Firefox 110+, Edge 110+ |
| **Hardware (Min)** | 4 GB RAM, 2-Core CPU, 5 GB Disk |

### 2.5 Design & Implementation Constraints

| Constraint | Details |
| :--- | :--- |
| C1 | The ML model must be serializable to JSON format (`xgboost_model.json`) for portability. |
| C2 | The frontend must be fully decoupled from the backend — no server-side rendering. |
| C3 | The API must support CORS for cross-origin dashboard requests. |
| C4 | All autoscaler decisions must be deterministic and reproducible for a given input state. |
| C5 | The system must operate without any external cloud API keys for local demonstration. |

---

## 3. System Architecture

### 3.1 Architectural Overview

The system follows a **layered microservice architecture** with strict separation of concerns:

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                            │
│   HTML5 / CSS3 / JavaScript / Bootstrap 5 / ApexCharts / Plotly  │
│   9 Dashboard Panels • Polling Architecture (5s interval)        │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP/REST (JSON)
┌────────────────────────────▼─────────────────────────────────────┐
│                         API LAYER                                │
│   FastAPI v0.100+ • Uvicorn ASGI • CORS Middleware               │
│   Endpoints: /, /api/health, /api/dashboard, /api/history,       │
│              /api/analytics                                      │
└───────┬──────────────────┬──────────────────┬────────────────────┘
        │                  │                  │
┌───────▼──────┐  ┌────────▼───────┐  ┌───────▼──────────┐
│  SIMULATION  │  │  ML INFERENCE  │  │   AUTOSCALER     │
│   ENGINE     │  │    ENGINE      │  │   DECISION       │
│              │  │                │  │   ENGINE         │
│ TrafficSim-  │  │ TrafficPre-    │  │ AutoScaler       │
│ ulator       │  │ dictor         │  │ .decide()        │
│ .next()      │  │ .predict()     │  │                  │
└───────┬──────┘  └────────┬───────┘  └──────────────────┘
        │                  │
┌───────▼──────────────────▼───────────────────────────────────────┐
│                         DATA LAYER                               │
│   cloud_traffic_dataset.csv (100K rows) → Pandas DataFrame       │
│   processed_cloud_traffic.csv → 38 Engineered Features           │
│   xgboost_model.json → Serialized Trained Model                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Inventory

| Component | File(s) | Responsibility |
| :--- | :--- | :--- |
| **FastAPI Server** | `main.py` | Application entry point, endpoint routing, response assembly |
| **Traffic Predictor** | `src/predict.py` | Loads XGBoost model, accepts feature vectors, returns predictions |
| **AutoScaler Engine** | `src/autoscaler.py` | Evaluates multi-metric scaling rules against predictions |
| **Traffic Simulator** | `app/simulator.py` | Iterates through historical dataset to simulate live traffic |
| **XGBoost Trainer** | `src/train_xgboost.py` | Trains and serializes the regression model |
| **Dashboard Frontend** | `frontend/` | Decoupled HTML/JS/CSS client with ApexCharts & Plotly |
| **Docker Deployment** | `deployment/` | Dockerfile and docker-compose.yml for containerized execution |

---

## 4. Functional Requirements

### 4.1 Data Ingestion & Preprocessing

| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| FR-001 | The system SHALL ingest raw CSV telemetry data containing ≥100,000 records. | HIGH | ✅ Implemented |
| FR-002 | The system SHALL parse timestamp columns to `datetime` format and set them as the DataFrame index. | HIGH | ✅ Implemented |
| FR-003 | The system SHALL encode categorical columns (`region`, `zone`, `app_type`) to integer labels. | MEDIUM | ✅ Implemented |
| FR-004 | The system SHALL impute missing values and clamp anomalous readings. | HIGH | ✅ Implemented |
| FR-005 | The system SHALL create a future target variable by shifting `request_count` backward by 3 steps (15 minutes). | HIGH | ✅ Implemented |
| FR-006 | The system SHALL drop all rows containing NaN values after lag/rolling feature creation. | HIGH | ✅ Implemented |

### 4.2 Feature Engineering

| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| FR-010 | The system SHALL extract **7 temporal features**: `hour`, `day`, `month`, `day_of_week`, `week`, `quarter`, `is_weekend`. | HIGH | ✅ Implemented |
| FR-011 | The system SHALL create **5 lag features**: request count lags at steps 1, 3, 6, 12, and 24. | HIGH | ✅ Implemented |
| FR-012 | The system SHALL compute **6 rolling window statistics**: Mean and Std Dev over 6-step and 12-step windows; Max and Min over 12-step windows. | HIGH | ✅ Implemented |
| FR-013 | The system SHALL derive **6 composite metrics**: `traffic_growth_rate`, `request_velocity`, `traffic_momentum`, `cpu_memory_ratio`, `network_total`, `resource_pressure`. | MEDIUM | ✅ Implemented |
| FR-014 | The total engineered feature count SHALL be ≥ 38. | HIGH | ✅ Verified (38 features) |

### 4.3 Model Training & Evaluation

| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| FR-020 | The system SHALL train an XGBoost Regressor with `objective=reg:squarederror`. | HIGH | ✅ Implemented |
| FR-021 | The model SHALL use the following hyperparameters: `n_estimators=500`, `learning_rate=0.05`, `max_depth=8`, `min_child_weight=3`, `subsample=0.8`, `colsample_bytree=0.8`, `gamma=0.1`. | HIGH | ✅ Implemented |
| FR-022 | The system SHALL perform an 80/20 chronological train/test split (no shuffle). | HIGH | ✅ Implemented |
| FR-023 | The system SHALL evaluate the model using MAE, RMSE, and R² metrics. | HIGH | ✅ Implemented |
| FR-024 | The system SHALL serialize the trained model to `models/xgboost_model.json`. | HIGH | ✅ Implemented |
| FR-025 | The system SHALL persist the ordered feature column list to `models/feature_columns.pkl`. | HIGH | ✅ Implemented |

### 4.4 Autoscaling Decision Engine

| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| FR-030 | The engine SHALL accept `predicted_requests`, `current_instances`, `cpu_usage`, and `memory_usage` as inputs. | HIGH | ✅ Implemented |
| FR-031 | The engine SHALL issue **SCALE UP** if ANY of the following is true: capacity utilization ≥ 85%, CPU ≥ 75%, or Memory ≥ 75%. | HIGH | ✅ Implemented |
| FR-032 | The engine SHALL issue **SCALE DOWN** only if ALL of the following are true: capacity utilization ≤ 45%, CPU ≤ 30%, and Memory ≤ 35%. | HIGH | ✅ Implemented |
| FR-033 | The engine SHALL issue **MAINTAIN** if neither Scale Up nor Scale Down conditions are met. | HIGH | ✅ Implemented |
| FR-034 | The engine SHALL clamp `recommended_instances` to the range [`min_instances=2`, `max_instances=10`]. | HIGH | ✅ Implemented |
| FR-035 | The engine SHALL assume `requests_per_instance = 2500` for capacity calculation. | MEDIUM | ✅ Implemented |

### 4.5 Backend API

| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| FR-040 | The API SHALL expose a root endpoint `GET /` returning project name, status, and version. | LOW | ✅ Implemented |
| FR-041 | The API SHALL expose `GET /api/health` returning the load status of predictor, simulator, and autoscaler components. | MEDIUM | ✅ Implemented |
| FR-042 | The API SHALL expose `GET /api/dashboard` as the core unified payload containing metrics, predictions, autoscaler state, geographic data, alerts, time-series, and history. | HIGH | ✅ Implemented |
| FR-043 | Each call to `/api/dashboard` SHALL advance the traffic simulation by one step. | HIGH | ✅ Implemented |
| FR-044 | The API SHALL expose `GET /api/history` returning a sliding window of the last 50 dashboard events. | MEDIUM | ✅ Implemented |
| FR-045 | The API SHALL expose `GET /api/analytics` returning aggregate statistics (average CPU, memory, prediction, and event counts). | MEDIUM | ✅ Implemented |
| FR-046 | The API SHALL enable CORS middleware allowing all origins for development. | MEDIUM | ✅ Implemented |

### 4.6 Dashboard Frontend

| ID | Requirement | Priority | Status |
| :--- | :--- | :--- | :--- |
| FR-050 | The dashboard SHALL display a KPI grid showing ≥8 live metrics (Traffic, Servers, CPU, Memory, etc.). | HIGH | ✅ Implemented |
| FR-051 | The dashboard SHALL render an Actual vs. Predicted traffic line chart using ApexCharts. | HIGH | ✅ Implemented |
| FR-052 | The dashboard SHALL render an autoscaling timeline/Gantt chart tracking Scale Up/Down/Maintain decisions. | HIGH | ✅ Implemented |
| FR-053 | The dashboard SHALL render a Plotly-powered interactive world choropleth map for geographic traffic distribution. | MEDIUM | ✅ Implemented |
| FR-054 | The dashboard SHALL render distribution charts for Device Type, Platform, Subscription, and Content Type. | MEDIUM | ✅ Implemented |
| FR-055 | The dashboard SHALL display a real-time alert panel for CPU, Memory, Queue, and Error Rate thresholds. | MEDIUM | ✅ Implemented |
| FR-056 | The dashboard SHALL poll the backend API at a configurable interval (default: 5 seconds). | HIGH | ✅ Implemented |

---

## 5. Data Requirements

### 5.1 Raw Dataset Specification

| Attribute | Value |
| :--- | :--- |
| **File** | `data/raw/cloud_traffic_dataset.csv` |
| **Records** | 100,001 |
| **Raw Features** | 16 |
| **Sampling Interval** | 5 minutes |
| **Time Range** | January 2024+ |
| **Target Variable** | `request_count` |

### 5.2 Raw Feature Schema

| # | Column | Data Type | Description |
| :--- | :--- | :--- | :--- |
| 1 | `timestamp` | datetime | ISO 8601 timestamp of the observation |
| 2 | `request_count` | float64 | Number of HTTP requests in the interval |
| 3 | `cpu_usage` | float64 | Server CPU utilization (%) |
| 4 | `memory_usage` | float64 | Server memory utilization (%) |
| 5 | `network_in` | float64 | Inbound network throughput (MB/s) |
| 6 | `network_out` | float64 | Outbound network throughput (MB/s) |
| 7 | `disk_io` | float64 | Disk I/O operations per second |
| 8 | `response_time` | float64 | Average API response time (ms) |
| 9 | `error_rate` | float64 | Percentage of failed requests |
| 10 | `active_users` | int64 | Concurrent active users |
| 11 | `server_instances` | int64 | Number of active VM instances |
| 12 | `cache_hit_rate` | float64 | CDN/Cache hit ratio (%) |
| 13 | `queue_length` | int64 | Pending request queue depth |
| 14 | `region` | string | Data center region identifier |
| 15 | `zone` | string | Availability zone identifier |
| 16 | `app_type` | string | Application service type |

### 5.3 Engineered Feature Categories

| Category | Count | Features |
| :--- | :--- | :--- |
| **Temporal** | 7 | `hour`, `day`, `month`, `day_of_week`, `week`, `quarter`, `is_weekend` |
| **Lag** | 5 | `request_lag_1`, `request_lag_3`, `request_lag_6`, `request_lag_12`, `request_lag_24` |
| **Rolling** | 6 | `rolling_mean_6`, `rolling_std_6`, `rolling_mean_12`, `rolling_std_12`, `rolling_max_12`, `rolling_min_12` |
| **Derived** | 6 | `traffic_growth_rate`, `request_velocity`, `traffic_momentum`, `cpu_memory_ratio`, `network_total`, `resource_pressure` |
| **Encoded** | 3 | `region`, `zone`, `app_type` (label encoded) |
| **Passthrough** | 11 | Original numeric columns retained as-is |
| **Total** | **38** | — |

---

## 6. Machine Learning Requirements

### 6.1 Model Selection Rationale

| Model | Accuracy | MAE | RMSE | R² | Inference | Selected |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **XGBoost** | **98.5%** | **17.8** | **25.4** | **0.97** | **<5ms** | ✅ |
| Prophet | 89.2% | 42.3 | 58.7 | 0.82 | ~50ms | ❌ |
| LSTM | — | — | — | — | ~200ms | ❌ (Not deployed) |

### 6.2 XGBoost Hyperparameter Configuration

```python
XGBRegressor(
    objective       = "reg:squarederror",
    n_estimators    = 500,
    learning_rate   = 0.05,
    max_depth       = 8,
    min_child_weight = 3,
    subsample       = 0.8,
    colsample_bytree = 0.8,
    gamma           = 0.1,
    random_state    = 42,
    n_jobs          = -1
)
```

### 6.3 Top 5 Features by Importance

| Rank | Feature | Importance Score |
| :--- | :--- | :--- |
| 1 | `network_total` | 0.576 |
| 2 | `network_out` | 0.267 |
| 3 | `rolling_std_12` | 0.018 |
| 4 | `rolling_max_12` | 0.016 |
| 5 | `network_in` | 0.015 |

---

## 7. API Specification

### 7.1 Endpoint Summary

| Method | Endpoint | Description | Response Type |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Root status check | `{ project, status, version }` |
| `GET` | `/api/health` | Component health status | `{ status, predictor, simulator, autoscaler }` |
| `GET` | `/api/dashboard` | Core unified dashboard payload | Complex nested JSON (see §7.2) |
| `GET` | `/api/history` | Sliding window event history | `{ status, count, history[] }` |
| `GET` | `/api/analytics` | Aggregate analytics summary | `{ avg_cpu, avg_memory, scale_events }` |

### 7.2 Dashboard Response Schema

```json
{
  "metrics": {
    "request_count": 1234,
    "cpu_usage": 72.5,
    "memory_usage": 68.1,
    "network_in": 450.2,
    "network_out": 380.7,
    "response_time": 120.5,
    "error_rate": 0.3,
    "active_users": 850
  },
  "prediction": {
    "predicted_request_count": 1456.78,
    "accuracy": 98.5,
    "mae": 17.8,
    "rmse": 25.4,
    "r2": 0.97,
    "model_status": "Healthy"
  },
  "autoscaler": {
    "current_servers": 4,
    "recommended_servers": 5,
    "action": "SCALE UP",
    "capacity_utilization": 87.3,
    "reason": "Predicted traffic is approaching infrastructure capacity."
  },
  "series": { "timestamps": [], "actual": [], "predicted": [] },
  "geo": { "countries": [], "devices": [], "platforms": [] },
  "alerts": [ { "severity": "warning", "title": "...", "message": "..." } ],
  "history": []
}
```

---

## 8. User Interface Requirements

### 8.1 Dashboard Panels

| Panel | Description | Chart Library |
| :--- | :--- | :--- |
| **KPI Grid** | 8 live metric cards with trend indicators | Custom HTML/CSS |
| **Live Traffic** | Dual-line chart — Actual vs. Predicted requests | ApexCharts |
| **ML Prediction** | Model accuracy gauge with error metrics | ApexCharts |
| **Autoscaling Timeline** | Gantt-style bar chart of Scale Up/Down/Maintain events | ApexCharts |
| **Infrastructure Health** | Radial gauge for system health score | ApexCharts |
| **World Traffic Map** | Interactive choropleth with click handlers | Plotly.js |
| **Device Distribution** | Horizontal bar chart by device type | ApexCharts |
| **Platform Analytics** | Donut charts for platform, subscription, content | ApexCharts |
| **Alert Feed** | Severity-coded real-time alert log | Custom HTML/CSS |

### 8.2 UI Technology Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| Structure | HTML5 | Latest |
| Styling | CSS3 + Bootstrap | 5.x |
| Logic | Vanilla JavaScript (ES6+) | Latest |
| Charts | ApexCharts | 3.x |
| Maps | Plotly.js | 2.x |
| Icons | Font Awesome | 6.x |
| Typography | Inter (Google Fonts) | Variable |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-001 | ML model inference latency | < 5 ms per prediction |
| NFR-002 | API response time (p95) | < 200 ms |
| NFR-003 | Dashboard refresh cycle | 5 seconds (configurable) |
| NFR-004 | Concurrent API connections | ≥ 50 simultaneous clients |
| NFR-005 | Dataset load time | < 3 seconds for 100K rows |

### 9.2 Reliability & Availability

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-010 | System uptime (local) | 99.9% during demonstration |
| NFR-011 | Graceful error handling | All API errors return structured JSON with HTTP 500 |
| NFR-012 | Model fallback | System logs traceback and continues on prediction failure |

### 9.3 Scalability

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-020 | Dataset size support | Up to 1,000,000 rows without code changes |
| NFR-021 | Horizontal API scaling | Supported via Docker Compose `replicas` |
| NFR-022 | Feature extensibility | New features can be added without model retraining infrastructure changes |

### 9.4 Security

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-030 | Input validation | All numeric inputs clamped to valid ranges (0–100% for CPU/Memory) |
| NFR-031 | CORS policy | Configurable; currently allows all origins for development |
| NFR-032 | No credentials stored | System operates without API keys or secrets |

### 9.5 Portability

| ID | Requirement | Target |
| :--- | :--- | :--- |
| NFR-040 | Cross-platform execution | Windows, Linux, macOS |
| NFR-041 | Containerized deployment | Docker image with all dependencies bundled |
| NFR-042 | Browser compatibility | Chrome 110+, Firefox 110+, Edge 110+ |

---

## 10. External Interface Requirements

### 10.1 Hardware Interfaces

The system has no direct hardware interfaces. It operates entirely in software, reading historical telemetry from CSV files. In a production deployment, hardware interfaces would include CloudWatch API integrations for live metrics ingestion.

### 10.2 Software Interfaces

| Interface | Protocol | Purpose |
| :--- | :--- | :--- |
| Frontend ↔ Backend | HTTP/1.1 REST (JSON) | Dashboard data polling |
| Backend ↔ ML Model | In-process Python call | XGBoost `.predict()` invocation |
| Backend ↔ Dataset | Pandas CSV Reader | Historical data iteration |
| Docker ↔ Host | TCP Port Mapping | Service exposure (ports 8000, 8501) |

### 10.3 Communication Interfaces

| Protocol | Port | Service |
| :--- | :--- | :--- |
| HTTP | 8000 | FastAPI Backend |
| HTTP | 8501 | Streamlit Dashboard (Docker) |
| HTTP | 80 | Frontend static files (local file:// or nginx) |

---

## 11. System Constraints & Assumptions

### 11.1 Constraints

| # | Constraint |
| :--- | :--- |
| 1 | The system must operate without any external cloud provider API keys. |
| 2 | The ML model must be pre-trained and serialized; no online learning is supported. |
| 3 | The frontend must function without a build step (no Node.js/Webpack required). |
| 4 | Geographic traffic data is simulated; real CDN log integration is deferred. |
| 5 | Maximum instance count is hard-capped at 10 for simulation safety. |

### 11.2 Assumptions

| # | Assumption |
| :--- | :--- |
| 1 | Cloud VM boot time is < 15 minutes (within the forecast horizon). |
| 2 | Traffic patterns exhibit daily and weekly seasonality. |
| 3 | The relationship between server metrics and future traffic is learnable from historical data. |
| 4 | Each server instance can handle approximately 2,500 requests per 5-minute interval. |
| 5 | The user has Python 3.11+ or Docker installed on the demonstration machine. |

---

## 12. Acceptance Criteria

### 12.1 Functional Acceptance

| # | Criterion | Verification Method |
| :--- | :--- | :--- |
| AC-001 | The XGBoost model achieves R² ≥ 0.95 on the test set. | Automated script output |
| AC-002 | The autoscaler correctly issues SCALE UP when CPU ≥ 75%. | Unit test (`test_autoscaler.py`) |
| AC-003 | The autoscaler correctly issues SCALE DOWN when all metrics are low. | Unit test |
| AC-004 | The `/api/dashboard` endpoint returns a valid JSON payload with all 7 keys. | Manual API test (curl / browser) |
| AC-005 | The dashboard renders without JavaScript errors in Chrome 110+. | Manual browser testing |
| AC-006 | The world map displays ≥ 10 countries with click interaction. | Manual UI testing |

### 12.2 Non-Functional Acceptance

| # | Criterion | Verification Method |
| :--- | :--- | :--- |
| AC-010 | Model inference completes in < 5ms. | Profiling with `time.time()` |
| AC-011 | The Docker container builds and starts successfully. | `docker-compose up --build` |
| AC-012 | The system runs continuously for ≥ 1 hour without memory leaks. | Long-duration manual test |

---

## 13. Appendices

### Appendix A: Directory Structure

```
Predictive-Autoscaling-Using-ML/
├── app/                          # Backend application modules
│   ├── simulator.py              #   Traffic simulation engine
│   ├── analytics.py              #   Analytics computation
│   ├── charts.py                 #   Chart data generators
│   ├── dashboard.py              #   Dashboard assembly
│   └── alerts.py                 #   Alert rule evaluation
├── data/
│   ├── raw/                      # Original CSV dataset
│   └── processed/                # Feature-engineered datasets
├── deployment/
│   ├── Dockerfile                # Container build instructions
│   ├── docker-compose.yml        # Multi-service orchestration
│   └── requirements.txt          # Python dependency manifest
├── docs/                         # Technical documentation
├── frontend/
│   ├── index.html                # Dashboard entry point
│   ├── css/style.css             # Custom styles
│   ├── js/                       # API, App, Charts modules
│   └── vendor/                   # ApexCharts, Bootstrap, Plotly, Fonts
├── models/
│   ├── xgboost_model.json        # Serialized trained model
│   ├── feature_columns.pkl       # Ordered feature list
│   └── feature_importance.csv    # Feature importance scores
├── notebooks/
│   └── XGBoost_Training.ipynb    # Interactive training notebook
├── src/
│   ├── predict.py                # TrafficPredictor class
│   ├── autoscaler.py             # AutoScaler class
│   ├── train_xgboost.py          # Model training script
│   └── train_prophet.py          # Prophet baseline script
├── main.py                       # FastAPI application entry point
└── README.md                     # Project documentation
```

### Appendix B: Autoscaling Decision Matrix

| Condition | Utilization | CPU | Memory | Action |
| :--- | :--- | :--- | :--- | :--- |
| ANY threshold exceeded | ≥ 85% | ≥ 75% | ≥ 75% | **SCALE UP** |
| ALL thresholds low | ≤ 45% | ≤ 30% | ≤ 35% | **SCALE DOWN** |
| Neither condition met | 45–85% | 30–75% | 35–75% | **MAINTAIN** |

### Appendix C: Technology Dependency Matrix

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `python` | 3.11+ | Core runtime |
| `fastapi` | 0.100+ | REST API framework |
| `uvicorn` | 0.27+ | ASGI server |
| `xgboost` | 2.0+ | Gradient boosting ML model |
| `pandas` | 2.0+ | Data manipulation |
| `numpy` | 1.24+ | Numerical computing |
| `scikit-learn` | 1.3+ | ML evaluation metrics |
| `joblib` | 1.3+ | Model serialization |
| `prophet` | 1.1+ | Baseline comparison model |

---

<div align="center">

**— End of Document —**

*This SRS is a living document and will be updated as the system evolves toward production deployment.*

**© 2026 IBM SkillsBuild Internship Program. All rights reserved.**

</div>
