from pathlib import Path
import pandas as pd


class TrafficSimulator:

    def __init__(self):

        self.df = pd.read_csv(
            Path("data/processed/dashboard_dataset.csv")
        )

        # Ensure timestamp is datetime
        self.df["timestamp"] = pd.to_datetime(self.df["timestamp"])

        # Sort chronologically
        self.df.sort_values("timestamp", inplace=True)

        self.df.reset_index(drop=True, inplace=True)

        self.history = []
        self.current_index = 0

    # --------------------------------------------------------
    # Next Simulation Event
    # --------------------------------------------------------

    def next(self):

        # Weighted random sample
        current = self.df.iloc[[self.current_index]].copy()

        self.current_index += 1

        if self.current_index >= len(self.df):
            self.current_index = 0

        idx = current.index[0]

        # Next timestamp as future value
        if idx >= len(self.df) - 1:
            future = self.df.iloc[0]
        else:
            future = self.df.iloc[idx + 1]

        # -----------------------------------
        # Feature Set
        # -----------------------------------

        features = current.drop(
            columns=[
                "timestamp",
                "request_count",
                "country",
                "geo_region",
                "device_type",
                "platform",
                "subscription",
                "content_type",
                "cloud_region"
            ],
            errors="ignore"
        )

        features = features.apply(
            pd.to_numeric,
            errors="coerce"
        ).fillna(0)

        # -----------------------------------
        # Infrastructure Values
        # -----------------------------------

        cpu_usage = float(current["cpu_usage"].iloc[0])

        memory_usage = float(current["memory_usage"].iloc[0])

        network_in = float(current["network_in"].iloc[0])

        network_out = float(current["network_out"].iloc[0])

        disk_io = float(current["disk_io"].iloc[0])

        response_time = float(current["response_time"].iloc[0])

        error_rate = float(current["error_rate"].iloc[0])

        cache_hit_rate = float(current["cache_hit_rate"].iloc[0])

        active_users = int(current["active_users"].iloc[0])

        queue_length = int(current["queue_length"].iloc[0])

        # Keep server count inside autoscaler limits
        current_servers = int(current["server_instances"].iloc[0])

        current_servers = max(
            2,
            min(current_servers, 10)
        )   

        # -----------------------------------
        # Return Event
        # -----------------------------------

        return {

            "timestamp": current["timestamp"].iloc[0].strftime("%Y-%m-%d %H:%M:%S"),

            "current_requests": round(
                float(current["request_count"].iloc[0]),
                2
            ),

            "future_requests": round(
                float(future["request_count"]),
                2
            ),

            "features": features,

    # Infrastructure
            "active_users": active_users,
            "cpu_usage": round(cpu_usage, 2),
            "memory_usage": round(memory_usage, 2),
            "network_in": round(network_in, 2),
            "network_out": round(network_out, 2),
            "disk_io": round(disk_io, 2),
            "response_time": round(response_time, 2),
            "error_rate": round(error_rate, 2),
            "cache_hit_rate": round(cache_hit_rate, 2),
            "queue_length": queue_length,
            "current_servers": current_servers,

    # Geo Information
            "country": current["country"].iloc[0],
            "geo_region": current["geo_region"].iloc[0],
            "device_type": current["device_type"].iloc[0],
            "platform": current["platform"].iloc[0],
            "subscription": current["subscription"].iloc[0],
            "content_type": current["content_type"].iloc[0],
            "cloud_region": current["cloud_region"].iloc[0]
        }

    # --------------------------------------------------------
    # History
    # --------------------------------------------------------

    def add_history(self, item):

        self.history.append(item)

        if len(self.history) > 100:
            self.history.pop(0)

    def get_history(self):

        return self.history

    def clear_history(self):

        self.history.clear()