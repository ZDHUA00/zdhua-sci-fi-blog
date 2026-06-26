---
title: "AI 工具链日志：把试错变成可复用系统"
description: "记录本地工具、远程服务器、GitHub 发布和浏览器验证之间的协作方式。"
date: 2026-06-08
category: "AI"
tags: ["Codex", "Tooling", "Verification"]
readTime: "4 min"
signal: "AI-008"
featured: false
---

AI 辅助开发不是只生成代码。更关键的是把环境、命令、截图、服务器状态和部署结果串成可验证链路。

## 工作方式

先读现有状态，再动代码。每个阶段都留下可复查证据：构建输出、截图、Git 状态、服务器命令结果。

## 验证方式

对于前端，构建通过只是底线。还需要真实浏览器截图，检查桌面、移动端、文本溢出和交互状态。
