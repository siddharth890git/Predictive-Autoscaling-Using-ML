import streamlit as st
import pandas as pd
import plotly.express as px


class LiveAnalytics:

    @staticmethod
    def country_map(history):

        if len(history) == 0:
            return

        df = pd.DataFrame(history)

        country = (
            df.groupby("country")["actual_requests"]
            .sum()
            .reset_index()
        )

        fig = px.choropleth(
            country,
            locations="country",
            locationmode="country names",
            color="actual_requests",
            color_continuous_scale="Viridis",
            title="🌍 Global Streaming Traffic"
        )

        fig.update_layout(
            template="plotly_dark",
            height=500
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    @staticmethod
    def top_countries(history):

        if len(history) == 0:
            return

        df = pd.DataFrame(history)

        top = (
            df.groupby("country")["actual_requests"]
            .sum()
            .sort_values(ascending=False)
            .head(10)
            .reset_index()
        )

        fig = px.bar(
            top,
            x="country",
            y="actual_requests",
            title="Top Countries"
        )

        fig.update_layout(
            template="plotly_dark",
            height=400
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    @staticmethod
    def device_distribution(history):

        if len(history) == 0:
            return

        df = pd.DataFrame(history)

        fig = px.pie(
            df,
            names="device_type",
            title="Streaming Devices"
        )

        fig.update_layout(
            template="plotly_dark",
            height=400
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    @staticmethod
    def subscription_distribution(history):

        if len(history) == 0:
            return

        df = pd.DataFrame(history)

        fig = px.pie(
            df,
            names="subscription",
            title="Subscription Plans"
        )

        fig.update_layout(
            template="plotly_dark",
            height=400
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )