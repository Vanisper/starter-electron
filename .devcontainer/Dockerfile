FROM ubuntu:22.04

# Set up TEMP directory
ENV TEMP=/tmp
RUN chmod a+rwx /tmp

COPY tools/change-sources.sh /tmp/
RUN chmod +x /tmp/change-sources.sh && \
    /tmp/change-sources.sh && \
    rm /tmp/change-sources.sh

# based on https://github.com/electron/build-images
ARG USERNAME=builduser
ARG USER_UID=999
ARG USER_GID=999
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID --shell /bin/bash --create-home $USERNAME \
    && mkdir -p /etc/sudoers.d \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Install Linux packages
ADD tools/install-deps.sh /tmp/
RUN bash /tmp/install-deps.sh

# Add xvfb init script
ADD tools/xvfb-init.sh /etc/init.d/xvfb
RUN chmod a+x /etc/init.d/xvfb

USER $USERNAME
WORKDIR /home/$USERNAME

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
# Configure Bash
RUN echo '' >> ~/.bashrc \
    && echo '# BunJS Setup' >> ~/.bashrc \
    && echo 'export BUN_INSTALL="/home/$USERNAME/.bun"' >> ~/.bashrc \
    && echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc

# Configure VNC
COPY tools/vnc-setup.sh /tmp/library-scripts/
RUN sudo apt-get update && export DEBIAN_FRONTEND=noninteractive \
	&& sudo bash /tmp/library-scripts/vnc-setup.sh \
	&& sudo add-apt-repository ppa:mozillateam/ppa \
	&& sudo apt-get -y install firefox-esr \
	&& sudo apt-get clean -y && sudo rm -rf /var/lib/apt/lists/* /tmp/library-scripts/

# Env vars for VNC
ENV DBUS_SESSION_BUS_ADDRESS="autolaunch:" \
	VNC_RESOLUTION="1440x768x16" \
	VNC_DPI="96" \
	VNC_PORT="5901" \
	NOVNC_PORT="6080" \
	DISPLAY=":1" \
	LANG="en_US.UTF-8" \
	LANGUAGE="en_US.UTF-8"

COPY tools/bashrc-setup.sh /tmp/library-scripts/
RUN bash /tmp/library-scripts/bashrc-setup.sh

# https://vscode.js.cn/remote/advancedcontainers/start-processes
# https://github.com/orgs/devcontainers/discussions/122
COPY tools/docker-entrypoint.sh /
RUN sudo chmod +x /docker-entrypoint.sh
ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD [ "sleep", "infinity" ]

USER $USERNAME
