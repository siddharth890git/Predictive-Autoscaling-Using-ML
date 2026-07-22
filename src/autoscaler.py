import math


class AutoScaler:

    def __init__(
        self,
        min_instances=2,
        max_instances=10,
        requests_per_instance=2500,
        scale_up_utilization=0.85,
        scale_down_utilization=0.45,
        cpu_scale_up=75,
        cpu_scale_down=30,
        memory_scale_up=75,
        memory_scale_down=35,
    ):

        self.min_instances = min_instances
        self.max_instances = max_instances
        self.requests_per_instance = requests_per_instance

        self.scale_up_utilization = scale_up_utilization
        self.scale_down_utilization = scale_down_utilization

        self.cpu_scale_up = cpu_scale_up
        self.cpu_scale_down = cpu_scale_down

        self.memory_scale_up = memory_scale_up
        self.memory_scale_down = memory_scale_down

    def decide(
        self,
        predicted_requests,
        current_instances,
        cpu_usage,
        memory_usage,
    ):

        # -----------------------------
        # Validate Inputs
        # -----------------------------

        predicted_requests = max(0, float(predicted_requests))
        cpu_usage = max(0, min(float(cpu_usage), 100))
        memory_usage = max(0, min(float(memory_usage), 100))

        current_instances = max(
            self.min_instances,
            min(int(current_instances), self.max_instances)
        )

        # -----------------------------
        # Current Capacity
        # -----------------------------

        current_capacity = (
            current_instances *
            self.requests_per_instance
        )

        utilization = (
            predicted_requests /
            current_capacity
        )

        # -----------------------------
        # Calculate Required Servers
        # -----------------------------

        recommended_instances = math.ceil(
            predicted_requests /
            self.requests_per_instance
        )

        recommended_instances = max(
            self.min_instances,
            min(
                recommended_instances,
                self.max_instances
            )
        )

        # -----------------------------
        # Default Decision
        # -----------------------------

        action = "MAINTAIN"
        reason = "Current infrastructure is sufficient."

        # -----------------------------
        # SCALE UP
        # -----------------------------

        if (
            utilization >= self.scale_up_utilization
            or cpu_usage >= self.cpu_scale_up
            or memory_usage >= self.memory_scale_up
        ):

            action = "SCALE UP"

            recommended_instances = max(
                recommended_instances,
                current_instances + 1
            )

            recommended_instances = min(
                recommended_instances,
                self.max_instances
            )

            if utilization >= self.scale_up_utilization:
                reason = (
                    "Predicted traffic is approaching infrastructure capacity."
                )

            elif cpu_usage >= self.cpu_scale_up:
                reason = (
                    "CPU utilization exceeded threshold."
                )

            else:
                reason = (
                    "Memory utilization exceeded threshold."
                )

        # -----------------------------
        # SCALE DOWN
        # -----------------------------

        elif (
            utilization <= self.scale_down_utilization
            and cpu_usage <= self.cpu_scale_down
            and memory_usage <= self.memory_scale_down
        ):

            action = "SCALE DOWN"

            recommended_instances = max(
                self.min_instances,
                recommended_instances
            )

            recommended_instances = min(
                recommended_instances,
                current_instances - 1
            )

            reason = (
                "Traffic and resource utilization are consistently low."
            )

        # -----------------------------
        # Maintain
        # -----------------------------

        else:

            recommended_instances = current_instances

        # -----------------------------
        # Final Safety Check
        # -----------------------------

        recommended_instances = max(
            self.min_instances,
            min(
                recommended_instances,
                self.max_instances
            )
        )

        # -----------------------------
        # Return Result
        # -----------------------------

        return {

            "action": action,

            "reason": reason,

            "current_servers": current_instances,

            "recommended_servers": recommended_instances,

            "predicted_requests": round(predicted_requests, 2),

            "current_capacity": current_capacity,

            "capacity_utilization": round(utilization * 100, 2),

            "cpu_usage": round(cpu_usage, 2),

            "memory_usage": round(memory_usage, 2)
        }


# ----------------------------------------------------
# Test
# ----------------------------------------------------

if __name__ == "__main__":

    scaler = AutoScaler()

    result = scaler.decide(
        predicted_requests=18500,
        current_instances=5,
        cpu_usage=82,
        memory_usage=74,
    )

    print(result)