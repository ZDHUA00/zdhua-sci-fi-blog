---
title: "从 Caddy 到 GitHub Pages：个人博客部署重构"
description: "把博客从服务器运行时中抽离，交给 GitHub Pages 自动构建和发布，让更新路径更清晰，也更容易回滚。"
date: 2026-06-26
category: "Deploy"
tags: ["GitHub Pages", "Astro", "Cloudflare"]
readTime: "7 min"
signal: "DEP-026"
cover: "assets/covers/deploy-orbit.png"
coverAlt: "GitHub Pages 部署轨道的科幻封面图"
featured: true
---

旧博客放在服务器上时，发布链路混在 Caddy、Docker、静态目录和 DNS 配置之间。它可以运行，但每一次调整都需要先判断文件在哪、服务是否占用端口、反代是否还指向旧路径。

这次重构的目标很明确：博客应该是低维护、可验证、可回滚的静态站点。服务器继续负责 API、面板和自动化服务，博客交给 Astro 构建，再由 GitHub Pages 发布。

## 新的部署路径

- 内容和代码都在 Git 仓库里，提交记录就是发布记录。
- GitHub Actions 使用 `npm ci` 和 `npm run build` 生成 `dist`。
- Pages 发布静态产物，不依赖服务器进程。
- `zdhua.me` 通过 Cloudflare 指向 GitHub Pages，后续只需要维护 DNS 和仓库配置。

## 为什么使用 Astro

Astro 对个人博客很合适：内容可以写 Markdown，页面输出是静态 HTML，运行时负担很低。这里的交互效果也不需要复杂前端框架，原生 CSS 和 JavaScript 足够完成搜索、分类、音乐播放器、视觉动效和阅读进度。

## 保留服务器边界

服务器不是被废弃，而是回到它更适合的位置：处理动态服务、自动化任务、反向代理和长期运行的容器。博客这种内容型站点不再占用服务器目录，也减少了误删、误改和暴露旧 `.git` 路径的风险。

## 下一步

接下来每次改博客都走同一条路径：本地修改、构建验证、提交推送、GitHub Actions 发布、线上访问检查。这样出现问题时可以直接回滚 Git 提交，而不是在服务器上追踪未知状态。
