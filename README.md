<div align="center">
  <h1>🚀 Predictive Autoscaling Using Machine Learning on Cloud</h1>
  <p><strong>An intelligent, end-to-end ML pipeline that proactively right-sizes cloud infrastructure to eliminate SLA breaches and optimize costs.</strong></p>
  
  [![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![XGBoost](https://img.shields.io/badge/Model-XGBoost-F37626.svg?logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
  [![IBM SkillsBuild](https://img.shields.io/badge/IBM-SkillsBuild_Internship-052FAD.svg?logo=ibm&logoColor=white)](https://skillsbuild.org/)
</div>

<hr>

## 📖 Overview

Traditional cloud autoscaling is fundamentally **reactive**. Rule-based triggers (e.g., CPU > 80%) wait for a spike to occur before requesting new instances, resulting in boot-up delays, degraded user experience, and eventual over-provisioning (cloud waste).

This project introduces a **proactive, ML-driven autoscaling decision engine**. By ingesting cloud telemetry data and utilizing an advanced `XGBoost` regressor, the system successfully forecasts cloud traffic **15 minutes ahead of time**. An intelligent evaluation engine then securely scales infrastructure *before* the load arrives.

### ✨ Key Features
- **Accurate Time-Series Forecasting**: Predicts future request counts with 98.5% accuracy using XGBoost.
- **Advanced Feature Engineering**: Employs 38 distinct features including temporal variables, rolling windows, and lagged trends.
- **Intelligent Decision Engine**: Safely evaluates scale-up and scale-down rules against predictive data to prevent cloud waste.
- **High-Performance REST API**: Powered by `FastAPI` to serve state and metrics instantly to clients.
- **Decoupled Real-Time Dashboard**: A stunning vanilla HTML/JS frontend utilizing `ApexCharts` and `Plotly` to visualize infrastructure health, geographic traffic, and model performance.

---

## 🏗️ System Architecture

The project is decoupled into robust microservice layers for production readiness:

```mermaid
graph LR
    A[Cloud Telemetry Data] -->|Preprocessing| B[Feature Engineering]
    B --> C[XGBoost Predictor]
    C -->|+15m Forecast| D[Autoscaling Engine]
    D -->|Scale Commands| E[Cloud Infrastructure]
    
    C --> F[FastAPI Backend]
    D --> F
    F -->|REST / JSON| G[Real-Time Analytics UI]
```

1. **Data Layer**: Processes 100K+ rows of simulated server telemetry (CPU, Memory, IO, Requests).
2. **ML Layer**: XGBoost model deployed for real-time inference (sub-5ms prediction latency).
3. **Backend API**: A FastAPI event-loop that simulates live traffic progression and serves endpoints (`/api/dashboard`, `/api/history`, `/api/analytics`).
4. **Frontend UI**: A completely decoupled, reactive dashboard.

---

## 📈 Model Performance

After rigorously benchmarking `Prophet`, `LSTM`, and `XGBoost`, the **XGBoost Regressor** was selected for production deployment due to its superior handling of multivariate tabular data and exceptional execution speed.

| Metric | Score | vs Baseline |
| :--- | :--- | :--- |
| **Accuracy** | 98.5% | ▲ +9.3% |
| **R² Score** | 0.972 | ▲ +18.3% |
| **MAE** | 17.8 | ▼ -57.9% |
| **RMSE** | 25.4 | ▼ -56.7% |

*The model confidently captures recurring seasonalities and abrupt traffic flash-crowds, allowing the decision engine to pre-warm instances perfectly.*

---

## 🛠️ Technology Stack

- **Machine Learning**: `Python`, `Pandas`, `NumPy`, `Scikit-Learn`, `XGBoost`
- **Backend**: `FastAPI`, `Uvicorn`, `Pydantic`, `Joblib`
- **Frontend**: `HTML5`, `CSS3`, `JavaScript`, `Bootstrap 5`, `ApexCharts`, `Plotly.js`
- **DevOps**: `Docker`, `Docker Compose`, `Git`

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop) and Docker Compose
- Python 3.11+ (if running locally without Docker)

### Option 1: Run with Docker (Recommended)
The fastest way to spin up the entire ecosystem (Backend + Frontend).

```bash
# Clone the repository
git clone https://github.com/siddharth890git/Predictive-Autoscaling-Using-ML.git
cd Predictive-Autoscaling-Using-ML

# Build and start the containers
docker-compose up --build
```
*The Dashboard will be accessible at `http://localhost:8501`*

### Option 2: Run Locally (Development Mode)
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r deployment/requirements.txt

# Start the FastAPI Server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Simply open `frontend/index.html` in any modern web browser to view the dashboard!*

---

## 📂 Repository Structure

```text
├── app/                  # FastAPI backend modules (analytics, charts, simulator)
├── data/                 # Raw and processed CSV datasets
├── deployment/           # Dockerfiles and requirements.txt
├── docs/                 # Detailed architectural and model documentation
├── frontend/             # HTML, CSS, JS, and vendor libraries for the dashboard
├── img/                  # Demo screenshots and exported EDA plots
├── models/               # Serialized ML models and output CSVs
├── notebooks/            # Jupyter notebooks for EDA and XGBoost training
├── presentation/         # Generated PPTX and slide generator scripts
├── src/                  # Core ML training and simulation scripts
├── main.py               # FastAPI application entry point
└── README.md             # You are here
```

---

## 👥 Contributors
Developed as the Final Project for the **IBM SkillsBuild Internship**.

- **Siddharth Negi**
- **Kartikeya Singh**
- **Chitranshi Maheshwari**
- **Apoorv Aditya Jha**
- **Abhinav Pandey**

<div align="center">
  <sub>Built with ❤️ for intelligent cloud infrastructure.</sub>
</div>
