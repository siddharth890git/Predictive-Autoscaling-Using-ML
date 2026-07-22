from autoscaler import AutoScaler

autoscaler = AutoScaler()

result = autoscaler.decide(

    predicted_requests=8200,

    current_instances=3,

    cpu_usage=82,

    memory_usage=78

)

print()

print("=" * 60)

print("AUTOSCALER RESULT")

print("=" * 60)

for key, value in result.items():

    print(f"{key:25}: {value}")