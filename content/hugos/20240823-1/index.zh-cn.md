---
title: "hugo博客-blowfish主题添加giscus作为评论系统"
date: 2024-08-23
description: "添加giscus，用于博客交流。"
tags: ["hugo", "blowfish", "comments"]
type: 'blog'
---

添加giscus，用于博客交流。

<!--more-->

# 1. 创建评论相关文件
## 1.1 创建comments.html文件
- 在layouts/partials目录下创建comments.html
    - 以下参数来自giscus，具体参考官网`https://giscus.app/zh-CN`
```html
<script src="https://giscus.app/client.js"
        data-repo="xxx/xxx"
        data-repo-id="xxxx"
        data-category="Announcements"
        data-category-id="xxxx"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        data-loading="lazy"
        crossorigin="anonymous"
        async>
</script>
```

# 2. 添加配置
## 2.1 config.toml中添加配置
- 在themes/blowfish/config.toml中添加如下配置
    - 以下参数来自giscus，具体参考官网`https://giscus.app/zh-CN`
```toml
[params.giscus]
    data-repo="xxx/xxxx"
    data-repo-id="xxx"
    data-category="Announcements"
    data-category-id="xxx"
    data-mapping="pathname"
    data-strict="0"
    data-reactions-enabled="1"
    data-emit-metadata="0"
    data-input-position="top"
    data-theme="preferred_color_scheme"
    data-lang="zh-CN"
    data-loading="lazy"
    crossorigin="anonymous"
```
## 2.2 params.toml中添加配置
- config/_default/params.toml中添加如下配置
    - `showComments = true`
```toml
[article]
  showDate = true
  ...
  showWordCount = true
  showComments = true
```