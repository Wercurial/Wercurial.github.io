---
title: "docker及containerd镜像代理配置"
date: 2023-03-11
description: "实现docker及containerd镜像代理"
tags: ["Kubernetes", "docker", "containerd", "proxy"]
type: 'Kubernetes'
---

实现docker及containerd镜像代理配置。

<!--more-->

# 1. docker配置代理
- 修改docker配置： `/etc/docker/daemon.json`
```json
"registry-mirrors": [
        "https://xxx.xxx.xxx"
    ],
```
- 重启服务
```bash
systemctl daemon-reload
systemctl restart docker
```
拉取镜像测试
```bash
docker pull nginx
```

# 2. containerd配置代理
- 修改docker配置： `/etc/containerd/config.toml`
```toml
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://xxx.xxx.xxx"]
```
- 重启服务
```bash
systemctl daemon-reload
systemctl restart containerd
```
拉取镜像测试
```bash
crictl pull nginx
```