/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/

// Background script to pass messages between frontend and backend.
// This is run automatically by Firefox when the extension is enabled.

browser.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === "getTags") {
        const res = await fetch("http://localhost:8000/tags");
        return await res.json();
    }
    if (msg.type === 'createTag') {
        return fetch('http://localhost:8000/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: msg.name })
        })
        .then(async (r) => {
            if (!r.ok) {
                const text = await r.text();
                throw new Error(`HTTP ${r.status}: ${text}`);
            }
            return r.json();
        })
    }
});
