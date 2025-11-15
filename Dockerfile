FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy HTML files
COPY *.html ./

# Copy JavaScript files
COPY *.js ./

# Copy JSON files
COPY *.json ./

# Copy projects folder
COPY projects/ ./projects/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
