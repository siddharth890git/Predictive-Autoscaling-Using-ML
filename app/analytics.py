import streamlit as st
import plotly.express as px


class Analytics:

    @staticmethod
    def show_country_map(df):

        st.subheader("🌍 Global Streaming Traffic")

        country_data = (

            df.groupby("country")["request_count"]

            .sum()

            .reset_index()

        )

        fig = px.choropleth(

            country_data,

            locations="country",

            locationmode="country names",

            color="request_count",

            color_continuous_scale="Blues",

            title="Traffic by Country"

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
    def show_top_countries(df):

        st.subheader("Top Countries")

        top = (

            df.groupby("country")["request_count"]

            .sum()

            .sort_values(

                ascending=False

            )

            .head(10)

        )

        st.dataframe(

            top,

            use_container_width=True

        )

    @staticmethod
    def device_distribution(df):

        st.subheader("Device Distribution")

        fig = px.pie(

            df,

            names="device_type",

            title="Streaming Devices"

        )

        fig.update_layout(

            template="plotly_dark"

        )

        st.plotly_chart(

            fig,

            use_container_width=True

        )

    @staticmethod
    def subscription_distribution(df):

        st.subheader("Subscription Plans")

        fig = px.bar(

            df["subscription"]

            .value_counts()

            .reset_index(),

            x="subscription",

            y="count"

        )

        fig.update_layout(

            template="plotly_dark"

        )

        st.plotly_chart(

            fig,

            use_container_width=True

        )