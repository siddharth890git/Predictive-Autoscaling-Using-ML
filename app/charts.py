import plotly.graph_objects as go
import plotly.express as px
import pandas as pd


class DashboardCharts:

    @staticmethod
    def traffic_chart(history):

        df = pd.DataFrame(history)

        fig = go.Figure()

        fig.add_trace(
            go.Scatter(
                x=df["timestamp"],
                y=df["actual_requests"],
                mode="lines",
                name="Actual",
                line=dict(width=3)
            )
        )

        fig.add_trace(
            go.Scatter(
                x=df["timestamp"],
                y=df["predicted_requests"],
                mode="lines",
                name="Predicted",
                line=dict(width=3, dash="dash")
            )
        )

        fig.update_layout(
            title="Traffic Prediction",
            xaxis_title="Time",
            yaxis_title="Requests",
            height=400,
            template="plotly_white"
        )

        return fig

    @staticmethod
    def cpu_memory_chart(history):

        df = pd.DataFrame(history)

        fig = go.Figure()

        fig.add_trace(
            go.Scatter(
                x=df["timestamp"],
                y=df["cpu_usage"],
                mode="lines",
                name="CPU Usage (%)"
            )
        )

        fig.add_trace(
            go.Scatter(
                x=df["timestamp"],
                y=df["memory_usage"],
                mode="lines",
                name="Memory Usage (%)"
            )
        )

        fig.update_layout(
            title="CPU & Memory Usage",
            xaxis_title="Time",
            yaxis_title="Usage %",
            height=400,
            template="plotly_white"
        )

        return fig

    @staticmethod
    def server_chart(history):

        df = pd.DataFrame(history)

        fig = px.bar(
            df,
            x="timestamp",
            y="recommended_servers",
            title="Recommended Server Instances"
        )

        fig.update_layout(
            height=350,
            template="plotly_white"
        )

        return fig

    @staticmethod
    def request_distribution(history):

        df = pd.DataFrame(history)

        fig = px.histogram(
            df,
            x="actual_requests",
            nbins=30,
            title="Traffic Distribution"
        )

        fig.update_layout(
            height=350,
            template="plotly_white"
        )

        return fig

    @staticmethod
    def scaling_actions(history):

        df = pd.DataFrame(history)

        counts = (
            df["action"]
            .value_counts()
            .reset_index()
        )

        counts.columns = [
            "Action",
            "Count"
        ]

        fig = px.pie(
            counts,
            names="Action",
            values="Count",
            title="Autoscaling Actions"
        )

        fig.update_layout(
            height=350,
            template="plotly_white"
        )

        return fig