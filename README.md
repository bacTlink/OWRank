# OWRank
A web server for processing Overwatch player data.
An instance here: [OWRank](https://owrank.top).

# Installation
Firstly, download this repo:
```
$ git clone https://github.com/bacTlink/OWRank.git
```

Then enter the repo directory and copy your HTTPS certificates into it
```
$ cd OWRank
$ mkdir WebServer/cert
$ cp "YOUR CERTIFICATES" WebServer/cert/
```

Alternatively, you can modify [server.js](https://github.com/bacTlink/OWRank/blob/master/WebServer/server.js) to disable HTTPS.

The server runs inside Docker container.
You can get Docker from its [official website](https://docs.docker.com).

After installing docker, run the following commands to build and run owrank image.
```
$ docker build -t owrank .
$ docker run owrank
```

You can prepare the runtime environment other than docker.
Prerequisites are listed below.

* nodejs
* mysql
* nodejs express module
* nodejs mysql module
* nodejs promise-mysql module

# Architecture
The server consists of three parts.

1. Data Collection
2. Auto Updating
3. Web Server

## Data Collection
The server use CasperJS to fetch data from official [website](http://ow.blizzard.cn/career).
The entrance is [bl-20180714.js](https://github.com/bacTlink/OWRank/blob/master/DataCollection/bl-20180714.js), which supports ```cookie``` method and ```passwd``` method.
It saves data into a randomly named file, and prints its name to standard output.

## Auto Updating
[auto_update.js](https://github.com/bacTlink/OWRank/blob/master/AutoUpdating/auto_update.js) automatically updates user data by periodically sending requests to the local web server.
However, this no longer works due to the cookies expiring in an hour since 2018-10-25.

## Web Server
The web server is organized by [pages](https://github.com/bacTlink/OWRank/blob/master/WebServer/page.js).
This design is for making the pages loose coupled, which benefits multi-person development.

A page consists of front end and back end.
Logically, the front end should focus on displaying data on browser, while the back end should focus on communicating with database and processing data.
The front end should not directly query database, but send requests to the back end.

# Copyright and License
Code and documentation copyright 2018 bacTlink and contributors. Code released under the MIT License. Docs released under Creative Commons.
