#!/bin/bash
set -e

# 备份原配置
cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 使用USTC镜像源
# sed -i 's|http://.*ubuntu.com|https://mirrors.ustc.edu.cn|g' /etc/apt/sources.list
sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list
# sed -i 's@//.*archive.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources # DEB822 (.sources) 文件格式

# security 源
sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
# sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/ubuntu.sources # DEB822 (.sources) 文件格式

# ports 镜像更换
sed -i -e 's@//ports.ubuntu.com/\? @//ports.ubuntu.com/ubuntu-ports @g' \
  -e 's@//ports.ubuntu.com@//mirrors.ustc.edu.cn@g' \
  /etc/apt/sources.list
# security
# sed -i 's@//ports.ubuntu.com@//mirrors.ustc.edu.cn@g' /etc/apt/sources.list.d/ubuntu.sources

#  ppa 源 https://gist.github.com/gastonfeng/eb9f08d9abc62604538ca264eb95f830
# 不过后面临时加的 ppa 源要代理的话，需要再执行一遍指令
find /etc/apt/sources.list.d/ -type f -name "*.list" -exec sed -i.bak -r 's#deb(-src)?\s*http(s)?://ppa.launchpad.net#deb\1 http\2://launchpad.proxy.ustclug.org#ig' {} \;

# 更新
apt-get update

echo "源已成功更换为中国科学技术大学镜像源"
