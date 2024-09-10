---
title: "Longhorn部署及使用"
date: 2023-08-26
description: "云原生存储longhorn的使用"
tags: ["storage", "longhorn", "kubernetes"]
type: 'blog'
---

# 1. 前言
 Longhorn采用容器和微服务技术实现了分布式块存储。Longhorn为每个块设备卷创建一个专门的存储控制器，并且对多个节点上存储副本中的卷进行实时复制。
- Longhorn的卷可以作为Kubernetes集群中分布式有状态应用的存储。
- 可以将块存储划分为Longhorn卷，以便在有或没有云提供商的情况下使用Kubernetes卷。
- 可以跨节点和数据中心复制块存储，从而提高可用性。
- 可以在外部存储上存储备份数据，例如：NFS或AWS S3。
- 可以创建跨群集灾难恢复卷，以便从备用的Kubernetes集群的备份中快速恢复来自主Kubernetes群集的数据。
- 可以为卷设置计划，对卷定期生成快照，并把快照备份到NFS或者兼容S3的备用存储中。
- 支持从备份中恢复卷。
- 支持不中断卷服务的情况下进行升级。

## 1.1 前提
- 一个正常运行的Kubernetes集群
- 集群每个节点已经安装下列软件包，并正常启动
   - open-iscsi（iscsid服务）
      - 安装： yum install iscsi-initiator-utils
      
# 2. 安装
采用helm安装
## 2.1 添加helm源
```bash
helm repo add longhorn https://charts.longhorn.io
```
## 2,2 更新helm源
```bash
helm repo update
```
## 2.3下载helm包并修改配置

- 下载并解压
```bash
# 下载包
helm fetch longhorn/longhorn

# 解压包
tar xf longhorn-1.6.2.tgz
```

- 修改配置文件
   - values.yaml
