---
title: "K8S集群通过velero备份及还原"
date: 2024-07-13
description: "K8S集群通过velero备份及还原"
tags: ["Kubernetes", "velero", "backup", "restore"]
type: 'blog'
---

# 0. 前言
> 相比其他传统备份工具，Velero 并不仅仅备份存储数据，它还能够备份 Kubernetes 中的应用状态和集群资源。Kubernetes 集群中的资源包括 Pod、Service、ConfigMap、Ingress 等，它们共同定义了应用的状态和行为。Velero 可以将这些资源与持久化卷（Persistent Volume，PV）的数据一起备份，保证整个应用环境的完整性.

- [velero官网](https://velero.io/docs)
- 集群备份：Velero允许对Kubernetes集群中的所有资源（如Deployment、Service、ConfigMap等）以及数据卷（PVC）进行备份。可以执行一次性备份或通过定期任务实现自动备份，确保集群始终有最新的可用备份。
- 灾难恢复：如果集群由于硬件故障、系统崩溃或误操作而丢失数据或配置，Velero可以快速恢复之前备份的资源和数据，减少宕机时间和业务损失。
- 数据迁移：Velero可以在不同的Kubernetes集群之间迁移资源和数据。例如，可以将开发环境中的工作负载迁移到生产环境，或者将工作负载从一个云服务商迁移到另一个云服务商。


# 1. 准备工作
## 1.1 创建velero命名空间
- 创建命令空间
```bash
kubectl create ns velero
```

## 1.2 安装备份数据载体
- 本例通过minio作为备份数据存储
  - 生产环境中建议定期将minio上的数据保存至可靠本地存储介质存储
- 本例通过`rook-ceph`提供pv给minio使用
  - `kubectl create -f velero-pvc.yaml`
```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: velero-pvc
  namespace: velero
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 300Gi
  storageClassName: rook-cephfs
  volumeMode: Filesystem
```
- minio安装文件
  - `kubectl create -f minio.yaml`
```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: minio
  namespace: velero
  labels:
    component: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      component: minio
  template:
    metadata:
      creationTimestamp: null
      labels:
        component: minio
    spec:
      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: velero-pvc
        - name: config
          emptyDir: {}
      containers:
        - name: minio
          image: 'minio/minio:RELEASE.2023-03-20T20-16-18Z'
          args:
            - server
            - /data
            - '--config-dir=/config'
            - '--console-address=:9001'
          ports:
            - containerPort: 9000
              protocol: TCP
            - containerPort: 9001
              protocol: TCP
          env:
            - name: MINIO_ROOT_USER
              value: admin
            - name: MINIO_ROOT_PASSWORD
              value: admin123456
          resources:
            limits:
              cpu: '2'
              memory: 4Gi
            requests:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: storage
              mountPath: /data
            - name: config
              mountPath: /config
---
kind: Service
apiVersion: v1
metadata:
  namespace: velero
  name: minio
  labels:
    component: minio
spec:
  type: Nodeport
  ports:
  - name: port
    port: 9000
    protocol: TCP
    targetPort: 9000
  - name: console
    port: 9001
    protocol: TCP
    targetPort: 9001
  selector:
    component: minio
```

## 1.3 minio上创建bucket
- 待minio部署完毕后，登陆minio
  - 创建velero存储bucket：`velero`
![image.png](./1.png)

# 2. 安装velero
- 根据自己的k8s集群版本，选择对应的velero版本
  - 因为我的k8s集群为`v1.22.5`，版本列表中最新的支持到`v1.23.10`
  - 因此，我选用了`velero-1.10.0版本`，幸运的是也可以正常使用
![image.png](./2.png)
## 2.1 安装velero客户端
- 下载velero客户端二进制文件包
```bash
wget https://github.com/vmware-tanzu/velero/releases/download/v1.10.0/velero-v1.10.0-linux-amd64.tar.gz
```
- 解压至`/usr/local/bin`
```bash
tar -zxvf velero-v1.10.0-linux-amd64.tar.gz 
chmod +x velero-v1.10.0-linux-amd64/velero 
mv velero-v1.10.0-linux-amd64/velero /usr/local/bin/
```
- 验证客户端是否正常
```bash
velero version
```
![image.png](./3.png)
## 2.2 创建velero访问minio密钥文件
- 创建文件：`velero-secret`
```ini
[default]
aws_access_key_id = admin
aws_secret_access_key = admin123456
```
## 2.3 安装velero服务端
- s3插件`velero-plugin-for-aws`与velero版本对应关系如下
  - 本文选择`1.6.2`版本

![image.png](./4.png)

- 通过客户端命令安装服务端
```bash
velero install --provider aws --plugins velero/velero-plugin-for-aws:v1.6.2 --image velero/velero:v1.10.0 --namespace velero  --bucket velero --default-volumes-to-fs-backup --use-volume-snapshots=false --secret-file ./velero-secret --use-node-agent  --backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://minio.velero:9000
```
- 查看部署状态，是否正常运行
  - `kubectl get pod -n velero`

![image.png](./5.png)

# 3. 备份及还原
## 3.1 备份
### 3.1.1 备份指令说明
- 命令不指定namespace和资源的情况下，将备份整个集群的所有资源
```bash
velero backup create backup-k8s-all
```
- 备份指定namespace资源
```bash
velero backup create backup-k8s-test --include-namespaces test
```

## 3.2 还原
- 删除集群中已经存在的`Postgres`的deployment及其pvc
- 恢复命令
```bash
velero restore create --from-backup backup-k8s-test --include-namespaces test
```
- 首先会按照原先pvc定义创建一个pvc
- 其次会启动一个velero的边车容器用于恢复数据状态
![image.png](./6.png)
- 最后按照原先集群中的`Postgres`状态恢复
![image.png](./7.png)

## 3.3 定时备份
- 设置定时任务，每天凌晨2点进行备份
  - velero schedule create backup-k8s-all：这部分是命令的开头，它告诉 Velero 要创建一个新的备份调度任务，并将这个任务命名为 k8s-dev。
  - --schedule="0 2 * * *"：这个参数指定了备份任务的调度时间。它使用的是一个 cron 表达式，用于定义任务应该何时运行。在这个例子中，0 2 * * * 的含义是每天的凌晨 2 点执行一次备份。cron 表达式的格式通常是 分钟 小时 日 月 星期，其中星号（*）表示任意值。
  - --exclude-resources pods：这个参数指定了在备份过程中应该排除的资源类型。在这个例子中，它告诉 Velero 在执行备份时不要包括 pods。这通常是因为 pods 是短命的，它们的状态不应被持久化备份，而且 pods 的数据通常存储在持久卷中，这些卷可以被单独备份。
  - --ttl 240h：这个参数设置了备份的保留时间（Time-To-Live, TTL）。在这个例子中，它告诉 Velero 保留备份 240 小时（即 10 天）后删除它们。这有助于管理备份存储的空间，确保旧的、不再需要的备份不会无限期地保留下来。
```bash
velero schedule create backup-k8s-all --schedule="0 2 * * *"  --exclude-resources pods --ttl 240h
```