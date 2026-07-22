import streamlit as st


class Cards:

    @staticmethod
    def metric_card(title, value, icon, color, delta="Live"):

        st.markdown(f"""
        <style>
        .metric-box {{
            background:{color};
            border-radius:15px;
            padding:18px;
            color:white;
            height:150px;
        }}

        .metric-title {{
            font-size:18px;
            font-weight:600;
        }}

        .metric-value {{
            font-size:34px;
            font-weight:bold;
            margin-top:15px;
        }}

        .metric-delta {{
            font-size:14px;
            opacity:0.9;
        }}
        </style>
        """, unsafe_allow_html=True)

        with st.container(border=False):

            st.markdown(
                f"""
                <div class="metric-box">

                <div class="metric-title">
                {icon} {title}
                </div>

                <div class="metric-value">
                {value}
                </div>

                <div class="metric-delta">
                {delta}
                </div>

                </div>
                """,
                unsafe_allow_html=True
            )