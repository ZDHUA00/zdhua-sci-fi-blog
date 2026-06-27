---
title: "把 ZDHUA-Blog 稳定部署到 zdhua.me"
description: "记录 GitHub Pages、自定义域名、CNAME 和 Astro base/site 配置之间的关系。"
pubDate: 2026-06-26
tags: ["部署", "GitHub Pages", "域名"]
channel: "DEPLOY-03"
status: "稳定"
intensity: 66
accent: "amber"
readTime: "4 min"
---

`ZDHUA-Blog` 当前使用 GitHub Pages 部署，自定义域名是 `zdhua.me`。仓库里的 `public/CNAME` 会在构建时复制到 `dist` 根目录，GitHub Pages 通过它识别域名。

Astro 构建时需要正确的 `site` 和 `base`。这个站点部署在自定义域名根路径，所以构建环境使用 `SITE_URL=https://zdhua.me` 和 `BASE_PATH=/`。

## 部署链路

推送到 `main` 分支后，GitHub Actions 会执行安装依赖、构建 Astro、上传 Pages artifact 和部署。

本地只需要保证 `npm run build` 通过，线上大部分问题都可以从 Actions 日志和浏览器控制台定位。

## DNS 注意点

如果以后换 DNS 服务商，需要确认根域名指向 GitHub Pages 的地址，同时 GitHub Pages 设置里仍然绑定 `zdhua.me`。
