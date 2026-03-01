@echo off
set VM=ec2-34-211-23-81.us-west-2.compute.amazonaws.com
set USER=ec2-user
set KEY=C:\Users\darkm\Downloads\alx-key-pair.pem

docker login
docker push buildbreak/overclock:latest

scp -i "%KEY%" .\nginx\nginx.conf %USER%@%VM%:nginx/nginx.conf
scp -i "%KEY%" .\docker-compose.yml %USER%@%VM%:
scp -i "%KEY%" .\setup-ssl.sh %USER%@%VM%:
scp -i "%KEY%" -r data %USER%@%VM%:
