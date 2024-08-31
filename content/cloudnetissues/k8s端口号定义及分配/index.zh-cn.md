---
title: "k8s端口号定义及分配"
date: 2022-03-11
description: "实现k8s端口号定义及分配"
tags: ["Kubernetes", "service", "port"]
type: 'blog'
---

实现k8s端口号定义及分配

<!--more-->

# 1. NodePort 范围
> 在 Kubernetes 集群中，NodePort 默认范围是 30000-32767

# 2. 增大NodePort范围
修改kube-apiserver.yaml文件

● 使用 kubeadm 安装 K8S 集群的情况下，您的 Master 节点上会有一个文件 /etc/kubernetes/manifests/kube-apiserver.yaml，修改此文件，向其中添加 --service-node-port-range=20000-22767 （定义需要的端口范围），如下所示：
```yaml
apiVersion: v1
kind: Pod
... ...
... ...
    - --service-account-key-file=/etc/kubernetes/pki/sa.pub
    - --service-node-port-range=20000-22767
    - --service-cluster-ip-range=10.96.0.0/22
    ... ...
    ... ...
```
# 3. 重启kube-apiserver
```bash
# 获得 apiserver 的 pod 名字
export apiserver_pods=$(kubectl get pods --selector=component=kube-apiserver -n kube-system --output=jsonpath={.items..metadata.name})
# 删除 apiserver 的 pod
kubectl delete pod $apiserver_pods -n kube-system
```
# 4.验证结果
● 执行以下命令查看相关pod
```bash
kubectl describe pod $apiserver_pods -n kube-system
```
注意:

● 对于已经创建的NodePort类型的Service，需要删除重新创建

● 如果集群有多个 Master 节点，需要逐个修改每个节点上的 /etc/kubernetes/manifests/kube-apiserver.yaml 文件，并重启 apiserver