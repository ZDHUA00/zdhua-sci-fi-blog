---
title: "把 Astro 内容做成舰船档案"
description: "用 Astro Content Collections 管理日志元数据，让标签、声道、状态和信号强度都能参与界面生成。"
pubDate: 2026-06-24
tags: ["Astro", "内容系统", "设计"]
channel: "ARCHIVE-09"
status: "ONLINE"
intensity: 59
accent: "magenta"
readTime: "5 min"
---

博客不是只有标题和正文。为了让界面更像档案系统，每篇文章都带有声道、状态、信号强度和主题色。

这些字段不是装饰用的。列表页用它们生成信号图、筛选状态和视觉强调，详情页也会把同一组数据延续到文章头部。

## 内容字段

`channel` 表示档案编号。

`status` 表示当前状态。

`intensity` 会影响信号图的波形密度。

`accent` 控制文章所属的强调色。

## 为什么仍然用 Markdown

Markdown 对个人博客最直接。写文章时不用碰组件，页面结构却能通过 Astro 在构建时统一生成。

这样既保留博客的轻量，也能做出更强的视觉系统。
