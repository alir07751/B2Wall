FROM nginx:1.25-alpine

# If your platform expects a different internal port, change both here and in nginx.conf
ENV PORT=8080

# Copy config and site
COPY nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html

# Reasonable permissions
RUN chmod -R 755 /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s   CMD wget -q -O- http://127.0.0.1:${PORT}/ || exit 1

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
