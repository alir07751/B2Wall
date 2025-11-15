FROM nginx:alpine

# Copy HTML files and static assets
COPY *.html /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/
COPY *.json /usr/share/nginx/html/
COPY projects/ /usr/share/nginx/html/projects/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

