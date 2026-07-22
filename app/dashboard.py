import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

class Dashboard:

    @staticmethod
    def show_header():

        st.title("☁ Predictive Autoscaling Dashboard")

        st.caption(
            "IBM Internship Project | Machine Learning Based Predictive Autoscaling"
        )

        st.divider()

    @staticmethod
    def show_metrics(data):

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric(
                "Current Traffic",
                f"{data['actual_requests']:.0f}"
            )

        with col2:
            st.metric(
                "Predicted (+15 min)",
                f"{data['predicted_requests']:.0f}"
            )

        with col3:
            st.metric(
                "Actual Future",
                f"{data['future_requests']:.0f}"
            )

        error = abs(
            data["predicted_requests"] -
            data["future_requests"]
        )

        with col4:
            st.metric(
                "Prediction Error",
                f"{error:.2f}"
            )

    @staticmethod
    def show_resource_metrics(data):

        st.divider()

        st.subheader("Infrastructure")

        c1, c2, c3, c4 = st.columns(4)

        with c1:

            st.metric(
                "Current Servers",
                data["current_servers"]
            )

        with c2:

            st.metric(
                "Recommended Servers",
                data["recommended_servers"]
            )

        with c3:

            st.metric(
                "CPU Usage",
                f"{data['cpu_usage']:.1f}%"
            )

            st.progress(
                min(
                    data["cpu_usage"]/100,
                    1.0
                )
            )

        with c4:

            st.metric(
                "Memory Usage",
                f"{data['memory_usage']:.1f}%"
            )

            st.progress(
                min(
                    data["memory_usage"]/100,
                    1.0
                )
            )

    @staticmethod
    def show_decision(data):

        st.divider()

        st.subheader("Autoscaling Decision")

        if data["action"] == "SCALE UP":

            st.error(
                "🔴 SCALE UP"
            )

        elif data["action"] == "SCALE DOWN":

            st.warning(
                "🟡 SCALE DOWN"
            )

        else:

            st.success(
                "🟢 MAINTAIN"
            )

        st.write(
            f"**Reason:** {data['reason']}"
        )

        st.write(
            f"**Prediction Horizon:** 15 Minutes"
        )
    @staticmethod
    def show_charts(history):

        st.divider()

        st.subheader("Traffic Analytics")

        if len(history) == 0:

            st.info("Waiting for simulation data...")

            return

        df = pd.DataFrame(history)

        col1, col2 = st.columns(2)

        # -------------------------------
        # Actual vs Predicted
        # -------------------------------

        with col1:

            fig = go.Figure()

            fig.add_trace(

                go.Scatter(

                    x=df["timestamp"],

                    y=df["actual_requests"],

                    mode="lines+markers",

                    name="Current Traffic"

                )

            )

            fig.add_trace(

                go.Scatter(

                    x=df["timestamp"],

                    y=df["predicted_requests"],

                    mode="lines+markers",

                    name="Predicted (+15 min)"

                )

            )

            fig.update_layout(

                title="Traffic Prediction",

                template="plotly_dark",

                height=400,

                xaxis_title="Time",

                yaxis_title="Requests"

            )

            st.plotly_chart(

                fig,

                use_container_width=True

            )

        # -------------------------------
        # CPU & Memory
        # -------------------------------

        with col2:

            fig = go.Figure()

            fig.add_trace(

                go.Scatter(

                    x=df["timestamp"],

                    y=df["cpu_usage"],

                    mode="lines+markers",

                    name="CPU"

                )

            )

            fig.add_trace(

                go.Scatter(

                    x=df["timestamp"],

                    y=df["memory_usage"],

                    mode="lines+markers",

                    name="Memory"

                )

            )

            fig.update_layout(

                title="CPU & Memory",

                template="plotly_dark",

                height=400,

                xaxis_title="Time",

                yaxis_title="%"

            )

            st.plotly_chart(

                fig,

                use_container_width=True

            )

        st.divider()

        col3, col4 = st.columns(2)

        # -------------------------------
        # Server Recommendation
        # -------------------------------

        with col3:

            fig = px.bar(

                df,

                x="timestamp",

                y="recommended_servers",

                title="Recommended Server Instances"

            )

            fig.update_layout(

                template="plotly_dark",

                height=350

            )

            st.plotly_chart(

                fig,

                use_container_width=True

            )

        # -------------------------------
        # Scaling Actions
        # -------------------------------

        with col4:

            action_counts = (

                df["action"]

                .value_counts()

                .reset_index()

            )

            action_counts.columns = [

                "Action",

                "Count"

            ]

            fig = px.pie(

                action_counts,

                values="Count",

                names="Action",

                title="Autoscaling Actions"

            )

            fig.update_layout(

                template="plotly_dark",

                height=350

            )

            st.plotly_chart(

                fig,

                use_container_width=True

            )

    @staticmethod
    def show_history(df):

        st.divider()

        st.subheader("Scaling History")

        if len(df) == 0:

            st.info(
                "No history available."
            )

            return

        show = df.copy()

        show["prediction_error"] = (
            abs(
                show["future_requests"] -
                show["predicted_requests"]
            )
        ).round(2)

        show = show[[
            "timestamp",
            "actual_requests",
            "future_requests",
            "predicted_requests",
            "prediction_error",
            "cpu_usage",
            "memory_usage",
            "recommended_servers",
            "action"
        ]]

        st.dataframe(
            show,
            use_container_width=True,
            hide_index=True
        )