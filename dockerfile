# Dockerfile for a reveal.js builder environment
# Use Gulp 4 for watcher fix (file added detection)


FROM alpine:3.3

MAINTAINER Romain Pigeyre <rpigeyre@gmail.com>

ENV REVEALJS_VERSION 3.3.0

RUN \
    # For wget with https
    apk update && \
    apk add ca-certificates && \
    update-ca-certificates && \
    # Install NodeJS
    apk add nodejs \
    # Only for Gulp 4 usage
            git  && \
    # Update NPM
    npm install -g npm && \

#RUN \
    # Get revealJS
    cd /tmp && \
    wget https://github.com/hakimel/reveal.js/archive/${REVEALJS_VERSION}.tar.gz && \
    tar xzf ${REVEALJS_VERSION}.tar.gz && \
    # Build project directory
    mkdir -p /project-builder/build/resources && \
    mv reveal.js-${REVEALJS_VERSION} /project-builder/build/resources/revealjs && \
    # Purge temporary resources
    rm /tmp/${REVEALJS_VERSION}.tar.gz && \

#RUN \
    # Install Gulp and plugins
    cd /project-builder && \
    npm init -f && \
    npm install -g gulpjs/gulp-cli && \
    npm install     \
                    gulpjs/gulp.git#4.0 \
                    gulp-connect \
                    gulp-zip \
                    gulp-filter \
                    gulp-wrap \
                    gulp-concat \
                    gulp-connect \
                    gulp-clone \
                    event-stream \
                    gulp-rename \
                    gulp-template \
                    --save && \
    # Only for Gulp 4 usage
    apk del git \
            pcre \
            expat \
            curl \
            libssh2

WORKDIR /project-builder

ADD project-builder /project-builder

EXPOSE 8080
EXPOSE 35729

VOLUME ["/project-builder/resources/slides", "/project-builder/assets/site/images"]

CMD \
    mkdir -p assets/site/plugin/socket.io && \
    sleep 2 && \
    # Get Resources
    wget -O assets/site/plugin/socket.io/socket.io.js http://socketio:1948/socket.io/socket.io.js && \
    wget -O resources/token/socketio.token http://socketio:1948/token && \
    gulp