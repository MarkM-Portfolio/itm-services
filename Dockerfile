############################################################
# Dockerfile to build ITM service image
############################################################
# Set the base image to node
FROM connections-docker.artifactory.cwp.pnp-hcl.com/base/node:18-alpine

################## BEGIN INSTALLATION ######################
# Create app directory
RUN mkdir -p /opt/app && rm -f /usr/bin/nc
WORKDIR /opt/app

# Install app dependencies from global
COPY lib lib/
COPY package*.json ./
COPY deployment/cldr/cldr_29.0.2_connections_extended.json deployment/cldr/
RUN npm ci --omit=dev
RUN cp /home/ibm/app/entrypoint.sh ./
RUN apk add --no-cache openssl \
  && chmod +x /opt/app/entrypoint.sh

# RUN addgroup -g 1000 itmgroup && adduser -D -H -u 1008 -g 1000 itmuser \
#  && chown -R itmuser:itmgroup /opt/app
RUN chown -R $SERVICE_USER:$SERVICE_USER /opt/app

# Expose the default ports
EXPOSE 3000

ARG BUILD_VERSION
ENV BUILD_VERSION $BUILD_VERSION

##################### INSTALLATION END #####################
USER $SERVICE_USER
ENTRYPOINT ["/opt/app/entrypoint.sh"]
CMD ["node","lib/server.js"]
