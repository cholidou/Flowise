FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY index.html ./
COPY styles.css ./
COPY app.js ./

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
