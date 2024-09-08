---
title: "批量删除卸载docker遗留的大量挂载路径"
date: 2024-09-08
description: "批量删除挂载路径"
tags: ["Kubernetes", "docker", "mount", "path"]
type: 'blog'
---

# 1. 批量删除卸载docker遗留的大量挂载路径
- 可自定义路径：
  - /var/lib/bak-docker/overlay2
  - /var/lib/bak-docker/containers
```bash
#!/bin/bash

# 执行 df -h 命令并将输出存储到变量中
disk_output=$(df -h)

# 定义两个正则表达式来匹配目标路径
regex_overlay="/var/lib/bak-docker/overlay2/[a-fA-F0-9]{64}/merged"
regex_containers="/var/lib/bak-docker/containers/[a-zA-Z0-9.-]+"

# 使用grep匹配包含特定路径的行，并提取路径
while read -r line; do
    if [[ $line =~ $regex_overlay || $line =~ $regex_containers ]]; then
        # 提取路径
        path=$(echo $line | awk '{print $6}')
        echo "Found path: $path"
        
        # 检查路径是否存在，存在则卸载
        if [ -d "$path" ]; then
            if ! mountpoint -q "$path"; then
                echo "Path $path is not mounted."
            else
                umount "$path"
                echo "Unmounted $path"
            fi
        else
            echo "Path $path does not exist."
        fi
    fi
done <<< "$disk_output"
```