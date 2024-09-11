---
title: "Devops之ArgoCD部署"
date: 2024-09-11
description: "实现argocd部署"
tags: ["Kubernetes", "cd", "devops", "argocd"]
type: 'blog'
---

# 1. argocd部署使用
## 1.1 服务端安装
- 使用自定义namespace(`argo-cd`)，而非默认的`argocd`
  - 会遇到权限问题，所以此步骤部署完成后，需要参考`5.1`步骤更新`clusterrolebinding`内的namespace
```bash
# 下载安装脚本
wget https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 创建argocd名空间
kubectl create namespace argo-cd

# 执行apply安装
kubectl apply -n argo-cd -f install.yaml

# 查看安装镜像下载状态
kubectl describe pod -n argocd |grep Image: |sort |uniq -c

# 开启UI的Nodeport
kubectl -n argocd expose deployments/argocd-server --type="NodePort" --port=8080 --name=argocd-server-nodeport

# 获取密码，用户名为：admin
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d|xargs -n1 echo
```
## 1.2 客户端安装
```bash
#下载最新版本
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

#下载具体版
在下面的命令中设置替换为您要下载的 Argo CD 版本：VERSION<TAG>
VERSION=<TAG> # Select desired TAG from https://github.com/argoproj/argo-cd/releases
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/download/$VERSION/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

#下载最新的稳定版本
#您可以通过执行以下步骤来下载最新的稳定版本：
VERSION=$(curl -L -s https://raw.githubusercontent.com/argoproj/argo-cd/stable/VERSION)
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/download/v$VERSION/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64
```


# 2. argocd部署结果通知
## 2.1 钉钉群机器人通知
- 钉钉群机器人如何配置略过
- 部署
  - 钉钉群机器人的webhook配置：https://oapi.dingtalk.com/robot/send?access_token=xxxx
  - argocd-ui地址：argocdUrl
  - namespace：argocd安装的命名空间
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: argocd-notifications-controller-dingtalk
  namespace: argo-cd
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: argocd-notifications-controller-dingtalk
  namespace: argo-cd
rules:
- apiGroups:
  - argoproj.io
  resources:
  - applications
  - appprojects
  verbs:
  - get
  - list
  - watch
  - update
  - patch
- apiGroups:
  - ""
  resources:
  - configmaps
  - secrets
  verbs:
  - list
  - watch
- apiGroups:
  - ""
  resourceNames:
  - argocd-notifications-cm
  resources:
  - configmaps
  verbs:
  - get
- apiGroups:
  - ""
  resourceNames:
  - argocd-notifications-secret
  resources:
  - secrets
  verbs:
  - get
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: argocd-notifications-controller-dingtalk
  namespace: argo-cd
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: argocd-notifications-controller-dingtalk
subjects:
- kind: ServiceAccount
  name: argocd-notifications-controller-dingtalk
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argo-cd
data:
  service.webhook.dingtalk: |
    url: https://oapi.dingtalk.com/robot/send?access_token=xxxx
    # url: https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
    headers:
      - name: Content-Type
        value: application/json
  context: |
    argocdUrl: http://xxx:xxx
  template.app-sync-change: |
    webhook:
      dingtalk:
        method: POST
        body: |
          {
            "msgtype": "markdown",
            "markdown": {
                "title":"ArgoCD同步状态",
                "text": "### ArgoCD同步状态\n> - app名称: {{.app.metadata.name}}\n> - app同步状态: {{ .app.status.operationState.phase}}\n> - 时间:{{.app.status.operationState.startedAt}}\n> - URL: [点击跳转ArgoCD]({{.context.argocdUrl}}/applications/{{.app.metadata.name}}?operation=true) \n"
            }
            }
  trigger.on-deployed: |
    - description: Application is synced and healthy. Triggered once per commit.
      oncePer: app.status.sync.revision
      send: [app-sync-change]  # template names
      # trigger condition
      when: app.status.operationState.phase in ['Succeeded'] and app.status.health.status == 'Healthy'
  trigger.on-health-degraded: |
    - description: Application has degraded
      send: [app-sync-change]
      when: app.status.health.status == 'Degraded'
  trigger.on-sync-failed: |
    - description: Application syncing has failed
      send: [app-sync-change]  # template names
      when: app.status.operationState.phase in ['Error', 'Failed']
  trigger.on-sync-running: |
    - description: Application is being synced
      send: [app-sync-change]  # template names
      when: app.status.operationState.phase in ['Running']
  trigger.on-sync-status-unknown: |
    - description: Application status is 'Unknown'
      send: [app-sync-change]  # template names
      when: app.status.sync.status == 'Unknown'
  trigger.on-sync-succeeded: |
    - description: Application syncing has succeeded
      send: [app-sync-change]  # template names
      when: app.status.operationState.phase in ['Succeeded']
  subscriptions: |
    - recipients: [dingtalk]  # 可能有bug，正常应该是webhook:dingtalk
      triggers: [on-sync-running, on-deployed, on-sync-failed, on-sync-succeeded]
