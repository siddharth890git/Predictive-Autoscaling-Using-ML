from app.simulator import TrafficSimulator
from src.predict import TrafficPredictor

sim = TrafficSimulator()

predictor = TrafficPredictor()

data = sim.next()

prediction = predictor.predict(data["features"])

print("=" * 50)
print("PREDICTIVE AUTOSCALING TEST")
print("=" * 50)

print(f"Timestamp            : {data['timestamp']}")
print(f"Current Requests     : {data['current_requests']:.2f}")
print(f"Future Requests      : {data['future_requests']:.2f}")
print(f"Predicted Requests   : {prediction:.2f}")

error = abs(prediction - data["future_requests"])

print(f"Prediction Error     : {error:.2f}")