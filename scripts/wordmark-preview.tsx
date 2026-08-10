import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { WordmarkMKAPMS } from "../client/src/components/WordmarkMKAPMS";

const s34 = renderToStaticMarkup(<WordmarkMKAPMS height={34} withGlowLine />);
const s60 = renderToStaticMarkup(<WordmarkMKAPMS height={60} withGlowLine />);
const s120 = renderToStaticMarkup(<WordmarkMKAPMS height={120} withGlowLine />);
const s140tag = renderToStaticMarkup(<WordmarkMKAPMS height={140} withGlowLine withTagline />);

writeFileSync("/tmp/wordmark-preview.html", `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@700;900&display=swap" rel="stylesheet">
<style>
  body{background:#0b1220;padding:40px;font-family:sans-serif;color:#fff;margin:0}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:2px;color:#7FD3FF;margin:24px 0 8px}
  .card{background:#fff;padding:24px;border-radius:12px;display:inline-block;margin:8px 0}
  .dark{background:#0b1220;padding:24px;border-radius:12px;display:inline-block;margin:8px 0;border:1px solid #1e293b}
  .header-mock{background:#fff;padding:8px 24px;border-radius:12px;display:flex;align-items:center;height:72px;box-shadow:0 2px 8px rgba(0,0,0,.15)}
</style></head><body>
<h2>Header (72px h, wordmark 34px) — comme la vraie appli</h2>
<div class="header-mock">${s34}</div>

<h2>Home hero (60px)</h2>
<div class="card">${s60}</div>
<div class="dark">${s60}</div>

<h2>Grand format (120px, sans tagline)</h2>
<div class="card">${s120}</div>

<h2>Grand format + tagline officielle (140px)</h2>
<div class="card">${s140tag}</div>
</body></html>`);
console.log("OK");