```yaml
# Default values for longhorn.
# This is a YAML-formatted file.
# Declare variables to be passed into your templates.
global:
  cattle:
    # -- Default system registry.
    systemDefaultRegistry: ""
    windowsCluster:
      # -- Setting that allows Longhorn to run on a Rancher Windows cluster.
      enabled: false
      # -- Toleration for Linux nodes that can run user-deployed Longhorn components.
      tolerations:
      - key: "cattle.io/os"
        value: "linux"
        effect: "NoSchedule"
        operator: "Equal"
      # -- Node selector for Linux nodes that can run user-deployed Longhorn components.
      nodeSelector:
        kubernetes.io/os: "linux"
      defaultSetting:
        # -- Toleration for system-managed Longhorn components.
        taintToleration: cattle.io/os=linux:NoSchedule
        # -- Node selector for system-managed Longhorn components.
        systemManagedComponentsNodeSelector: kubernetes.io/os:linux

networkPolicies:
  # -- Setting that allows you to enable network policies that control access to Longhorn pods.
  enabled: false
  # -- Distribution that determines the policy for allowing access for an ingress. (Options: "k3s", "rke2", "rke1")
  type: "k3s"

image:
  longhorn:
    engine:
      # -- Repository for the Longhorn Engine image.
      repository: longhornio/longhorn-engine
      # -- Specify Longhorn engine image tag
      tag: v1.6.2
    manager:
      # -- Repository for the Longhorn Manager image.
      repository: longhornio/longhorn-manager
      # -- Specify Longhorn manager image tag
      tag: v1.6.2
    ui:
      # -- Repository for the Longhorn UI image.
      repository: longhornio/longhorn-ui
      # -- Specify Longhorn ui image tag
      tag: v1.6.2
    instanceManager:
      # -- Repository for the Longhorn Instance Manager image.
      repository: longhornio/longhorn-instance-manager
      # -- Specify Longhorn instance manager image tag
      tag: v1.6.2
    shareManager:
      # -- Repository for the Longhorn Share Manager image.
      repository: longhornio/longhorn-share-manager
      # -- Specify Longhorn share manager image tag
      tag: v1.6.2
    backingImageManager:
      # -- Repository for the Backing Image Manager image. When unspecified, Longhorn uses the default value.
      repository: longhornio/backing-image-manager
      # -- Specify Longhorn backing image manager image tag
      tag: v1.6.2
    supportBundleKit:
      # -- Repository for the Longhorn Support Bundle Manager image.
      repository: longhornio/support-bundle-kit
      # -- Tag for the Longhorn Support Bundle Manager image.
      tag: v0.0.37
  csi:
    attacher:
      # -- Repository for the CSI attacher image. When unspecified, Longhorn uses the default value.
      repository: longhornio/csi-attacher
      # -- Tag for the CSI attacher image. When unspecified, Longhorn uses the default value.
      tag: v4.5.1
    provisioner:
      # -- Repository for the CSI Provisioner image. When unspecified, Longhorn uses the default value.
      repository: longhornio/csi-provisioner
      # -- Tag for the CSI Provisioner image. When unspecified, Longhorn uses the default value.
      tag: v3.6.4
    nodeDriverRegistrar:
      # -- Repository for the CSI Node Driver Registrar image. When unspecified, Longhorn uses the default value.
      repository: longhornio/csi-node-driver-registrar
      # -- Tag for the CSI Node Driver Registrar image. When unspecified, Longhorn uses the default value.
      tag: v2.9.2
    resizer:
      # -- Repository for the CSI Resizer image. When unspecified, Longhorn uses the default value.
      repository: longhornio/csi-resizer
      # -- Tag for the CSI Resizer image. When unspecified, Longhorn uses the default value.
      tag: v1.10.1
    snapshotter:
      # -- Repository for the CSI Snapshotter image. When unspecified, Longhorn uses the default value.
      repository: longhornio/csi-snapshotter
      # -- Tag for the CSI Snapshotter image. When unspecified, Longhorn uses the default value.
      tag: v6.3.4
    livenessProbe:
      # -- Repository for the CSI liveness probe image. When unspecified, Longhorn uses the default value.
      repository: longhornio/livenessprobe
      # -- Tag for the CSI liveness probe image. When unspecified, Longhorn uses the default value.
      tag: v2.12.0
  openshift:
    oauthProxy:
      # -- Repository for the OAuth Proxy image. This setting applies only to OpenShift users.
      repository: longhornio/openshift-origin-oauth-proxy
      # -- Tag for the OAuth Proxy image. This setting applies only to OpenShift users. Specify OCP/OKD version 4.1 or later. The latest stable version is 4.14.
      tag: 4.14
  # -- Image pull policy that applies to all user-deployed Longhorn components, such as Longhorn Manager, Longhorn driver, and Longhorn UI.
  pullPolicy: IfNotPresent

# 修改ui界面的service类型为NodePort
service:
  ui:
    # -- Service type for Longhorn UI. (Options: "ClusterIP", "NodePort", "LoadBalancer", "Rancher-Proxy")
    type: NodePort
    # -- NodePort port number for Longhorn UI. When unspecified, Longhorn selects a free port between 30000 and 32767.
    nodePort: null
  manager:
    # -- Service type for Longhorn Manager.
    type: ClusterIP
    # -- NodePort port number for Longhorn Manager. When unspecified, Longhorn selects a free port between 30000 and 32767.
    nodePort: ""

# 看需求设置是否为默认storageclass（defaultClass），修改pvc策略为Retain
persistence:
  # -- Setting that allows you to specify the default Longhorn StorageClass.
  defaultClass: true
  # -- Filesystem type of the default Longhorn StorageClass.
  defaultFsType: ext4
  # -- mkfs parameters of the default Longhorn StorageClass.
  defaultMkfsParams: ""
  # -- Replica count of the default Longhorn StorageClass.
  defaultClassReplicaCount: 1
  # -- Data locality of the default Longhorn StorageClass. (Options: "disabled", "best-effort")
  defaultDataLocality: disabled
  # -- Reclaim policy that provides instructions for handling of a volume after its claim is released. (Options: "Retain", "Delete")
  reclaimPolicy: Retain
  # -- Setting that allows you to enable live migration of a Longhorn volume from one node to another.
  migratable: false
  # -- Set NFS mount options for Longhorn StorageClass for RWX volumes
  nfsOptions: ""
  recurringJobSelector:
    # -- Setting that allows you to enable the recurring job selector for a Longhorn StorageClass.
    enable: false
    # -- Recurring job selector for a Longhorn StorageClass. Ensure that quotes are used correctly when specifying job parameters. (Example: `[{"name":"backup", "isGroup":true}]`)
    jobList: []
  backingImage:
    # -- Setting that allows you to use a backing image in a Longhorn StorageClass.
    enable: false
    # -- Backing image to be used for creating and restoring volumes in a Longhorn StorageClass. When no backing images are available, specify the data source type and parameters that Longhorn can use to create a backing image.
    name: ~
    # -- Data source type of a backing image used in a Longhorn StorageClass.
    # If the backing image exists in the cluster, Longhorn uses this setting to verify the image.
    # If the backing image does not exist, Longhorn creates one using the specified data source type.
    dataSourceType: ~
    # -- Data source parameters of a backing image used in a Longhorn StorageClass.
    # You can specify a JSON string of a map. (Example: `'{\"url\":\"https://backing-image-example.s3-region.amazonaws.com/test-backing-image\"}'`)
    dataSourceParameters: ~
    # -- Expected SHA-512 checksum of a backing image used in a Longhorn StorageClass.
    expectedChecksum: ~
  defaultNodeSelector:
    # -- Setting that allows you to enable the node selector for the default Longhorn StorageClass.
    enable: false
    # -- Node selector for the default Longhorn StorageClass. Longhorn uses only nodes with the specified tags for storing volume data. (Examples: "storage,fast")
    selector: ""
  # -- Setting that allows you to enable automatic snapshot removal during filesystem trim for a Longhorn StorageClass. (Options: "ignored", "enabled", "disabled")
  removeSnapshotsDuringFilesystemTrim: ignored

preUpgradeChecker:
  # -- Setting that allows Longhorn to perform pre-upgrade checks. Disable this setting when installing Longhorn using Argo CD or other GitOps solutions.
  jobEnabled: true
  # -- Setting that allows Longhorn to perform upgrade version checks after starting the Longhorn Manager DaemonSet Pods. Disabling this setting also disables `preUpgradeChecker.jobEnabled`. Longhorn recommends keeping this setting enabled.
  upgradeVersionCheck: true

csi:
  # -- kubelet root directory. When unspecified, Longhorn uses the default value.
  kubeletRootDir: ~
  # -- Replica count of the CSI Attacher. When unspecified, Longhorn uses the default value ("3").
  attacherReplicaCount: ~
  # -- Replica count of the CSI Provisioner. When unspecified, Longhorn uses the default value ("3").
  provisionerReplicaCount: ~
  # -- Replica count of the CSI Resizer. When unspecified, Longhorn uses the default value ("3").
  resizerReplicaCount: ~
  # -- Replica count of the CSI Snapshotter. When unspecified, Longhorn uses the default value ("3").
  snapshotterReplicaCount: ~

defaultSettings:
  # -- Endpoint used to access the backupstore. (Options: "NFS", "CIFS", "AWS", "GCP", "AZURE")
  backupTarget: ~
  # -- Name of the Kubernetes secret associated with the backup target.
  backupTargetCredentialSecret: ~
  # -- Setting that allows Longhorn to automatically attach a volume and create snapshots or backups when recurring jobs are run.
  allowRecurringJobWhileVolumeDetached: ~
  # -- Setting that allows Longhorn to automatically create a default disk only on nodes with the label "node.longhorn.io/create-default-disk=true" (if no other disks exist). When this setting is disabled, Longhorn creates a default disk on each node that is added to the cluster.
  createDefaultDiskLabeledNodes: true
  # -- Default path for storing data on a host. The default value is "/var/lib/longhorn/".
  # 设置longhorn挂载的本地存储路径，/data/longhorn
  defaultDataPath: /data1/longhorn
  # -- Default data locality. A Longhorn volume has data locality if a local replica of the volume exists on the same node as the pod that is using the volume.
  defaultDataLocality: ~
  # -- Setting that allows scheduling on nodes with healthy replicas of the same volume. This setting is disabled by default.
  replicaSoftAntiAffinity: ~
  # -- Setting that automatically rebalances replicas when an available node is discovered.
  replicaAutoBalance: ~
  # -- Percentage of storage that can be allocated relative to hard drive capacity. The default value is "100".
  storageOverProvisioningPercentage: ~
  # -- Percentage of minimum available disk capacity. When the minimum available capacity exceeds the total available capacity, the disk becomes unschedulable until more space is made available for use. The default value is "25".
  storageMinimalAvailablePercentage: ~
  # -- Percentage of disk space that is not allocated to the default disk on each new Longhorn node.
  storageReservedPercentageForDefaultDisk: ~
  # -- Upgrade Checker that periodically checks for new Longhorn versions. When a new version is available, a notification appears on the Longhorn UI. This setting is enabled by default
  upgradeChecker: ~
  # -- Default number of replicas for volumes created using the Longhorn UI. For Kubernetes configuration, modify the `numberOfReplicas` field in the StorageClass. The default value is "3".
  defaultReplicaCount: ~
  # -- Default Longhorn StorageClass. "storageClassName" is assigned to PVs and PVCs that are created for an existing Longhorn volume. "storageClassName" can also be used as a label, so it is possible to use a Longhorn StorageClass to bind a workload to an existing PV without creating a Kubernetes StorageClass object. The default value is "longhorn-static".
  defaultLonghornStaticStorageClass: ~
  # -- Number of seconds that Longhorn waits before checking the backupstore for new backups. The default value is "300". When the value is "0", polling is disabled.
  backupstorePollInterval: ~
  # -- Number of minutes that Longhorn keeps a failed backup resource. When the value is "0", automatic deletion is disabled.
  failedBackupTTL: ~
  # -- Setting that restores recurring jobs from a backup volume on a backup target and creates recurring jobs if none exist during backup restoration.
  restoreVolumeRecurringJobs: ~
  # -- Maximum number of successful recurring backup and snapshot jobs to be retained. When the value is "0", a history of successful recurring jobs is not retained.
  recurringSuccessfulJobsHistoryLimit: ~
  # -- Maximum number of failed recurring backup and snapshot jobs to be retained. When the value is "0", a history of failed recurring jobs is not retained.
  recurringFailedJobsHistoryLimit: ~
  # -- Maximum number of snapshots or backups to be retained.
  recurringJobMaxRetention: ~
  # -- Maximum number of failed support bundles that can exist in the cluster. When the value is "0", Longhorn automatically purges all failed support bundles.
  supportBundleFailedHistoryLimit: ~
  # -- Taint or toleration for system-managed Longhorn components.
  # Specify values using a semicolon-separated list in `kubectl taint` syntax (Example: key1=value1:effect; key2=value2:effect).
  taintToleration: ~
  # -- Node selector for system-managed Longhorn components.
  systemManagedComponentsNodeSelector: ~
  # -- PriorityClass for system-managed Longhorn components.
  # This setting can help prevent Longhorn components from being evicted under Node Pressure.
  # Notice that this will be applied to Longhorn user-deployed components by default if there are no priority class values set yet, such as `longhornManager.priorityClass`.
  priorityClass: &defaultPriorityClassNameRef "longhorn-critical"
  # -- Setting that allows Longhorn to automatically salvage volumes when all replicas become faulty (for example, when the network connection is interrupted). Longhorn determines which replicas are usable and then uses these replicas for the volume. This setting is enabled by default.
  autoSalvage: ~
  # -- Setting that allows Longhorn to automatically delete a workload pod that is managed by a controller (for example, daemonset) whenever a Longhorn volume is detached unexpectedly (for example, during Kubernetes upgrades). After deletion, the controller restarts the pod and then Kubernetes handles volume reattachment and remounting.
  autoDeletePodWhenVolumeDetachedUnexpectedly: ~
  # -- Setting that prevents Longhorn Manager from scheduling replicas on a cordoned Kubernetes node. This setting is enabled by default.
  disableSchedulingOnCordonedNode: ~
  # -- Setting that allows Longhorn to schedule new replicas of a volume to nodes in the same zone as existing healthy replicas. Nodes that do not belong to any zone are treated as existing in the zone that contains healthy replicas. When identifying zones, Longhorn relies on the label "topology.kubernetes.io/zone=<Zone name of the node>" in the Kubernetes node object.
  replicaZoneSoftAntiAffinity: ~
  # -- Setting that allows scheduling on disks with existing healthy replicas of the same volume. This setting is enabled by default.
  replicaDiskSoftAntiAffinity: ~
  # -- Policy that defines the action Longhorn takes when a volume is stuck with a StatefulSet or Deployment pod on a node that failed.
  nodeDownPodDeletionPolicy: ~
  # -- Policy that defines the action Longhorn takes when a node with the last healthy replica of a volume is drained.
  nodeDrainPolicy: ~
  # -- Setting that allows automatic detaching of manually-attached volumes when a node is cordoned.
  detachManuallyAttachedVolumesWhenCordoned: ~
  # -- Number of seconds that Longhorn waits before reusing existing data on a failed replica instead of creating a new replica of a degraded volume.
  replicaReplenishmentWaitInterval: ~
  # -- Maximum number of replicas that can be concurrently rebuilt on each node.
  concurrentReplicaRebuildPerNodeLimit: ~
  # -- Maximum number of volumes that can be concurrently restored on each node using a backup. When the value is "0", restoration of volumes using a backup is disabled.
  concurrentVolumeBackupRestorePerNodeLimit: ~
  # -- Setting that disables the revision counter and thereby prevents Longhorn from tracking all write operations to a volume. When salvaging a volume, Longhorn uses properties of the "volume-head-xxx.img" file (the last file size and the last time the file was modified) to select the replica to be used for volume recovery. This setting applies only to volumes created using the Longhorn UI.
  disableRevisionCounter: ~
  # -- Image pull policy for system-managed pods, such as Instance Manager, engine images, and CSI Driver. Changes to the image pull policy are applied only after the system-managed pods restart.
  systemManagedPodsImagePullPolicy: ~
  # -- Setting that allows you to create and attach a volume without having all replicas scheduled at the time of creation.
  allowVolumeCreationWithDegradedAvailability: ~
  # -- Setting that allows Longhorn to automatically clean up the system-generated snapshot after replica rebuilding is completed.
  autoCleanupSystemGeneratedSnapshot: ~
  # -- Setting that allows Longhorn to automatically clean up the snapshot generated by a recurring backup job.
  autoCleanupRecurringJobBackupSnapshot: ~
  # -- Maximum number of engines that are allowed to concurrently upgrade on each node after Longhorn Manager is upgraded. When the value is "0", Longhorn does not automatically upgrade volume engines to the new default engine image version.
  concurrentAutomaticEngineUpgradePerNodeLimit: ~
  # -- Number of minutes that Longhorn waits before cleaning up the backing image file when no replicas in the disk are using it.
  backingImageCleanupWaitInterval: ~
  # -- Number of seconds that Longhorn waits before downloading a backing image file again when the status of all image disk files changes to "failed" or "unknown".
  backingImageRecoveryWaitInterval: ~
  # -- Percentage of the total allocatable CPU resources on each node to be reserved for each instance manager pod when the V1 Data Engine is enabled. The default value is "12".
  guaranteedInstanceManagerCPU: ~
  # -- Setting that notifies Longhorn that the cluster is using the Kubernetes Cluster Autoscaler.
  kubernetesClusterAutoscalerEnabled: ~
  # -- Setting that allows Longhorn to automatically delete an orphaned resource and the corresponding data (for example, stale replicas). Orphaned resources on failed or unknown nodes are not automatically cleaned up.
  orphanAutoDeletion: ~
  # -- Storage network for in-cluster traffic. When unspecified, Longhorn uses the Kubernetes cluster network.
  storageNetwork: ~
  # -- Flag that prevents accidental uninstallation of Longhorn.
  deletingConfirmationFlag: ~
  # -- Timeout between the Longhorn Engine and replicas. Specify a value between "8" and "30" seconds. The default value is "8".
  engineReplicaTimeout: ~
  # -- Setting that allows you to enable and disable snapshot hashing and data integrity checks.
  snapshotDataIntegrity: ~
  # -- Setting that allows disabling of snapshot hashing after snapshot creation to minimize impact on system performance.
  snapshotDataIntegrityImmediateCheckAfterSnapshotCreation: ~
  # -- Setting that defines when Longhorn checks the integrity of data in snapshot disk files. You must use the Unix cron expression format.
  snapshotDataIntegrityCronjob: ~
  # -- Setting that allows Longhorn to automatically mark the latest snapshot and its parent files as removed during a filesystem trim. Longhorn does not remove snapshots containing multiple child files.
  removeSnapshotsDuringFilesystemTrim: ~
  # -- Setting that allows fast rebuilding of replicas using the checksum of snapshot disk files. Before enabling this setting, you must set the snapshot-data-integrity value to "enable" or "fast-check".
  fastReplicaRebuildEnabled: ~
  # -- Number of seconds that an HTTP client waits for a response from a File Sync server before considering the connection to have failed.
  replicaFileSyncHttpClientTimeout: ~
  # -- Log levels that indicate the type and severity of logs in Longhorn Manager. The default value is "Info". (Options: "Panic", "Fatal", "Error", "Warn", "Info", "Debug", "Trace")
  logLevel: ~
  # -- Setting that allows you to specify a backup compression method.
  backupCompressionMethod: ~
  # -- Maximum number of worker threads that can concurrently run for each backup.
  backupConcurrentLimit: ~
  # -- Maximum number of worker threads that can concurrently run for each restore operation.
  restoreConcurrentLimit: ~
  # -- Setting that allows you to enable the V1 Data Engine.
  v1DataEngine: ~
  # -- Setting that allows you to enable the V2 Data Engine, which is based on the Storage Performance Development Kit (SPDK). The V2 Data Engine is a preview feature and should not be used in production environments.
  v2DataEngine: ~
  # -- Setting that allows you to configure maximum huge page size (in MiB) for the V2 Data Engine.
  v2DataEngineHugepageLimit: ~
  # -- Setting that allows rebuilding of offline replicas for volumes using the V2 Data Engine.
  offlineReplicaRebuilding: ~
  # -- Number of millicpus on each node to be reserved for each Instance Manager pod when the V2 Data Engine is enabled. The default value is "1250".
  v2DataEngineGuaranteedInstanceManagerCPU: ~
  # -- Setting that allows scheduling of empty node selector volumes to any node.
  allowEmptyNodeSelectorVolume: ~
  # -- Setting that allows scheduling of empty disk selector volumes to any disk.
  allowEmptyDiskSelectorVolume: ~
  # -- Setting that allows Longhorn to periodically collect anonymous usage data for product improvement purposes. Longhorn sends collected data to the [Upgrade Responder](https://github.com/longhorn/upgrade-responder) server, which is the data source of the Longhorn Public Metrics Dashboard (https://metrics.longhorn.io). The Upgrade Responder server does not store data that can be used to identify clients, including IP addresses.
  allowCollectingLonghornUsageMetrics: ~
  # -- Setting that temporarily prevents all attempts to purge volume snapshots.
  disableSnapshotPurge: ~
  # -- Maximum snapshot count for a volume. The value should be between 2 to 250
  snapshotMaxCount: ~

privateRegistry:
  # -- Setting that allows you to create a private registry secret.
  createSecret: ~
  # -- URL of a private registry. When unspecified, Longhorn uses the default system registry.
  registryUrl: ~
  # -- User account used for authenticating with a private registry.
  registryUser: ~
  # -- Password for authenticating with a private registry.
  registryPasswd: ~
  # -- Kubernetes secret that allows you to pull images from a private registry. This setting applies only when creation of private registry secrets is enabled. You must include the private registry name in the secret name.
  registrySecret: ~

longhornManager:
  log:
    # -- Format of Longhorn Manager logs. (Options: "plain", "json")
    format: plain
  # -- PriorityClass for Longhorn Manager.
  priorityClass: *defaultPriorityClassNameRef
  # -- Toleration for Longhorn Manager on nodes allowed to run Longhorn Manager.
  tolerations: []
  ## If you want to set tolerations for Longhorn Manager DaemonSet, delete the `[]` in the line above
  ## and uncomment this example block
  # - key: "key"
  #   operator: "Equal"
  #   value: "value"
  #   effect: "NoSchedule"
  # -- Node selector for Longhorn Manager. Specify the nodes allowed to run Longhorn Manager.
  nodeSelector: {}
  ## If you want to set node selector for Longhorn Manager DaemonSet, delete the `{}` in the line above
  ## and uncomment this example block
  #  label-key1: "label-value1"
  #  label-key2: "label-value2"
  # -- Annotation for the Longhorn Manager service.
  serviceAnnotations: {}
  ## If you want to set annotations for the Longhorn Manager service, delete the `{}` in the line above
  ## and uncomment this example block
  #  annotation-key1: "annotation-value1"
  #  annotation-key2: "annotation-value2"

longhornDriver:
  # -- PriorityClass for Longhorn Driver.
  priorityClass: *defaultPriorityClassNameRef
  # -- Toleration for Longhorn Driver on nodes allowed to run Longhorn components.
  tolerations: []
  ## If you want to set tolerations for Longhorn Driver Deployer Deployment, delete the `[]` in the line above
  ## and uncomment this example block
  # - key: "key"
  #   operator: "Equal"
  #   value: "value"
  #   effect: "NoSchedule"
  # -- Node selector for Longhorn Driver. Specify the nodes allowed to run Longhorn Driver.
  nodeSelector: {}
  ## If you want to set node selector for Longhorn Driver Deployer Deployment, delete the `{}` in the line above
  ## and uncomment this example block
  #  label-key1: "label-value1"
  #  label-key2: "label-value2"

longhornUI:
  # -- Replica count for Longhorn UI.
  replicas: 1
  # -- PriorityClass for Longhorn UI.
  priorityClass: *defaultPriorityClassNameRef
  # -- Toleration for Longhorn UI on nodes allowed to run Longhorn components.
  tolerations: []
  ## If you want to set tolerations for Longhorn UI Deployment, delete the `[]` in the line above
  ## and uncomment this example block
  # - key: "key"
  #   operator: "Equal"
  #   value: "value"
  #   effect: "NoSchedule"
  # -- Node selector for Longhorn UI. Specify the nodes allowed to run Longhorn UI.
  nodeSelector: {}
  ## If you want to set node selector for Longhorn UI Deployment, delete the `{}` in the line above
  ## and uncomment this example block
  #  label-key1: "label-value1"
  #  label-key2: "label-value2"

ingress:
  # -- Setting that allows Longhorn to generate ingress records for the Longhorn UI service.
  enabled: false

  # -- IngressClass resource that contains ingress configuration, including the name of the Ingress controller.
  # ingressClassName can replace the kubernetes.io/ingress.class annotation used in earlier Kubernetes releases.
  ingressClassName: ~

  # -- Hostname of the Layer 7 load balancer.
  host: sslip.io

  # -- Setting that allows you to enable TLS on ingress records.
  tls: false

  # -- Setting that allows you to enable secure connections to the Longhorn UI service via port 443.
  secureBackends: false

  # -- TLS secret that contains the private key and certificate to be used for TLS. This setting applies only when TLS is enabled on ingress records.
  tlsSecret: longhorn.local-tls

  # -- Default ingress path. You can access the Longhorn UI by following the full ingress path {{host}}+{{path}}.
  path: /

  ## If you're using kube-lego, you will want to add:
  ## kubernetes.io/tls-acme: true
  ##
  ## For a full list of possible ingress annotations, please see
  ## ref: https://github.com/kubernetes/ingress-nginx/blob/master/docs/annotations.md
  ##
  ## If tls is set to true, annotation ingress.kubernetes.io/secure-backends: "true" will automatically be set
  # -- Ingress annotations in the form of key-value pairs.
  annotations:
  #  kubernetes.io/ingress.class: nginx
  #  kubernetes.io/tls-acme: true

  # -- Secret that contains a TLS private key and certificate. Use secrets if you want to use your own certificates to secure ingresses.
  secrets:
  ## If you're providing your own certificates, please use this to add the certificates as secrets
  ## key and certificate should start with -----BEGIN CERTIFICATE----- or
  ## -----BEGIN RSA PRIVATE KEY-----
  ##
  ## name should line up with a tlsSecret set further up
  ## If you're using kube-lego, this is unneeded, as it will create the secret for you if it is not set
  ##
  ## It is also possible to create and manage the certificates outside of this helm chart
  ## Please see README.md for more information
  # - name: longhorn.local-tls
  #   key:
  #   certificate:

# -- Setting that allows you to enable pod security policies (PSPs) that allow privileged Longhorn pods to start. This setting applies only to clusters running Kubernetes 1.25 and earlier, and with the built-in Pod Security admission controller enabled.
enablePSP: false

# -- Specify override namespace, specifically this is useful for using longhorn as sub-chart and its release namespace is not the `longhorn-system`.
namespaceOverride: ""

# -- Annotation for the Longhorn Manager DaemonSet pods. This setting is optional.
annotations: {}

serviceAccount:
  # -- Annotations to add to the service account
  annotations: {}

metrics:
  serviceMonitor:
    # -- Setting that allows the creation of a Prometheus ServiceMonitor resource for Longhorn Manager components.
    enabled: false

## openshift settings
openshift:
  # -- Setting that allows Longhorn to integrate with OpenShift.
  enabled: false
  ui:
    # -- Route for connections between Longhorn and the OpenShift web console.
    route: "longhorn-ui"
    # -- Port for accessing the OpenShift web console.
    port: 443
    # -- Port for proxy that provides access to the OpenShift web console.
    proxy: 8443

# -- Setting that allows Longhorn to generate code coverage profiles.
enableGoCoverDir: false
```
## 2.4 部署

