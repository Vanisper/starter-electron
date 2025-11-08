#!/bin/bash

# based on https://github.com/freelensapp/freelens/blob/main/freelens/build/icon.sh
# https://www.reddit.com/r/electronjs/comments/1lnmxl5/how_to_set_app_icon_in_electron_js_macos_app_icon

set -euo pipefail
# 图标原始 svg - https://gist.github.com/thecodewarrior/56b2aeee751fc23c4945c8c232b37c81#file-app-icon-template-svg
SVG_SOURCE="icon.svg"

# ==============================================================================
# 切换工作目录
# ==============================================================================

# 获取脚本文件所在的目录 - BASH_SOURCE[0] 是脚本自身的路径
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# 切换到脚本目录作为工作目录
cd "$SCRIPT_DIR" || {
  echo "无法切换到脚本目录: $SCRIPT_DIR"
  exit 1
}
echo "当前工作目录已设置为: $(pwd)"

# ==============================================================================
# 辅助函数
# ==============================================================================

# 函数：svg 转换成指定尺寸、边框的 png
# 参数：$1=目标尺寸, $2=透明边框, $3=输出路径
resize_and_save() {
  local target_size=$1
  local border=$2
  local output_path=$3

  magick -background none "${SVG_SOURCE}" -density 400 \
    -resize "${target_size}x${target_size}" \
    -bordercolor transparent -border "${border}" \
    -verbose "${output_path}"
}

# ==============================================================================
# 脚本退出时清理临时文件 - https://zhuanlan.zhihu.com/p/666871419
# ==============================================================================

cleanup() {
  echo
  echo "Cleaning up..."
  # TODO: 执行清理操作，例如关闭文件描述符、删除临时文件等
}
trap cleanup EXIT

# ==============================================================================
# macOS 图标生成 (.icns)
# ==============================================================================

## macOS
echo
echo "--- Starting macOS Icon Generation ---"
rm -rf icon.iconset
mkdir icon.iconset

for i in 16 32 64 128 256 512 1024; do
  # border=$(("${i}000" * 100 / 1000000)) # 会报错
  border=$(bc <<<"scale=0; (${i}000 * 100) / 1000000")
  size=$((i - 2 * border))
  half=$((i / 2))

  # 生成标准尺寸图标 (e.g., icon_16x16.png)
  if [[ $i -ne 1024 ]]; then
    resize_and_save "$size" "$border" "icon.iconset/icon_${i}x${i}.png"
  fi

  # 生成高分辨率图标 (@2x)
  if [[ $i -ne 16 ]]; then
    resize_and_save "$size" "$border" "icon.iconset/icon_${half}x${half}@2x.png"
  fi
done

echo "Converting .iconset to .icns..."
iconutil --convert icns -o icon.icns icon.iconset
rm -rf icon.iconset
echo "macOS generation complete."

# ==============================================================================
# Windows 图标生成 (.ico)
# ==============================================================================

## Windows
echo
echo "--- Starting Windows Icon Generation ---"
# 因为 magick 命令可以一次性处理 Windows ICO 所有尺寸
magick -background none "${SVG_SOURCE}" -density 400 \
  -define icon:auto-resize=16,20,24,32,40,48,60,64,72,80,96,256 \
  -verbose icon.ico
echo "Windows generation complete."

# ==============================================================================
# Linux 图标生成 (PNGs)
# ==============================================================================

## Linux
echo
echo "--- Starting Linux Icon Generation ---"
mkdir -p icons

for i in 16 22 24 32 36 48 64 72 96 128 192 256 512; do
  # border=$(("${i}000" * 38 / 1000000)) # 会报错
  border=$(bc <<<"scale=0; (${i}000 * 38) / 1000000")
  size=$((i - 2 * border))
  resize_and_save "$size" "${border}" "icons/${i}x${i}.png"
done

echo "Linux generation complete."
