FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8002 HOST=0.0.0.0
WORKDIR /app
COPY package.json package-lock.json ./
# Prisma generation runs during npm ci, so schemas must already be present.
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/logs /app/reports && chown -R node:node /app/logs /app/reports
USER node
EXPOSE 8002
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8002/api/v2/ready',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