### 2.4.1 longhorn安装准备工作
- 各存储节点创建目录及挂载
```bash
# 将存储盘挂载到/data1所在目录，并创建longhorn目录
mkdir /home/data1/longhorn
```
- 存储节点使用命令打标签：
```bash
kubectl label nodes node75  node77  node78 node.longhorn.io/create-default-disk=true
```
- 安装longhorn所需系统依赖
```bash
yum install -y nfs-utils
yum --setopt=tsflags=noscripts install iscsi-initiator-utils
echo "InitiatorName=$(/sbin/iscsi-iname)" > /etc/iscsi/initiatorname.iscsi
systemctl enable iscsid
systemctl start iscsid

wget https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -O /usr/local/bin/jq
chmod +x /usr/local/bin/jq
```

- longhorn环境检查脚本
  - 检查环境是否准备好了longhorn所需依赖
```bash
#!/bin/bash

NVME_CLI_VERSION="1.12"

######################################################
# Log
######################################################
export RED='\x1b[0;31m'
export GREEN='\x1b[38;5;22m'
export CYAN='\x1b[36m'
export YELLOW='\x1b[33m'
export NO_COLOR='\x1b[0m'

if [ -z "${LOG_TITLE}" ]; then
  LOG_TITLE=''
fi
if [ -z "${LOG_LEVEL}" ]; then
  LOG_LEVEL="INFO"
fi

debug() {
  if [[ "${LOG_LEVEL}" == "DEBUG" ]]; then
    local log_title
    if [ -n "${LOG_TITLE}" ]; then
     log_title="(${LOG_TITLE})"
    else
     log_title=''
    fi
    echo -e "${GREEN}[DEBUG]${log_title} ${NO_COLOR}$1"
  fi
}

info() {
  if [[ "${LOG_LEVEL}" == "DEBUG" ]] ||\
     [[ "${LOG_LEVEL}" == "INFO" ]]; then
    local log_title
    if [ -n "${LOG_TITLE}" ]; then
     log_title="(${LOG_TITLE})"
    else
     log_title=''
    fi
    echo -e "${CYAN}[INFO] ${log_title} ${NO_COLOR}$1"
  fi
}

warn() {
  if [[ "${LOG_LEVEL}" == "DEBUG" ]] ||\
     [[ "${LOG_LEVEL}" == "INFO" ]] ||\
     [[ "${LOG_LEVEL}" == "WARN" ]]; then
    local log_title
    if [ -n "${LOG_TITLE}" ]; then
     log_title="(${LOG_TITLE})"
    else
     log_title=''
    fi
    echo -e "${YELLOW}[WARN] ${log_title} ${NO_COLOR}$1"
  fi
}

error() {
  if [[ "${LOG_LEVEL}" == "DEBUG" ]] ||\
     [[ "${LOG_LEVEL}" == "INFO" ]] ||\
     [[ "${LOG_LEVEL}" == "WARN" ]] ||\
     [[ "${LOG_LEVEL}" == "ERROR" ]]; then
    local log_title
    if [ -n "${LOG_TITLE}" ]; then
     log_title="(${LOG_TITLE})"
    else
     log_title=''
    fi
    echo -e "${RED}[ERROR]${log_title} ${NO_COLOR}$1"
  fi
}

######################################################
# Check logics
######################################################
set_packages_and_check_cmd() {
  case $OS in
  *"debian"* | *"ubuntu"* )
    CHECK_CMD='dpkg -l | grep -w'
    PACKAGES=(nfs-common open-iscsi cryptsetup dmsetup)
    ;;
  *"centos"* | *"fedora"* | *"rocky"* | *"ol"* )
    CHECK_CMD='rpm -q'
    PACKAGES=(nfs-utils iscsi-initiator-utils cryptsetup device-mapper)
    ;;
  *"suse"* )
    CHECK_CMD='rpm -q'
    PACKAGES=(nfs-client open-iscsi cryptsetup device-mapper)
    ;;
  *"arch"* )
    CHECK_CMD='pacman -Q'
    PACKAGES=(nfs-utils open-iscsi cryptsetup device-mapper)
    ;;
  *"gentoo"* )
    CHECK_CMD='qlist -I'
    PACKAGES=(net-fs/nfs-utils sys-block/open-iscsi sys-fs/cryptsetup sys-fs/lvm2)
    ;;
  *)
    CHECK_CMD=''
    PACKAGES=()
    warn "Stop the environment check because '$OS' is not supported in the environment check script."
    exit 1
    ;;
   esac
}

detect_node_kernel_release() {
  local pod="$1"

  KERNEL_RELEASE=$(kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- bash -c 'uname -r')
  echo "$KERNEL_RELEASE"
}

detect_node_os() {
  local pod="$1"

  OS=$(kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- bash -c 'grep -E "^ID_LIKE=" /etc/os-release | cut -d= -f2')
  if [[ -z "${OS}" ]]; then
    OS=$(kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- bash -c 'grep -E "^ID=" /etc/os-release | cut -d= -f2')
  fi
  echo "$OS"
}

check_local_dependencies() {
  local targets=($@)

  local all_found=true
  for ((i=0; i<${#targets[@]}; i++)); do
    local target=${targets[$i]}
    if [ "$(which $target)" = "" ]; then
      all_found=false
      error "Not found: $target"
    fi
  done

  if [ "$all_found" = "false" ]; then
    msg="Please install missing dependencies: ${targets[@]}."
    info "$msg"
    exit 2
  fi

  msg="Required dependencies '${targets[@]}' are installed."
  info "$msg"
}

create_ds() {
cat <<EOF > $TEMP_DIR/environment_check.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  labels:
    app: longhorn-environment-check
  name: longhorn-environment-check
spec:
  selector:
    matchLabels:
      app: longhorn-environment-check
  template:
    metadata:
      labels:
        app: longhorn-environment-check
    spec:
      hostPID: true
      containers:
      - name: longhorn-environment-check
        image: alpine:3.12
        args: ["/bin/sh", "-c", "sleep 1000000000"]
        volumeMounts:
        - name: mountpoint
          mountPath: /tmp/longhorn-environment-check
          mountPropagation: Bidirectional
        securityContext:
          privileged: true
      volumes:
      - name: mountpoint
        hostPath:
            path: /tmp/longhorn-environment-check
EOF
  kubectl create -f $TEMP_DIR/environment_check.yaml > /dev/null
}

cleanup() {
  info "Cleaning up longhorn-environment-check pods..."
  kubectl delete -f $TEMP_DIR/environment_check.yaml > /dev/null
  rm -rf $TEMP_DIR
  info "Cleanup completed."
}

wait_ds_ready() {
  while true; do
    local ds=$(kubectl get ds/longhorn-environment-check -o json)
    local numberReady=$(echo $ds | jq .status.numberReady)
    local desiredNumberScheduled=$(echo $ds | jq .status.desiredNumberScheduled)

    if [ "$desiredNumberScheduled" = "$numberReady" ] && [ "$desiredNumberScheduled" != "0" ]; then
      info "All longhorn-environment-check pods are ready ($numberReady/$desiredNumberScheduled)."
      return
    fi

    info "Waiting for longhorn-environment-check pods to become ready ($numberReady/$desiredNumberScheduled)..."
    sleep 3
  done
}

check_mount_propagation() {
  local allSupported=true
  local pods=$(kubectl -l app=longhorn-environment-check get po -o json)

  local ds=$(kubectl get ds/longhorn-environment-check -o json)
  local desiredNumberScheduled=$(echo $ds | jq .status.desiredNumberScheduled)

  for ((i=0; i<desiredNumberScheduled; i++)); do
    local pod=$(echo $pods | jq .items[$i])
    local nodeName=$(echo $pod | jq -r .spec.nodeName)
    local mountPropagation=$(echo $pod | jq -r '.spec.containers[0].volumeMounts[] | select(.name=="mountpoint") | .mountPropagation')

    if [ "$mountPropagation" != "Bidirectional" ]; then
      allSupported=false
      error "node $nodeName: MountPropagation is disabled"
    fi
  done

  if [ "$allSupported" != "true" ]; then
    error "MountPropagation is disabled on at least one node. As a result, CSI driver and Base image cannot be supported"
    exit 1
  else
    info "MountPropagation is enabled"
  fi
}

check_hostname_uniqueness() {
  hostnames=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="Hostname")].address}')

  if [ $? -ne 0 ]; then
    error "kubectl get nodes failed - check KUBECONFIG setup"
    exit 1
  fi

  if [[ ! ${hostnames[@]} ]]; then
    error "kubectl get nodes returned empty list - check KUBECONFIG setup"
    exit 1
  fi

  deduplicate_hostnames=()
  num_nodes=0
  for hostname in ${hostnames}; do
    num_nodes=$((num_nodes+1))
    if ! echo "${deduplicate_hostnames[@]}" | grep -q "\<${hostname}\>"; then
      deduplicate_hostnames+=("${hostname}")
    fi
  done

  if [ "${#deduplicate_hostnames[@]}" != "${num_nodes}" ]; then
    error "Nodes do not have unique hostnames."
    exit 2
  fi

  info "All nodes have unique hostnames."
}

check_nodes() {
  local name=$1
  local callback=$2
  shift
  shift

  info "Checking $name..."

  local all_passed=true

  local pods=$(kubectl get pods -o name -l app=longhorn-environment-check)
  for pod in ${pods}; do
    eval "${callback} ${pod} $@"
    if [ $? -ne 0 ]; then
      all_passed=false
    fi
  done

  if [ "$all_passed" = "false" ]; then
    return 1
  fi
}

verlte() {
    printf '%s\n' "$1" "$2" | sort -C -V
}

verlt() {
    ! verlte "$2" "$1"
}

kernel_in_range() {
    verlte "$2" "$1" && verlt "$1" "$3"
}

check_kernel_release() {
  local pod=$1
  local node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)

  recommended_kernel_release="5.8"

  local kernel=$(detect_node_kernel_release ${pod})

  if verlt "$kernel" "$recommended_kernel_release"  ; then
    warn "Node $node has outdated kernel release: $kernel. Recommending kernel release >= $recommended_kernel_release"
    return 1
  fi

  local broken_kernel=("5.15.0-94" "6.5.6")
  local fixed_kernel=("5.15.0-100" "6.5.7")

  for i in ${!broken_kernel[@]}; do
      if kernel_in_range "$kernel" "${broken_kernel[$i]}" "${fixed_kernel[$i]}" ; then
        warn "Node $node has a kernel version $kernel known to have a breakage that affects Longhorn. See description and solution at https://longhorn.io/kb/troubleshooting-rwx-volume-fails-to-attached-caused-by-protocol-not-supported"
        return 1
      fi
  done

}

check_iscsid() {
  local pod=$1

  kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c "systemctl status --no-pager iscsid.service" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c "systemctl status --no-pager iscsid.socket" > /dev/null 2>&1
      if [ $? -ne 0 ]; then
      node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)
      error "Neither iscsid.service nor iscsid.socket is running on ${node}"
      return 1
    fi
  fi
}

check_multipathd() {
  local pod=$1

  kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- bash -c "systemctl status --no-pager multipathd.service" > /dev/null 2>&1
  if [ $? = 0 ]; then
    node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)
    warn "multipathd is running on ${node} known to have a breakage that affects Longhorn.  See description and solution at https://longhorn.io/kb/troubleshooting-volume-with-multipath"
    return 1
  fi
}

check_packages() {
  local pod=$1

  OS=$(detect_node_os ${pod})
  if [ x"$OS" = x"" ]; then
    error "Failed to detect OS on node ${node}"
    return 1
  fi

  set_packages_and_check_cmd

  for ((i=0; i<${#PACKAGES[@]}; i++)); do
    check_package ${PACKAGES[$i]}
    if [ $? -ne 0 ]; then
      return 1
    fi
  done
}

check_package() {
  local package=$1

  kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- timeout 30 bash -c "$CHECK_CMD $package" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)
    error "$package is not found in $node."
    return 1
  fi
}

check_nfs_client() {
  local pod=$1
  local node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)

  local options=("CONFIG_NFS_V4_2"  "CONFIG_NFS_V4_1" "CONFIG_NFS_V4")

  local kernel=$(detect_node_kernel_release ${pod})
  if [ "x${kernel}" = "x" ]; then
    warn "Failed to check NFS client installation, because unable to detect kernel release on node ${node}"
    return 1
  fi

  for option in "${options[@]}"; do
    kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c "[ -f /boot/config-${kernel} ]" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      warn "Failed to check $option on node ${node}, because /boot/config-${kernel} does not exist on node ${node}"
      continue
    fi

    check_kernel_module ${pod} ${option} nfs
    if [ $? = 0 ]; then
      return 0
    fi
  done

  error "NFS clients ${options[*]} not found. At least one should be enabled"
  return 1
}

check_kernel_module() {
  local pod=$1
  local option=$2
  local module=$3

  local kernel=$(detect_node_kernel_release ${pod})
  if [ "x${kernel}" = "x" ]; then
    warn "Failed to check kernel config option ${option}, because unable to detect kernel release on node ${node}"
    return 1
  fi

  kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c "[ -e /boot/config-${kernel} ]" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    warn "Failed to check kernel config option ${option}, because /boot/config-${kernel} does not exist on node ${node}"
    return 1
  fi

  value=$(kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c "grep "^$option=" /boot/config-${kernel} | cut -d= -f2")
  if [ -z "${value}" ]; then
    error "Failed to find kernel config $option on node ${node}"
    return 1
  elif [ "${value}" = "m" ]; then
    kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c "lsmod | grep ${module}" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)
      error "kernel module ${module} is not enabled on ${node}"
      return 1
    fi
  elif [ "${value}" = "y" ]; then
    return 0
  else
    warn "Unknown value for $option: $value"
    return 1
  fi
}

check_hugepage() {
  local pod=$1
  local expected_nr_hugepages=$2

  nr_hugepages=$(kubectl exec ${pod} -- nsenter --mount=/proc/1/ns/mnt -- bash -c 'cat /proc/sys/vm/nr_hugepages')
  if [ $? -ne 0 ]; then
    error "Failed to check hugepage size on node ${node}"
    return 1
  fi

  if [ $nr_hugepages -lt $expected_nr_hugepages ]; then
    error "Hugepage size is not enough on node ${node}. Expected: ${expected_nr_hugepages}, Actual: ${nr_hugepages}"
    return 1
  fi
}

function check_sse42_support() {
  local pod=$1

  node=$(kubectl get ${pod} --no-headers -o=custom-columns=:.spec.nodeName)

  machine=$(kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- bash -c 'uname -m' 2>/dev/null)
  if [ $? -ne 0 ]; then
    error "Failed to check machine on node ${node}"
    return 1
  fi

  if [ "$machine" = "x86_64" ]; then
    sse42_support=$(kubectl exec $pod -- nsenter --mount=/proc/1/ns/mnt -- bash -c 'grep -o sse4_2 /proc/cpuinfo | wc -l' 2>/dev/null)
    if [ $? -ne 0 ]; then
      error "Failed to check SSE4.2 instruction set on node ${node}"
      return 1
    fi

    if [ "$sse42_support" -ge 1 ]; then
      return 0
    fi

    error "CPU does not support SSE4.2"
    return 1
  else
    warn "Skip SSE4.2 instruction set check on node ${node} because it is not x86_64"
  fi
}

function show_help() {
    cat <<EOF
Usage: $0 [OPTIONS]

Options:
    -s, --enable-spdk           Enable checking SPDK prerequisites
    -p, --expected-nr-hugepages Expected number of 2 MiB hugepages for SPDK. Default: 1024
    -h, --help                  Show this help message and exit
EOF
    exit 0
}

enable_spdk=false
expected_nr_hugepages=1024
while [[ $# -gt 0 ]]; do
    opt="$1"
    case $opt in
        -s|--enable-spdk)
            enable_spdk=true
            ;;
        -p|--expected-nr-hugepages)
            expected_nr_hugepages="$2"
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            instance_manager_options+=("$1")
            ;;
    esac
    shift
done

######################################################
# Main logics
######################################################
DEPENDENCIES=("kubectl" "jq" "mktemp" "sort" "printf")
check_local_dependencies "${DEPENDENCIES[@]}"

# Check the each host has a unique hostname (for RWX volume)
check_hostname_uniqueness

# Create a daemonset for checking the requirements in each node
TEMP_DIR=$(mktemp -d)

trap cleanup EXIT
create_ds
wait_ds_ready

check_mount_propagation
check_nodes "kernel release" check_kernel_release
check_nodes "iscsid" check_iscsid
check_nodes "multipathd" check_multipathd
check_nodes "packages" check_packages
check_nodes "nfs client" check_nfs_client

if [ "$enable_spdk" = "true" ]; then
  check_nodes "x86-64 SSE4.2 instruction set" check_sse42_support
  check_nodes "kernel module nvme_tcp" check_kernel_module CONFIG_NVME_TCP nvme_tcp
  check_nodes "kernel module uio_pci_generic" check_kernel_module CONFIG_UIO_PCI_GENERIC uio_pci_generic
  check_nodes "hugepage" check_hugepage ${expected_nr_hugepages}
fi

exit 0
```
### 2.4.2 安装
在线环境安装命令
- 进入到longhorn的helm目录下
```bash
helm install longhorn longhorn/longhorn --namespace longhorn-system --create-namespace -f ./values.yaml
```
- 离线环境安装命令（备选）
   - 进入到longhorn的helm目录下
