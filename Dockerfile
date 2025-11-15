FROM nginx:alpine

# Copy HTML files
COPY *.html /usr/share/nginx/html/

# Copy JavaScript files
COPY *.js /usr/share/nginx/html/

# Copy JSON files
COPY *.json /usr/share/nginx/html/

# Copy projects folder
COPY projects/ /usr/share/nginx/html/projects/

# Copy nginx configuration (replace default)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Test nginx configuration
RUN nginx -t

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
