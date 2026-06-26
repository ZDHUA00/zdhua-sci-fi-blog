---
title: "168.144.35.205 服务地图：域名、容器与反代"
description: "把服务器上的公网入口、Docker 容器、关键配置路径整理成可维护的结构。"
date: 2026-06-24
category: "Ops"
tags: ["Server", "Docker", "Reverse Proxy"]
readTime: "8 min"
signal: "OPS-168"
featured: true
---

服务器上的服务已经形成清晰分层：Caddy 负责公网入口，Docker 容器承载主要应用，Cloudflare 负责 DNS 和部分边缘入口。

## 当前原则

- 修改 Caddy 前先备份配置。
- 重要容器必须有明确端口、目录和健康检查。
- 旧服务删除前先确认域名、反代、容器和数据目录都属于同一目标。

## 维护记录

旧 `webchat.zdhua.me` 已从 DNS、Caddy 和 Docker 中移除。新的博客也应该走静态托管，不重新增加服务器压力。
