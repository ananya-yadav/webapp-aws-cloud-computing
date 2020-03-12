#!/bin/bash

# Stop all servers and start the server as a daemon
cd /home/ubuntu/
pm2 stop all
pm2 start ./bin/www