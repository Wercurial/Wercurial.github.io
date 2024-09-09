---
title: "Harbor镜像仓库迁移"
date: 2024-09-02
description: "实现Harbor镜像仓库迁移"
tags: ["Kubernetes", "Harbor", "backup", "image"]
type: 'blog'
---
{{< typeit
  tag=h5
  speed=80
  loop=true
  lifeLike=true
>}}"无聊望见了犹豫, 达到理想不太易~"
{{< /typeit >}}

# 1. 待迁移Harbor仓库配置
## 1.1 通过仓库管理添加新Harbor仓库关联
![image.png](./1.png)
- 新建目标
  - 添加对应Harbor仓库信息
  - 添加具有创建空间权限的用户名、密码
  - 测试连接是否成功
  - 保存
![image.png](./2.png)

## 1.2 通过复制管理添加待复制空间的规则
![image.png](./3.png)
- 新建规则
  - 选择复制模式
  - 配置资源过滤器条件：不填，则默认复制全部镜像，可定义单个命名空间: xxx/**
  - 选择目标仓库（1.1中增加的仓库）
  - 选择触发模式（默认手动）
![image.png](./4.png)

# 2. 开始迁移
- 选中复制管理里新建的规则，点击复制按钮开始复制
![image.png](./5.png)
- 查看进度
![image.png](./6.png)