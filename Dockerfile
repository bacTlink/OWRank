FROM node:latest

WORKDIR /home/node
EXPOSE 80 433
COPY . /home/node

RUN apt-get update

RUN npm install express
RUN npm install mysql
RUN npm install promise-mysql

RUN DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server

CMD ["./start_up.sh"]
