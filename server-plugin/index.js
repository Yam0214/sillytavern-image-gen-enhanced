const PLUGIN_ID = "quick-image-gen-relay";
const REQUEST_TIMEOUT_MS = 60_000;
const express = require("express");

function sendJson(res, status, body) {
    res.status(status).type("application/json").send(JSON.stringify(body));
}

function requireString(value, name) {
    if (typeof value !== "string" || !value.trim()) {
        const error = new Error(`${name} is required`);
        error.status = 400;
        throw error;
    }
    return value.trim();
}

function withTimeout(signal) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    if (signal) {
        if (signal.aborted) controller.abort();
        else signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    return { signal: controller.signal, done: () => clearTimeout(timeout) };
}

async function relayJson(res, url, authHeader, init = {}) {
    const timeout = withTimeout();
    try {
        const upstream = await fetch(url, {
            method: init.method || "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": authHeader,
                ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
            },
            body: init.body === undefined ? undefined : JSON.stringify(init.body),
            signal: timeout.signal,
        });

        const text = await upstream.text();
        res.status(upstream.status);
        res.set("Content-Type", upstream.headers.get("content-type") || "application/json");
        res.send(text);
    } catch (error) {
        if (error?.name === "AbortError") {
            sendJson(res, 504, { error: "Quick Image Gen relay request timed out" });
            return;
        }
        sendJson(res, 502, { error: error?.message || "Quick Image Gen relay request failed" });
    } finally {
        timeout.done();
    }
}

async function handleCivitai(req, res) {
    try {
        const action = requireString(req.body?.action, "action");
        const apiKey = requireString(req.body?.apiKey, "apiKey");

        if (action === "createJob") {
            return relayJson(res, "https://civitai.com/api/v1/consumer/jobs", `Bearer ${apiKey}`, {
                method: "POST",
                body: req.body?.body,
            });
        }

        if (action === "getJobs") {
            const token = requireString(req.body?.token, "token");
            const url = new URL("https://civitai.com/api/v1/consumer/jobs");
            url.searchParams.set("token", token);
            return relayJson(res, url.toString(), `Bearer ${apiKey}`);
        }

        sendJson(res, 400, { error: `Unsupported CivitAI action: ${action}` });
    } catch (error) {
        sendJson(res, error.status || 500, { error: error.message || "CivitAI relay failed" });
    }
}

