FROM node:18-alpine3.15

# 安裝時區相關套件
RUN apk add --no-cache tzdata

# 設置時區為CST
ENV TZ=Asia/Shanghai

# 將時區設置為CST
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk add g++ make py3-pip
WORKDIR /usr/src/app
COPY . .
RUN npm ci --legacy-peer-deps
RUN npm run build
CMD [ "node", "dist/main.js" ]