import streamlit as st


class AlertPanel:

    @staticmethod
    def show(data):

        st.divider()
        st.subheader("🚨 System Health")

        alerts = []

        # CPU
        if data["cpu_usage"] >= 90:
            alerts.append(("🔴 Critical CPU Usage", "error"))
        elif data["cpu_usage"] >= 75:
            alerts.append(("🟡 High CPU Usage", "warning"))

        # Memory
        if data["memory_usage"] >= 90:
            alerts.append(("🔴 Critical Memory Usage", "error"))
        elif data["memory_usage"] >= 75:
            alerts.append(("🟡 High Memory Usage", "warning"))

        # Queue
        if data["queue_length"] > 30:
            alerts.append(("🔴 Queue Congestion", "error"))
        elif data["queue_length"] > 10:
            alerts.append(("🟡 Queue Increasing", "warning"))

        # Autoscaling
        if data["action"] == "SCALE UP":
            alerts.append(("🟢 Autoscaling Triggered (Scale Up)", "success"))

        elif data["action"] == "SCALE DOWN":
            alerts.append(("🔵 Autoscaling Triggered (Scale Down)", "info"))

        if len(alerts) == 0:

            st.success("🟢 All Systems Healthy")

        else:

            for message, level in alerts:

                if level == "error":
                    st.error(message)

                elif level == "warning":
                    st.warning(message)

                elif level == "success":
                    st.success(message)

                else:
                    st.info(message)