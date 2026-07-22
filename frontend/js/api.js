/* ==========================================================================
   AutoScale AI - api.js
   FastAPI Backend Connector
   ========================================================================== */

(function () {
    "use strict";

    const API = {
        baseUrl:
            window.AUTOSCALE_API_BASE ||
            localStorage.getItem("autoscale.apiBase") ||
            "http://127.0.0.1:8000",

        endpoint: "/api/dashboard",

        healthEndpoint: "/api/health",

        pollIntervalMs: 5000,

        timeoutMs: 5000,

        mode: "connecting",

        lastError: null,

        onModeChange: null
    };

    function setMode(mode, err = null) {
        API.mode = mode;
        API.lastError = err;

        if (typeof API.onModeChange === "function") {
            API.onModeChange(mode, err);
        }
    }

    async function request(endpoint) {

        const controller = new AbortController();

        const timer = setTimeout(() => {
            controller.abort();
        }, API.timeoutMs);

        try {

            const response = await fetch(
                API.baseUrl.replace(/\/$/, "") + endpoint,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } finally {
            clearTimeout(timer);
        }
    }

    function validatePayload(data) {

        if (!data)
            throw new Error("Empty response");

        if (!data.metrics)
            throw new Error("metrics missing");

        if (!data.prediction)
            throw new Error("prediction missing");

        if (!data.autoscaler)
            throw new Error("autoscaler missing");

        if (!data.series)
            throw new Error("series missing");

        if (!Array.isArray(data.series.timestamps))
            throw new Error("timestamps missing");

        return true;
    }

    API.getDashboard = async function () {

        try {

            const data = await request(API.endpoint);

            validatePayload(data);

            setMode("live");

            return {
                source: "live",
                data: data
            };

        } catch (err) {

            setMode("offline", err.message);

            throw err;
        }
    };

    API.health = async function () {
        return await request(API.healthEndpoint);
    };

    API.setBaseUrl = function (url) {

        API.baseUrl = url.trim();

        localStorage.setItem(
            "autoscale.apiBase",
            API.baseUrl
        );
    };

    API.setPollInterval = function (ms) {
        API.pollIntervalMs = ms;
    };

    window.API = API;

})();