---
apiVersion: v1
kind: Secret
metadata:
  name: argocd-notifications-secret
  namespace: argo-cd
type: Opaque
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/name: argocd-notifications-controller-dingtalk-metrics
  name: argocd-notifications-controller-dingtalk-metrics
  namespace: argo-cd
spec:
  ports:
  - name: metrics
    port: 9001
    protocol: TCP
    targetPort: 9001
  selector:
    app.kubernetes.io/name: argocd-notifications-controller-dingtalk
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argocd-notifications-controller-dingtalk
  namespace: argo-cd
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-notifications-controller-dingtalk
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app.kubernetes.io/name: argocd-notifications-controller-dingtalk
    spec:
      containers:
      - command:
        - /app/argocd-notifications-backend
        - controller
        image: argoprojlabs/argocd-notifications:v1.2.0
        imagePullPolicy: Always
        livenessProbe:
          tcpSocket:
            port: 9001
        name: argocd-notifications-controller-dingtalk
        volumeMounts:
        - mountPath: /app/config/tls
          name: tls-certs
        - mountPath: /app/config/reposerver/tls
          name: argocd-repo-server-tls
        workingDir: /app
      securityContext:
        runAsNonRoot: true
      serviceAccountName: argocd-notifications-controller-dingtalk
      volumes:
      - configMap:
          name: argocd-tls-certs-cm
        name: tls-certs
      - name: argocd-repo-server-tls
        secret:
          items:
          - key: tls.crt
            path: tls.crt
          - key: tls.key
            path: tls.key
          - key: ca.crt
            path: ca.crt
          optional: true
          secretName: argocd-repo-server-tls
```
# 3. argocd添加集群
> 通过命令行形式添加
## 3.1 登陆
```bash
argocd login 172.16.xx.xxx:xxx  --username admin --password xxx --insecure
```
## 3.2 获取目标k8s集群context信息
- 获取name: kubernetes-admin@kubernetes
```bash
# 在目标k8s集群执行 
root@master01:/xxx/kubesphere# kubectl config get-contexts
CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
*         kubernetes-admin@kubernetes   kubernetes   kubernetes-admin
```
- 将目标k8s集群config配置发送至argocd客户端所在机器
   - 修改config中的k8s集群域名为目标k8s集群主节点ip
```bash
scp /root/.kube/config 172.16.xxx.xxx1:/xxx/argocd_files/mem_config
```
## 3.3 执行argocd新增k8s集群操作
- add: 3.2步获取的name
- kubeconfig: 3.2步发送的修改后config
- name: 为目标集群定义的name
```bash
 argocd cluster add kubernetes-admin@kubernetes  --kubeconfig /xxx/argocd_files/mem_config  --name mem
```

# 4. argocd备份
参考链接：[Argo CD 实践教程 06-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/2316899)
- 备份
   - 端口号为argocd-server-nodeport/argocd-server的端口号
```bash
# 登陆
argocd login 172.16.xx.xxx:xxx

# 备份
argocd admin export -n argocd > backup-$(date +"%Y-%m-%d_%H_%M").yml
```
- 恢复
   - 要恢复备份，你需要在目标集群中安装Argo CD。这是因为，在备份中，我们有它的配置，以及所有的配置映射和秘密，所以我们为初始安装所更改的一切都应该存在。但是，备份不会存储实际的部署或状态集。这意味着需要在恢复备份之前安装它们。自定义资源的定义也是如此——我们将有所有的应用程序和应用程序项目的实例，但我们将不会有这些自定义资源的定义。 因此，在新的集群中，执行与之前使用Kustomize部分的HA安装中相同的安装。然后，运行以下命令（你需要更改文件名，使其与你的命令匹配）：  
```bash
# 登陆
argocd login 172.16.xx.xxx:xxx

# 恢复
argocd --loglevel debug admin -n argocd import - < backup-2024-08-09_11_02.yml
```
现在，你应该有一个新的安装，其中包含了你在创建备份时所拥有的所有状态（应用程序、集群和Git回购）。唯一的区别是，现在Redis缓存中没有任何，所以Argo CD需要开始重新计算Git回购的所有清单，这可能会影响系统最初几分钟的性能。在那之后，一切都应该照常进行。  

# 5. argocd部署问题解决
## 5.1 权限问题
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