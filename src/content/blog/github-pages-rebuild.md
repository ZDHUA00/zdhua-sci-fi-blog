---
title: "从 Caddy 到 GitHub Pages：个人博客部署重构"
description: "把旧服务器部署抽离出来，让博客变成低维护、可回滚、能直接通过 GitHub Pages 发布的静态站点。"
date: 2026-06-26
category: "Deploy"
tags: ["GitHub Pages", "Caddy", "Static"]
readTime: "6 min"
signal: "DEP-026"
featured: true
---

服务器适合跑动态服务、网关和自动化任务，但个人博客不一定要占用它的磁盘、容器和反代维护精力。新的博客使用 Astro 输出静态文件，通过 GitHub Pages 发布。

## 重构目标

- 把博客从服务器运行时剥离出来。
- 保留完整部署记录，避免以后忘记 Caddy、Docker 和 DNS 的关系。
- 让每次更新都能通过 Git 提交、GitHub Actions 构建和 Pages 发布完成。

## 后续计划

`blog.zdhua.me` 可以作为独立入口，DNS 指向 GitHub Pages。服务器只保留 API、代理、自动化和面板类服务。
