FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node app.js swagger.js ./
COPY --chown=node:node src ./src
RUN mkdir -p /app/logs && chown node:node /app/logs
USER node
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000/ready',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "app.js"]
