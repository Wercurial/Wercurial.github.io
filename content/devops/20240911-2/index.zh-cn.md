---
title: "Devops之ArgoCD部署"
date: 2024-09-11
description: "实现argocd部署"
tags: ["Kubernetes", "cd", "devops", "argocd"]
type: 'blog'
---



# 1. argocd部署使用


# 2. argocd部署结果通知


# 3. argocd部署问题解决
## 3.1 权限问题
- 报错如下
```bash
Failed to load live state: failed to get cluster info for "https://kubernetes.default.svc": error synchronizing cache state : failed to sync cluster https://10.96.0.1:443: failed to load initial state of resource BGPFilter.projectcalico.org: bgpfilters.projectcalico.org is forbidden: User "system:serviceaccount:argo-cd:argocd-application-controller" cannot list resource "bgpfilters" in API group "projectcalico.org" at the cluster scope
```
- 通过排查发现，是因为用了自定义namespace: `argo-cd`，而 clusterrolebinding 需要命名空间argocd
- 解决方案
  - 编辑`argocd-application-controller`和`argocd-server`对应的clusterrolebinding里面的默认namespace（`argocd`）为自定义的namespace（`argo-cd`）
```bash
kubectl edit clusterrolebinding argocd-application-controller -n <namespace>
kubectl edit clusterrolebinding argocd-server -n <namespace>
```