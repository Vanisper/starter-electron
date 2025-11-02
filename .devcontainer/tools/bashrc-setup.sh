#!/usr/bin/env bash

echo '' >> ~/.bashrc \
&& echo '# Custom Prompt' >> ~/.bashrc \
&& echo 'export PS1="\e[01;32m\u\e[m:\e[01;34m\w\e[m\$ "' >> ~/.bashrc

echo '' >> ~/.bashrc \
&& echo export LC_ALL=\"en_US.UTF-8\" >> ~/.bashrc
