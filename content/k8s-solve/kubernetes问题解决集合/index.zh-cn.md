---
title: "kubernetes问题解决集合"
date: 2024-09-01
description: "kubernetes问题解决集合"
tags: ["Kubernetes", "solve", "containerd", "question"]
type: 'blog'
---

kubernetes问题解决集合。

<!--more-->

# 1. 宿主机修改时DNS（/etc/resolv.conf）配置
- 宿主机集群更改DNS服务(/etc/resolv.conf), 需同时重启nodelocaldns(部分集群高配nodelocaldns)及coredns服务

# 2. 进入CoreDNS容器内部操作
## 2.1 进入k8s的coredns容器查看信息:
您可以按照此处的说明使用 sidecar 模式:[https://support.rancher.com/hc/en-us/articles/360041568712-How-to-troubleshoot-using-the-namespace-of-a-container#sidecar-container-0-2](https://support.rancher.com/hc/en-us/articles/360041568712-How-to-troubleshoot-using-the-namespace-of-a-container#sidecar-container-0-2)

## 2.2 简而言之，这样做是为了找到一个运行 coredns pod 的节点:
- kubectl -n kube-system get po -o wide | grep coredns
- ssh 到这些节点之一，然后: docker ps -a | grep coredns
- 将容器 ID 复制到剪贴板并运行:
```bash
ID=<paste ID here>
docker run -it --net=container:$ID --pid=container:$ID --volumes-from=$ID alpine sh
```
- 您现在将位于“sidecar”容器内，可以四处查看。
```bash
cat /etc/coredns/Corefile
```

# 3. 带有nodelocaldns集群重启后dns异常
nodenocaldns日志报错如下：
```yaml
coredns  HINFO: read tcp 10.233.90.147:44370->172.16.1.207:53: i/o timeout
```
通过排查发现是nolocaldns的53指向不是集群的dns服务器<br />修改nodecaldns的corefile

- 将其中 forward . 10.233.90.242  手动改为forward . 10.233.0.3
- 10.233.0.3为coredns的vip地址
- 10.233.90.242为coredns的pod ip地址，重启pod后发生变动，因此采用vip作为指向
```yaml
cluster.local:53 {
    errors
    cache {
        success 9984 30
        denial 9984 5
    }
    reload
    loop
    bind 169.254.25.10
    forward . 10.233.0.3 {
        force_tcp
    }
    prometheus :9253
    health 169.254.25.10:9254
}
in-addr.arpa:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.25.10
    forward . 10.233.0.3 {
        force_tcp
    }
    prometheus :9253
}
ip6.arpa:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.25.10
    forward . 10.233.0.3 {
        force_tcp
    }
    prometheus :9253
}
.:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.25.10
    forward . /etc/resolv.conf
    prometheus :9253
}
```
重新观察nodelocaldns日志，服务正常


# 4. K8S版本与Linux内核不兼容导致内存泄露问题
## 4.1 背景
 kubelet误报内存压力(实际内存使用率很小)->节点被打污点->节点上pod处于驱逐状态->重启kubelet会恢复  
```yaml
mkdir /sys/fs/cgroup/memory/kubepods/besteffort/pod54ca8314-ae1a-4d22-8564-fdd73215f1cc: cannot allocate memory
Normal   Scheduled                 7m19s                  default-scheduler  Successfully assigned default/kt-rectifier-rulla to node133
  Warning  FailedCreatePodContainer  2m1s (x26 over 7m20s)  kubelet            unable to ensure pod container exists: failed to create container for [kubepods besteffort pod54ca8314-ae1a-4d22-8564-fdd73215f1cc] : mkdir /sys/fs/cgroup/memory/kubepods/besteffort/pod54ca8314-ae1a-4d22-8564-fdd73215f1cc: cannot allocate memory
```
## 4.2 Cgroup
在当前内核版本（3.x）下，开启了kmem accounting功能，会导致memory cgroup的条目泄漏无法回收。

## 4.3 解决方案

#### 4.3.1 重启内存泄露服务器（临时解决）

#### 4.3.2 升级内核版本-4.x（永久解决）
- 具体升级方案参考《Centos7内核升级》一文

