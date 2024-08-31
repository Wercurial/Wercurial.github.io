---
title: "【Kubernetes知识】OwnerReference和Finalizers"
date: 2024-03-11
description: "实现docker及containerd镜像代理"
tags: ["Kubernetes", "pod", "spec"]
type: 'blog'
---

OwnerReference和Finalizers.

<!--more-->

# 1.OwnerReference

设置了OwnerReference以后，会在k8s资源间建立从属关系，当删除属主（即父资源）时，其从属资源（即子资源）也会跟着删除，这就是k8s中的级联删除

## 1.1 OwnerReference中的属性

```
ApiVersion：属主资源的api版本
Kind：属主资源的类型，例如deployment，pod等
Name：属主资源的名称
Uid：属主资源的唯一标识
Controller：当Controller属性为true时，表示资源对象是一个控制器（如Deployment、ReplicaSet等），它管理着其他资源对象（如Pod、Service等）的创建和生命周期。个人理解为：当一个资源有多个属主时，其中为true的属主会监视该资源的变化
BlockOwnerDeletion：根据它来判断从属资源的删除是否会阻塞属主资源的删除；当BlockOwnerDeletion为true，并且删除策略为前台删除（foreground）时，属主资源会等待从属资源删完后，才会删除，表现在go-client接口中即为要等待该属主资源及其所有从属资源完全删除后，才会返回该删除接口的结果；当BlockOwnerDeletion设置为false时，从属资源的删除不会阻塞属主资源的删除。

```

## 1.2 k8s中的删除策略

```
foreground（前台删除）：先删除从属资源，再删除属主资源（一般与BlockOwnerDeletion=true结合使用）
background（后台删除）：先删除属主资源，再在后台删除从属资源（默认策略）
orphan（孤儿删除）：不考虑OwnerReference，只删除该资源，不级联删除

```

## 1.3 BlockOwnerDeletion与删除策略结合使用

```
从属资源的BlockOwnerDeletion为true，删除策略为前台删除：删除属主资源时，会等待从属资源被删除后，才会删除属主资源，然后返回删除结果；与go-client结合来看就是，等属主资源和其所有的从属资源都被删除后，删除接口才会返回结果
从属资源的BlockOwnerDeletion为false，删除策略为前台删除时：删除属主资源时，不会等待从属资源的删除，会直接返回删除结果；与go-client结合来看就是，删除接口会立即返回结果
删除策略为后台删除时，都会直接返回删除结果，后台删除不会等待从属资源的删除
```

# 2.Finalizers

Finalizers是metadata中的一个数组类型的标签，当k8s资源存在Finalizers标签，删除该资源时，会阻塞该资源的删除，直到Finalizers为空时，才会将该资源真正删除

## 2.1 Finalizers的工作原理

当删除存在Finalizers标签的资源时，处理删除请求的api会为该资源的metadata标签中添加DeletionTimeStamp标签（该标签为下发删除请求的时间），并且会更改该资源的状态为Terminating状态，此时该资源并没有被完全删除，处于只可见状态；此时控制器会尽量满足该资源的Finalizers的要求，每达到一个要求，就会删去该Finalizers，直到所有的Finalizers全被删除时，该资源才会被真正删除