```bash
helm install longhorn  --namespace longhorn-system --create-namespace -f ./
```
### 2.4.3 查看
```bash
kubectl get all -n longhorn-system
```
![1.png](./1.png)
![2.png](./2.png)

# 3. 测试说明
基于[https://github.com/yasker/kbench](https://github.com/yasker/kbench)项目进行性能测试
对于官方基准测试：
- SIZE环境变量：大小应至少为**读/写带宽的 25 倍**，以避免缓存影响结果。
- 如果要测试像 Longhorn 这样的分布式存储解决方案，请**始终首先针对本地存储进行测试**，以了解基线是什么。
  - 如果您使用 Kubernetes 进行测试，则可以为本地存储安装存储提供程序，例如[本地路径配置器](https://github.com/rancher/local-path-provisioner)，用于此测试。
- CPU_IDLE_PROF环境变量：CPU 空闲度分析测量 CPU 空闲，但它会带来额外的开销并降低存储性能。默认情况下，该标志处于禁用状态。

## 3.1 参数解析
- **IOPS**：每秒 IO 操作数。_越高越好。_
   - 它是衡量设备在一秒钟内可以处理多少 IO 操作的度量，主要涉及较小的 IO 块，例如 4k。
- **带宽**：也称为**吞吐量**。_越高越好。_
   - 它是设备在一秒钟内可以读取/写入多少数据的度量。它主要是处理较大的IO块，例如128k。
- **延迟**：每个请求在 IO 路径中花费的总时间。越_低越好。_
   - 它是存储系统处理每个请求的效率的度量。
   - 存储系统的数据路径开销可以表示为它在本机存储系统 （SSD/NVMe） 之上增加的延迟。
- CPU 空闲：运行测试的节点上的 **CPU 空闲**程度。_越高越好。_
   - 它是存储设备生成的 CPU 负载/开销的度量。
   - 请注意，这是空闲，因此如果该值更高，则意味着该节点上的 CPU 具有更多的空闲周期。
   - 不幸的是，此测量值目前无法反映分布式存储系统整个群集上的负载。但是，在基准测试时，它仍然是存储客户端的CPU负载的值得参考（取决于分布式存储的架构方式）。
- 对于_比较基准_，该列指示将第二个卷与第一个卷进行比较时的百分比差异。
   - 对于 **IOPS、带宽、CPU 空闲，**正百分比更好。
   - 对于**延迟**，负百分比更好。
   - 对于 **CPU 空闲，**我们显示的不是变化的百分比，而是差异。
### 3.1.1 了解分布式存储系统的结果
对于分布式存储系统，始终需要先测试本地存储作为基准。
在以下_情况下出现问题：
1. 读取_延迟低于本地存储_。
   - 您可能会获得比本地存储更高的读取 IOPS/带宽，因为存储引擎可以聚合来自不同节点/磁盘的性能。但是，与本地存储相比，您应该无法获得更低的读取延迟。
   - 如果发生这种情况，很可能是由于存在缓存。增加以避免这种情况。SIZE
2. _写入 IOPS/带宽/延迟比本地存储更好_。
   - 与分布式存储解决方案的本地存储相比，几乎不可能获得更好的写入性能，除非在本地存储前面有一个持久性缓存设备。
   - 如果得到此结果，则存储解决方案可能不是崩溃一致的，因此它不会在响应之前将数据提交到磁盘中，这意味着在发生事件时，您可能会丢失数据。
3. 您将获得延迟_基准的低 CPU 空闲率_，例如 <40%。
   - 对于**延迟**，CPU **空闲应**至少为 40%，以确保测试不会受到 CPU 不足的影响。
   - 如果发生这种情况，请向节点添加更多 CPU，或移动到增强计算机。

### 3.1.2 部署 FIO 基准

#### 3.1.2.1 在 Kubernetes 集群中部署单卷基准测试
默认情况下：
1. 基准测试将使用**默认存储类**。
   - 您可以在本地使用 YAML 指定存储类。
2. 将使用**文件系统模式**。
   - 您可以在本地使用 YAML 切换到阻止模式。
3. 该测试暂时需要 **33G** PVC。
   - 可以在本地使用 YAML 更改测试大小。
   - 如上所述，对于正式基准测试，大小应**至少为读/写带宽的 25 倍**，以避免缓存影响结果。

## 3.2 测试步骤
### 3.2.1 Longhorn基准测试
```bash
kubectl apply -f https://raw.githubusercontent.com/yasker/kbench/main/deploy/fio.yaml
```
```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: kbench-pvc
spec:
  volumeMode: Filesystem
  #volumeMode: Block
  #storageClassName: longhorn  # replace with your storage class
  #storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 33Gi
---
apiVersion: batch/v1
kind: Job
metadata:
  name: kbench
spec:
  template:
    metadata:
      labels:
        kbench: fio
    spec:
      containers:
      - name: kbench
        image: yasker/kbench:latest
        imagePullPolicy: Always
        env:
        #- name: QUICK_MODE  # for debugging
        #  value: "1"
        - name: FILE_NAME
          value: "/volume/test"
        - name: SIZE
          value: "30G" # must be 10% smaller than the PVC size due to filesystem also took space
        - name: CPU_IDLE_PROF
          value: "disabled" # must be "enabled" or "disabled"
        volumeMounts:
        - name: vol
          mountPath: /volume/
        #volumeDevices:
        #- name: vol
        #  devicePath: /volume/test
      restartPolicy: Never
      volumes:
      - name: vol
        persistentVolumeClaim:
          claimName: kbench-pvc
  backoffLimit: 0
```
### 3.2.2 结果展示
![3.png](./1.png)

## 3.3 比较基准测试
![4.png](./4.png)

# 4. longhorn卸载
**注意：卸载前最好将所有pvc及pv都逐个删除**

## 4.1 删除标志设置：方式一，终端
```yaml
kubectl -n longhorn-system patch -p '{"value": "true"}' --type=merge lhs deleting-confirmation-flag
```

## 4.2 删除标志设置：方式二，界面

- 勾选**Deleting Confirmation Flag选项**

![5.png](./5.png)

## 4.3 删除操作
```bash
helm uninstall longhorn -n longhorn-system
```
