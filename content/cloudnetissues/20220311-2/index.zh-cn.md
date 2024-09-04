---
title: "k8s容器间免密访问方案"
date: 2022-03-11
description: "实现k8s容器间免密访问方案"
tags: ["Kubernetes", "ssh", "nossh"]
type: 'blog'
---
{{< typeit
  tag=h5
  speed=80
  loop=true
  lifeLike=true
>}}"无聊望见了犹豫, 达到理想不太易~"
{{< /typeit >}}

实现k8s容器间免密访问方案

<!--more-->

> **Pod 使用同样的私钥/公钥，可以互相免密访问**
> 只需生成同样的 `id_rsa`和 `id_rsa.pub`，然后将 `authorized_keys`的内容设为`id_rsa.pub`一致。也即将相同的配置文件挂载到不同的Pod上即可

config文件配置

- 将 `id_rsa,id_rsa.pub,authorized_keys,config`作为 configmap的内容。

```properties
# 第一次访问时，无需确认，直接连接
StrictHostKeyChecking no
UserKnownHostsFile /dev/null
# pod 间无法通过 hostname 直接访问对方的，因此需要 service
Host pod-hostname-1
  HostName  pod-hostname-1.service-name
Host pod-hostname-2
  HostName  pod-hostname-2.service-name
```

## 1. Pod 主机名解析

### 1.1 pod 间无法通过 hostname 直接访问对方的，因此需要 service：

- 可以参考 [Pod 间通信](https://kubernetes.io/docs/tasks/job/job-with-pod-to-pod-communication/)；

#### 1.1.1 启动带 Pod 间通信的 Job

要在某 Job 中启用使用 Pod 主机名的 Pod 间通信，你必须执行以下操作：

1. 对于 Job 所创建的那些 Pod， 使用一个有效的标签选择算符创建[无头服务](https://kubernetes.io/zh-cn/docs/concepts/services-networking/service/#headless-services)。 该无头服务必须位于与该 Job 相同的名字空间内。 实现这一目的的一种简单的方式是使用 `job-name: <任务名称>` 作为选择算符， 因为 `job-name` 标签将由 Kubernetes 自动添加。 此配置将触发 DNS 系统为运行 Job 的 Pod 创建其主机名的记录。
2. 通过将以下值包括到你的 Job 模板规约中，针对该 Job 的 Pod，将无头服务配置为其子域服务：

```yaml
subdomain: <无头服务的名称>
```

示例:以下是启用通过 Pod 主机名来完成 Pod 间通信的 Job 示例。 只有在使用主机名成功 ping 通所有 Pod 之后，此 Job 才会结束。

> #### 说明：
>
> 在以下示例中的每个 Pod 中执行的 Bash 脚本中，如果需要从名字空间外到达 Pod， Pod 主机名也可以带有该名字空间作为前缀。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: headless-svc
spec:
  clusterIP: None # clusterIP 必须为 None 以创建无头服务
  selector:
    job-name: example-job # 必须与 Job 名称匹配
---
apiVersion: batch/v1
kind: Job
metadata:
  name: example-job
spec:
  completions: 3
  parallelism: 3
  completionMode: Indexed
  template:
    spec:
      subdomain: headless-svc # 必须与 Service 名称匹配
      restartPolicy: Never
      containers:
      - name: example-workload
        image: bash:latest
        command:
        - bash
        - -c
        - |
          for i in 0 1 2
          do
            gotStatus="-1"
            wantStatus="0"             
            while [ $gotStatus -ne $wantStatus ]
            do                                       
              ping -c 1 example-job-${i}.headless-svc > /dev/null 2>&1
              gotStatus=$?                
              if [ $gotStatus -ne $wantStatus ]; then
                echo "Failed to ping pod example-job-${i}.headless-svc, retrying in 1 second..."
                sleep 1
              fi
            done                                                         
            echo "Successfully pinged pod: example-job-${i}.headless-svc"
          done    
```

应用上述示例之后，使用 `<Pod 主机名>.<无头服务名>` 通过网络到达彼此。 你应看到类似以下的输出：

```bash
kubectl logs example-job-0-qws42
```

```bash
Failed to ping pod example-job-0.headless-svc, retrying in 1 second...
Successfully pinged pod: example-job-0.headless-svc
Successfully pinged pod: example-job-1.headless-svc
Successfully pinged pod: example-job-2.headless-svc
```

说明：谨记此例中使用的 `<Pod 主机名>.<无头服务名称>` 名称格式不适用于设置为 `None` 或 `Default` 的 DNS 策略。 你可以在[此处](https://kubernetes.io/zh-cn/docs/concepts/services-networking/dns-pod-service/#pod-s-dns-policy)了解有关 Pod DNS 策略的更多信息。

### 1.2 hostname 必须是规则化，才可以静态生成所有的主机名：

- 可以用 Statefulset 或者 IndexJob 来生成有规则的 hostname。

### 1.3 Pod 挂载 SSH ConfigMap

想要免密，则 Pod 上挂载相应的configmap 即可。

```yaml
spec:
  containers:
    volumeMounts:
    - name: ssh-config
      mountPath: /root/.ssh
      # use subpath to avoid soft link
      subPath: .ssh
  volumes:
    - name: ssh-config
    configMap:
      name: ssh-config-cm
      defaultMode: 0600
      items:
        - key: PRIVATE_KEY
          path: .ssh/id_rsa
        - key: PUBLIC_KEY
          path: .ssh/id_rsa.pub
        - key: AUTHORIZED_KEYS
          path: .ssh/authorized_keys
        - key: CONFIG
          path: .ssh/config
```