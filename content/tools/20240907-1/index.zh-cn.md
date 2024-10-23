---
title: "内网穿透工具FRP使用"
date: 2024-09-07
description: "内网穿透工具。"
tags: ["net", "proxy", "frp"]
type: 'blog'
---

# 0. 前言
本文主要用于通过一台具有公网ip地址的服务器来代理可访问公网的nas内部的局域网服务，需注意的是本方案存在一定的被黑客攻击风险，需谨慎使用。

# 1. frps配置及部署（服务端）
部署在具有公网ip地址的服务器上
- 运行命令
```bash
docker-compose -f docker-compose.yaml up -d
```

- docker-compose.yaml
```yaml
version: '3'
services:
  frp:
    container_name: frps
    image: snowdreamtech/frps:0.60
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - "/data/software/frps/frps.toml:/etc/frp/frps.toml"
    restart: always              
```

- 配置：frps.toml
```toml
[common]
bindAddr = 0.0.0.0
bind_port = 5xxx
# 启用面板
dashboard_port = 5x1x
# 面板登录名和密码
dashboard_user = xxx
dashboard_pwd = xxxx
# 使用http代理并使用5x2x端口进行穿透
vhost_http_port = 5x2x
# 使用https代理并使用5x3x端口进行穿透
vhost_https_port = 5x3x
# 日志路径
log_file = ./frps.log
# 日志级别
log_level = info
# 日志最大保存天数
log_max_days = 2
# 认证超时时间
authentication_timeout = 900
# 认证token，客户端需要和此对应
token=123456
# 最大连接数
max_pool_count = 50
max_ports_per_client = 0
```

# 2. frpc配置及部署（客户端）
部署在可访问公网的nas上
- 运行命令
```bash
docker-compose -f docker-compose.yaml up -d
```

- docker-compose.yaml
```yaml
version: '3'
services:
  frp:
    container_name: frpc
    image: snowdreamtech/frpc:0.60
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - "/vol1/1000/frpc/frpc.toml:/etc/frp/frpc.toml"
    restart: always          
```

- 配置：frpc.toml
    - frps.ip: frps服务器真实ip
    - token、server_addr、server_port：对应frps的配置来填写
    - custom_domains、customDomains：如果没有域名，则填写frps服务器的ip地址
    - remote_port：设定frps服务器代理的端口
```toml
[common]
server_addr = xx.xx.xx.xx
server_port = 5xxx
token = "123456"
log.to = "./frpc.log"
log.level = info
log.maxDays = 3
log.disablePrintColor = false

[[proxies]]
name = xxxx
type = http
local_ip = 0.0.0.0
local_port = xxxx
custom_domains = frps.ip
customDomains = xx.xx.xx
remote_port = 5x2x
```
## 2.1 frpc客户端tcp访问
- 配置：frpc.toml
    - frps.ip: frps服务器真实ip
    - token、server_addr、server_port：对应frps的配置来填写
    - custom_domains、customDomains：如果没有域名，则填写frps服务器的ip地址
    - remote_port：设定frps服务器代理的端口，仅需开放对应公网ip的端口，frps端无需单独设置
```toml
[common]
server_addr = xx.xx.xx.xx
server_port = 5xxx
token = "123456"
log.to = "./frpc.log"
log.level = info
log.maxDays = 3
log.disablePrintColor = false

[[proxies]]
name = navidrome
type = tcp
local_ip = 0.0.0.0
local_port = xxxx
custom_domains = frps.ip
customDomains = xx.xx.xx
remote_port = 5x21
```