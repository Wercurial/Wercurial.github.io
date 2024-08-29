---
title: "Kubernetes命令集合"
date: 2022-03-12
description: "收集各类常见kubernetes命令"
tags: ["Kubernetes", "shell", "command", "sh"]
type: 'Kubernetes'
---

收集各类常见kubernetes命令。

<!--more-->

# 1. 取消主节点禁止调度污点
● 较旧版本
```bash
kubectl taint node k3s01 node-role.kubernetes.io/master:NoSchedule-
```

● 较新版本：
```bash
kubectl taint node k3s01 node-role.kubernetes.io/control-plane:NoSchedule-
```