---
title: "下载gs协议的文件"
date: 2024-08-29
description: "下载gs协议（gs://）的文件。"
tags: ["file", "download", "gs"]
type: 'skill-tech'
---

本文提供了下载gs协议的文件方案。

<!--more-->
> 通过将gs://后的文件或文件夹地址拼接到https://storage.googleapis.com即可

# 1. 原始文件地址
```bash
gs://kfserving-examples/models/sklearn/1.0/model/model.joblib
```


# 2. 转换后的下载地址
```bash
https://storage.googleapis.com/kfserving-examples/models/sklearn/1.0/model/model.joblib
```