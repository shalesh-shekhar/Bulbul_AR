/*
==============================================================================
 Project: Fann À Porter | AR Companion
 Copyright (c) 2026 AJ Squared Technologies LLC (Delaware, US).
 All Rights Reserved.

 This source code, along with the associated Augmented Reality (AR) tracking 
 matrices, 3D models, and motion graphics, is confidential and proprietary to 
 AJ Squared Technologies LLC. 

 Note: Original physical artworks are the property of their respective 
 artists/owners. The digital AR transformations, interactive state machines, 
 and motion designs are the exclusive intellectual property of AJ².

 Reproduction, distribution, or unauthorized use of this digital architecture, 
 in whole or in part, is strictly prohibited without prior written consent.

 Architecture & Design:
 - Chief Architect and Sr Development and Design Lead: Mohammad Shanti
 - Lead AR and Motion Videos Designer: Shalesh Shekhar
==============================================================================
*/
const CACHE_NAME = 'fann-ar-v1.22';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // 1. Skip APIs and let Safari natively handle heavy .mp4 byte-range streaming
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('google.com') || 
        event.request.url.endsWith('.mp4')) return;

    // 2. Network-First for HTML navigation
    if (event.request.mode === 'navigate') {
        if (event.request.method !== 'GET') {
            event.respondWith(fetch(event.request));
            return;
        }
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. Cache-First for standard assets (Allow 200 and Status 0 Opaque CDNs)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                if (event.request.method !== 'GET') return networkResponse;
                if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
                    return networkResponse;
                }
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
