---
title: "k8s资源删除报Terminating卡住"
date: 2024-08-29
description: "k8s资源删除报Terminating卡住。"
tags: ["Kubernetes", "terminating", "crd", "namespace"]
type: 'k8s-solve'
---

本文解决了k8s资源删除报Terminating卡住的问题。

<!--more-->

# 1.方案一
> 适用资源类型：pod、deploy、namespaces、crd
- 使用kubectl delete crd卡住，用以下命令更新该资源的状态：
```bash
kubectl patch crd/inferenceservices.serving.kserve.io -p '{"metadata":{"finalizers":[]}}' --type=merge
```


# 2.方案2(优先方案一)
```bash

# 1.导出配置
kubectl get ns rook-ceph -o json > tmp.json

# 2.删除tmp.json中spec及status部分的内容

# 3.启动代理
kubectl proxy

# 4.调用接口删除
curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp.json http://127.0.0.1:8001/api/v1/namespaces/rook-ceph/finalize
```