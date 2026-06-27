---
title: "让 zdhua.me 指向新的 GitHub Pages"
description: "自定义域名部署的关键是 Pages 设置、CNAME 文件、DNS 记录和构建 base 路径保持一致。"
pubDate: 2026-06-23
tags: ["域名", "GitHub Pages", "部署"]
channel: "DOMAIN-21"
status: "READY"
intensity: 63
accent: "green"
readTime: "4 min"
---

`zdhua.me` 访问博客，需要 GitHub Pages 和 DNS 同时正确。仓库里保留 `public/CNAME`，构建后会出现在发布产物根目录，内容就是域名本身。

Astro 构建时还要使用正确的站点地址和 base 路径。自定义域名部署在根路径，所以 `SITE_URL` 是 `https://zdhua.me`，`BASE_PATH` 是 `/`。

## DNS 侧

如果域名托管在 Cloudflare 或其他 DNS 服务商，需要把根域名指向 GitHub Pages。常见做法是配置 GitHub Pages 的 A 记录，或者用合适的 CNAME/ALIAS 记录。

DNS 生效需要时间。代码推送成功不代表域名立即更新，但 Pages 的部署日志会先给出产物状态。

## 仓库侧

工作流在 `main` 分支推送后自动构建。只要 GitHub Pages 的来源设置为 Actions，部署完成后就会更新线上站点。
