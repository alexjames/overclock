How to test:

```
curl http://localhost/beta/v1/courses
```


1. Push your image to a registry
From your dev machine (where the repo lives):


# Build and tag the image
docker build -t buildbreak/overclock:latest .

# Push to Docker Hub (or any registry)
docker login
docker push buildbreak/overclock:latest
2. On the VM, create just 3 files
docker-compose.yml
nginx/nginx.conf
data/courses.json

1. Run on the VM
From your dev machine, build and push the new image. Then on the VM:

docker-compose pull
docker-compose up -d

docker-compose stop

### ssh
```
scp -i "C:\Users\darkm\Downloads\alx-key-pair.pem" .\nginx\nginx.conf ec2-user@ec2-34-211-23-81.us-west-2.compute.amazonaws.com:
nginx/nginx.conf
scp -i "C:\Users\darkm\Downloads\alx-key-pair.pem" .\docker-compose.yml ec2-user@ec2-34-211-23-81.us-west-2.compute.amazonaws.com:
scp -i "C:\Users\darkm\Downloads\alx-key-pair.pem" -r data ec2-user@ec2-34-211-23-81.us-west-2.compute.amazonaws.com:             
courses.json                             
```

### EC2 instance setup
```
sudo yum update -y 

sudo amazon-linux-extras install docker 

sudo yum install docker 

sudo service docker start 

sudo usermod -a -G docker ec2-user 

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

docker-compose version
```