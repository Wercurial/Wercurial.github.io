---
title: "Gitlab-ce中文版安装及维护"
date: 2024-03-29
description: "Gitlab-ce中文版安装及维护。"
tags: ["os", "Linux", "gitlab-ce"]
type: 'blog'
---

# 1. 启动中文版gitlab-ce容器
## 1.1 自动启动模式
```bash
docker run -d -p 8443:443 -p 8090:80 -p 8022:22 --restart always --name gitlab11 -v /usr/local/gitlab11/etc:/etc/gitlab -v /usr/local/gitlab11/log:/var/log/gitlab -v /usr/local/gitlab11/data:/var/opt/gitlab --privileged=true twang2218/gitlab-ce-zh:11.1
```

## 1.2 手动启动调试模式
```bash
docker run -d -p 8443:443 -p 8090:80 -p 8022:22 --restart always --name gitlab11 -v /usr/local/gitlab11/etc:/etc/gitlab -v /usr/local/gitlab11/log:/var/log/gitlab -v /usr/local/gitlab11/data:/var/opt/gitlab --privileged=true twang2218/gitlab-ce-zh:11.1 /bin/bash -c "while true;do sleep 100; done"
```
调试完成后，启动命令
```bash
/assets/wrapper
```
执行启动命令有可能会遇到配置不一致问题，需重新加载配置
```bash
gitlab-ctl reconfigure
```

# 2. gitlab-ce异常断电调试
## 2.1 GitLab external URL must include a schema and FQDN, e.g. [http://gitlab.example.com/](http://gitlab.example.com/)
解决办法：
```
vim /etc/gitlab/gitlab.rb
```
将
```
external_url 'YYY'
```
改成
```
external_url= 'http：//本机IP'
```
## 2.2 Failed asserting that mode permissions on "/var/opt/gitlab/git-data/repositories" is 2770
解决办法
```
chmod 2770 /var/opt/gitlab/git-data/repositories
```