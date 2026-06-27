---
title: "为什么选择 Astro Sphere 作为模板方向"
description: "Astro Sphere 的重点是轻量、个人品牌和博客/项目组合，比纯炫酷界面更适合长期维护。"
pubDate: 2026-06-27
tags: ["Astro Sphere", "开源模板", "设计"]
channel: "DESIGN-02"
status: "已发布"
intensity: 74
accent: "cyan"
readTime: "5 min"
---

Astro Sphere 是一个开源的 Astro 个人主页模板，MIT 许可证，定位是 portfolio and blog。它的结构很清晰：首屏介绍个人身份，下面是 About、Recent posts、Tech stack、Recent projects 和联系入口。

对 `ZDHUA-Blog` 来说，这种结构比单纯的博客列表更合适。它能让首页先表达个人品牌，再把文章和项目作为后续内容承接。

## 我保留了什么

我保留的是 Astro Sphere 的产品思路，而不是直接复制所有代码。当前站点仍然使用原有 Astro 5、Content Collections、GitHub Pages workflow 和 `zdhua.me` 部署配置。

视觉上保留深色星空和轨道感，让它更符合我的偏好，但布局节奏会靠近 Astro Sphere：少一点杂乱面板，多一点清晰内容层级。

## 为什么不直接整仓覆盖

Astro Sphere 原模板使用 Tailwind、SolidJS、MDX、搜索组件和多套脚本。直接覆盖会让当前部署风险变大，也会引入一批暂时用不到的依赖。

所以这次选择更稳的方式：移植结构和视觉方向，用当前项目的原生 CSS/JS 实现。
