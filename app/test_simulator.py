from simulator import TrafficSimulator

sim = TrafficSimulator()

for i in range(5):

    row = sim.next()

    print()

    print("Timestamp :", row["timestamp"])

    print("Requests :", row["request_count"])

    print("CPU :", row["cpu_usage"])

    print("Memory :", row["memory_usage"])