async function handleImageHostingUpload(req, res) {
    try {
        const providerId = requireString(req.body?.provider, "provider");
        const imageBase64 = requireString(req.body?.imageBase64, "imageBase64");
        const filename = requireString(req.body?.filename, "filename");
        let apiKey = req.body?.apiKey || "";
        // Strip common auth prefixes users might accidentally paste
        apiKey = apiKey.trim().replace(/^(Bearer|Client-ID|Token)\s+/i, "");

        const customEndpoint = req.body?.customEndpoint || "";
        const customUrlField = req.body?.customUrlField || "";

        const providers = {
            imgpile: {
                endpoint: "https://cdn.imgpile.com/api/v1/media",
                buildBody(buf) {
                    const fd = new FormData();
                    fd.set("file", new Blob([buf]), filename);
                    return fd;
                },
                extractUrl(json) { return json?.media?.urls?.original; },
                authHeader: () => `Bearer ${apiKey}`,
            },
            imgos: {
                endpoint: "https://imgos.cn/api/upload",
                buildBody(buf) {
                    const fd = new FormData();
                    fd.set("file", new Blob([buf]), filename);
                    return fd;
                },
                extractUrl(json) { return json?.data?.url || json?.data?.link || json?.url; },
                authHeader: () => `Bearer ${apiKey}`,
            },
            imgur: {
                endpoint: "https://api.imgur.com/3/upload",
                buildBody(buf) {
                    const fd = new FormData();
                    fd.set("image", new Blob([buf]), filename);
                    fd.set("type", "file");
                    return fd;
                },
                extractUrl(json) { return json?.data?.link; },
                authHeader: () => `Client-ID ${apiKey}`,
            },
            catbox: {
                endpoint: "https://catbox.moe/user/api.php",
                buildBody(buf) {
                    const fd = new FormData();
                    fd.set("reqtype", "fileupload");
                    fd.set("fileToUpload", new Blob([buf]), filename);
                    return fd;
                },
                extractUrl(text) { return text.trim(); },
            },
            lugu: {
                endpoint: "https://imgse.com/ajax/plug/upload",
                buildBody(buf) {
                    const fd = new FormData();
                    fd.set("file", new Blob([buf]), filename);
                    return fd;
                },
                extractUrl(json) { return json?.data?.url || json?.url; },
            },
            custom: {
                endpoint: customEndpoint,
                buildBody(buf) {
                    const fd = new FormData();
                    fd.set("file", new Blob([buf]), filename);
                    return fd;
                },
                extractUrl(json) {
                    const path = customUrlField || "data.url";
                    return path.split(".").reduce((o, k) => o?.[k], json);
                },
            },
        };

        const provider = providers[providerId];
        if (!provider) {
            sendJson(res, 400, { error: `Unknown image hosting provider: ${providerId}` });
            return;
        }

        // Convert base64 to buffer
        const binaryStr = atob(imageBase64);
        const buf = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) buf[i] = binaryStr.charCodeAt(i);

        const body = provider.buildBody(buf);
        const headers = {};
        if (apiKey && provider.authHeader) {
            headers["Authorization"] = provider.authHeader();
        }

        const timeout = withTimeout();
        try {
            const upstream = await fetch(provider.endpoint, {
                method: "POST",
                headers,
                body,
                signal: timeout.signal,
            });

            const responseText = await upstream.text();
            if (!upstream.ok) {
                sendJson(res, upstream.status, { error: `Upload failed (${upstream.status}): ${responseText.substring(0, 300)}` });
                return;
            }

            let imageUrl;
            try {
                imageUrl = provider.extractUrl(JSON.parse(responseText));
            } catch {
                imageUrl = provider.extractUrl(responseText);
            }

            if (!imageUrl) {
                sendJson(res, 502, { error: "Failed to extract image URL from hosting response" });
                return;
            }

            sendJson(res, 200, { url: imageUrl });
        } finally {
            timeout.done();
        }
    } catch (error) {
        sendJson(res, error.status || 500, { error: error.message || "Image hosting upload failed" });
    }
}

function arrayBufferToBase64(buf) {
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary);
}

async function handleReplicate(req, res) {
    try {
        const action = requireString(req.body?.action, "action");
        const apiKey = requireString(req.body?.apiKey, "apiKey");

        if (action === "createPrediction") {
            return relayJson(res, "https://api.replicate.com/v1/predictions", `Token ${apiKey}`, {
                method: "POST",
                body: req.body?.body,
            });
        }

        if (action === "getPrediction") {
            const id = requireString(req.body?.id, "id");
            if (!/^[A-Za-z0-9_-]+$/.test(id)) {
                sendJson(res, 400, { error: "Invalid Replicate prediction id" });
                return;
            }
            return relayJson(res, `https://api.replicate.com/v1/predictions/${encodeURIComponent(id)}`, `Token ${apiKey}`);
        }

        sendJson(res, 400, { error: `Unsupported Replicate action: ${action}` });
    } catch (error) {
        sendJson(res, error.status || 500, { error: error.message || "Replicate relay failed" });
    }
}

async function init(router) {
    router.use(express.json({ limit: "1mb" }));
    router.get("/healthz", (_req, res) => res.sendStatus(204));
    router.post("/civitai", handleCivitai);
    router.post("/replicate", handleReplicate);
    router.post("/image-hosting/upload", handleImageHostingUpload);
    console.log("Quick Image Gen relay plugin loaded");
}

async function exit() {
    return Promise.resolve();
}

module.exports = {
    init,
    exit,
    info: {
        id: PLUGIN_ID,
        name: "Quick Image Gen Relay",
        description: "Relays CivitAI and Replicate requests for Quick Image Gen when SillyTavern basicAuthMode blocks the CORS proxy.",
    },
};
