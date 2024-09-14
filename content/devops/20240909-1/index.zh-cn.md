---
title: "通过kaniko在容器中构建镜像"
date: 2024-09-09
description: "实现在容器中的镜像构建"
tags: ["Kubernetes", "docker", "build", "kaniko"]
type: 'blog'
---



# 1. kaniko介绍
- [kaniko](https://github.com/GoogleContainerTools/kaniko) 是一种工具，用于在容器或 Kubernetes 集群内从 Dockerfile 构建容器镜像。
- 与docker不同，Kaniko 并不依赖于Docker daemon进程，完全是在用户空间根据Dockerfile的内容逐行执行命令来构建镜像，这就使得在一些无法获取 docker daemon 进程的环境下也能够构建镜像，比如在标准的Kubernetes Cluster上。
- Kaniko 以容器镜像的方式来运行的，同时需要三个参数: Dockerfile，上下文，以及远端镜像仓库的地址。
  - Kaniko会先提取基础镜像(Dockerfile FROM 之后的镜像)的文件系统
  - 然后根据Dockerfile中所描述的，一条条执行命令，每一条命令执行完以后会在用户空间下面创建一个snapshot，并与存储与内存中的上一个状态进行比对，如果有变化，就将新的修改生成一个镜像层添加在基础镜像上，并且将相关的修改信息写入镜像元数据中
  - 等所有命令执行完，kaniko会将最终镜像推送到指定的远端镜像仓库。

# 2. kaniko镜像构建
根据自定义的harbor仓库给kaniko镜像配置权限
- 构建命令
```bash
docker build -t harbor.xxx.cn/tools/executor:v1.23.2-debug .
```
- config.json
  - 通过`echo -n admin:xxx |base64`生成一个base64的密钥，例如`xxtaW46SGFyYm9yxxx`
  - harbor私库地址：`harbor.xxx.cn`
```json
{"auths":{"harbor.xxx.cn":{"auth":"xxtaW46SGFyYm9yxxx"}}}
```
- Dockerfile
  - harbor私库地址：`harbor.xxx.cn`
```dockerfile
FROM gcr.io/kaniko-project/executor:v1.23.2-debug
ENV HARBOR_REGISTRY=harbor.xxx.cn
COPY config.json /kaniko/.docker/config.json
```

# 3. 在gitlab-ci中使用kaniko构建镜像
- .gitlab-ci.yml
  - Dockerfile文件需与.gitlab-ci.yml放在同一级目录或指定目录也可
  - --dockerfile：指定 Docker file 文件路径
  - --insecure：指定无 HTTPS 的 Harbor 仓库地址
  - --skip-tls-verify: 如果harbor私库没有配置https，则使用此配置跳过验证
  - --destination：设置打过 Harbor 仓库标签的镜像名称及版本号
```yaml
cache:
  key: ${CI_PROJECT_NAME}
  paths:
    - .venv/

stages:
  - build_docker

build_docker:
  stage: build_docker
  image:
    name: ${KANIKO_IMAGE}
  cache:
    key: ${CI_PROJECT_NAME}
    paths:
      - .venv/
  script: |
    ls -la ./
    cp -r /builds/xxxx/${CI_PROJECT_NAME}/* /workspace
    cp -r .venv /workspace
    if [ "${CI_COMMIT_REF_NAME}" == "master" ]; then 
      /kaniko/executor --build-arg CI_PROJECT_NAME=${CI_PROJECT_NAME} --dockerfile Dockerfile --skip-tls-verify --destination ${HARBOR_REGISTRY}/xxxx/${CI_PROJECT_NAME}:$VERSION_VAR
    else
      /kaniko/executor --build-arg CI_PROJECT_NAME=${CI_PROJECT_NAME} --dockerfile Dockerfile --skip-tls-verify --destination ${HARBOR_REGISTRY}/xxxx/${CI_PROJECT_NAME}:$VERSION_VAR
    fi
```


# 4. 报错解决
## 4.1 Error: kaniko should only be run inside of a container
这是因为Docker Engine 20.10 引入了一个已知的不兼容问题，当主机使用 Docker Engine 20.10 或更高版本时，低于 v1.9.0 的版本中的 gcr.io/kaniko-project/executor:debug 镜像无法按预期工作。
当尝试构建映像时，Kaniko会失败，并显示：
```bash
kaniko should only be run inside of a container, run with the --force flag if you are sure you want to continue
```
- 解决方案
```
要解决此问题，请将 gcr.io/kaniko-project/executor:debug 容器更新到至少 v1.9.0 的版本，例如 gcr.io/kaniko-project/executor:v1.23.2-debug
```
而反过来，（版本 19.06.x 或更早版本中主机上的 gcr.io/kaniko-project/executor:v1.23.2-debug 映像和 Docker 引擎）可以正常工作。为了获得最佳策略，您应该经常测试作业环境版本并将其更新到最新版本。这带来了新功能、更高的安全性，并且对于这种特定情况，使运行器主机上底层 Docker Engine 的升级对作业透明。

# 5. 容器内kaniko构建增加非docker-hub镜像仓库
- 因某些原因，docker-hub镜像仓库用不了的时候，通过参数`--registry-mirror`指定可用镜像仓库地址
```bash
/kaniko/executor --build-arg CI_PROJECT_NAME=${CI_PROJECT_NAME} --build-arg SERVICE_NAME=$SERVICE_NAME --registry-mirror ${REGISTRY_MIRROR}  --dockerfile Dockerfile --skip-tls-verify --destination ${HARBOR_REGISTRY}/test/$SERVICE_NAME:$VERSION_VAR
```