---
title: "docker开放远程操作api（2375）"
date: 2023-03-11
description: "实现docker远程操作api（2375端口）开放"
tags: ["Kubernetes", "docker", "api"]
type: 'blog'
---

实现docker远程操作api（2375端口）开放。

<!--more-->

# 1. 检查2375端口是否开启
```bash
netstat -tuln | grep 2375
```
如果已开启，则会出现如下日志
```bash
root@work01:~# netstat -tuln | grep 2375
tcp6       0      0 :::2375                 :::*                    LISTEN
```
如果未输出以上日志，则进入下一步开启2375端口

# 2. 开启2375端口
## 2.1 修改docker配置文件: `/etc/docker/daemon.json`
- 新增如下配置
  - 这段配置的意思是允许Docker监听在0.0.0.0的2375端口上，这样就可以远程访问Docker
```json
{
  "hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"]
}
```
## 2.2 重启docker
```bash
systemctl restart docker
```