---
title: "ConfigMap使用"
date: 2024-09-13
description: "k8s的configmap使用技巧"
tags: ["Kubernetes", "configmap", "cm", "path"]
type: 'blog'
---

# 1. 设置Pod从环境变量读取ConfigMap
## 1.1 ConfigMap文件编写
- test-configmap.yaml
```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm
  namespace: test
data:
  nacos.port: "5004"
  nacos.addr: "nacos-0.nacos-headless.test.svc.cluster.local:8848"
  mysql.ip: "172.16.2.227"
  mysql.port: "3306"
  mysql.user: "root"
  mysql.passwd: "root"
```

## 1.2 pod.yaml使用configmap
- 直接从环境变量读取通过configmap设置的参数值
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: bd
  namespace: test
  labels:
    app: bd-label
spec:
  containers:
    - name: bd
      image: test/bd:1.0.17
      imagePullPolicy: IfNotPresent
      command: [ "/bin/sh", "-c" ]
      args:
        - echo "start~~~";
          sh /bd-server-1.0.17/bin/upgrade_db.sh;
          echo "start upgrade_db success~~~";
          sh /bd-server-1.0.17/bin/start.sh --drun;
          echo "start success~~~";
      resources:
        requests:
          cpu: "2"
          memory: 2000Mi
        limits:
          cpu: "4"
          memory: 6000Mi
      ports:
        - name: http
          containerPort: 5004
      env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: test-cm
              key: nacos.port
        - name: NACOS_SERVER_ADDRESS
          valueFrom:
            configMapKeyRef:
              name: test-cm
              key: nacos.addr
```

# 2. 设置pod以配置文件形式挂载ConfigMap
## 2.1 通过配置文件生成ConfigMap
```bash
kubectl create configmap bd-cm1 --from-file=yarn-site.xml --from-file=hdfs-site.xml  -n test
```

## 2.2 通过pod挂载卷的形式挂载ConfigMap的配置文件到pod指定目录
- 挂载到容器内/hadoop/conf目录下
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: bd
  namespace: test
  labels:
    app: bd-label
spec:
  hostAliases:
  - ip: "172.16.3.33"
    hostnames:
    - "master01"
  volumes:
    - name: bd-cm
      configMap:
        name: bd-cm
  containers:
    - name: bd
      image: test/bd:1.0.17
      imagePullPolicy: IfNotPresent
      command: [ "/bin/sh", "-c" ]
      args:
        - echo "start~~~";
          sh /bd-server-1.0.17/bin/upgrade_db.sh;
          echo "start upgrade_db success~~~";
          sh /bd-server-1.0.17/bin/start.sh --drun;
          echo "start success~~~";
      resources:
        requests:
          cpu: "2"
          memory: 2000Mi
        limits:
          cpu: "4"
          memory: 6000Mi
      ports:
        - name: http
          containerPort: 5004
      volumeMounts:
        - mountPath: /hadoop/conf
          name: bd-cm
      env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: test-cm
              key: nacos.port
        - name: NACOS_SERVER_ADDRESS
          valueFrom:
            configMapKeyRef:
              name: test-cm
              key: nacos.addr
        - name: master01
          value: "172.16.3.33"
```
- 效果展示
```bash
kubectl get configmaps bd-cm -o yaml -n test
```
- 删除configmap
```bash
kubectl delete configmap bd-cm -n test
```