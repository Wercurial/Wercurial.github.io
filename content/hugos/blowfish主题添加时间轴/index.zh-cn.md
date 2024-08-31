---
title: "hugo博客-blowfish主题添加时间轴"
date: 2024-08-25
description: "添加时间轴，用于归档博客。"
tags: ["hugo", "blowfish", "archives"]
type: 'blog'
---

添加时间轴，归档博客。

<!--more-->

# 1. 创建时间轴相关文件
## 1.1 创建archives.html文件
- 复制layouts/default目录下的single.html文件为archives.html,并用以下代码替代html中的`{{ .Content }}`
    - {{ range (where .Pages "Type" "blog") }}：用于仅展示content目录下类型为blog的md文件
```html
    {{ range (.Site.RegularPages.GroupByDate "2006") }}   
    <h3>{{ .Key }}</h3>  
    <ul class="archive-list">  
        {{ range (where .Pages "Type" "blog") }}
            <li>  
                {{ .PublishDate.Format "2006-01-02" }}  
                ->  
                <a href="{{ .RelPermalink }}">{{ .Title }}</a>  
            </li>  
        {{ end }}  
    </ul>  
    {{ end }} 
```
## 1.2 创建archives.md文件
- 在content目录下创建archives.md文件
```markdown
---
title: "时间轴"
layout: "archives"
date: 2017-07-17
description: "历史文章按照年归档."
type: "archives"

cascade:
  showDate: true
  showAuthor: true
  invertPagination: true
---
```

# 2. 添加配置
- 在config/_default/menus.zh-cn.toml中添加如下配置
```toml
[[main]]
  name = "时间轴"
  pageRef = "archives"
  weight = 300
```