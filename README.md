How to test:

```
curl http://localhost/beta/v1/courses
```

# Deploy
```
./deploy.bat
```

# Build run locally
docker compose -f .\docker-compose-local.yml up --build

# Push to Docker Hub (or any registry)
docker login
docker push buildbreak/overclock:latest


2. On the VM, create just 3 files
docker-compose.yml
nginx/nginx.conf
data folder

docker-compose up --build -d

1. Run on the VM
From your dev machine, build and push the new image. Then on the VM:

docker-compose pull
docker-compose up -d
docker-compose stop
                      

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

docker build -t buildbreak/overclock:latest . 

docker run -d -p 80:8080 buildbreak/overclock:latest
docker-compose up

docker-compose stop

## Converting Markdown to Courses

The `scripts/md_to_course.py` script converts markdown files into course JSON for the app.

### Markdown Format

```markdown
# Course Title
### Section Title
Optional intro text right after the section heading becomes the first page.

#### Page Title
 * Each bullet point becomes a text block on the page.
 * Another bullet becomes another text block.

#### Another Page
 * Content for this page.

### Another Section
#### Page In Section Two
 * More content here.
```

**Heading mapping:**
- `#` — Course title
- `###` — Section (shown in the course section list)
- `####` — Page within a section (swipeable reading pages)
- `*` or `-` bullets — Text content blocks on the page
- Plain text after `###` (before first `####`) — Intro page for that section

### Running the Script

```bash
# Basic usage (ID derived from filename)
python scripts/md_to_course.py path/to/your-course.md

# With all options
python scripts/md_to_course.py path/to/your-course.md \
  --id my-course \
  --category "Computer Science" \
  --icon bug \
  --color "#EF4444"
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--id` | Derived from filename | Course ID used in URLs and filenames |
| `--category` | `Computer Science` | Category label shown in the app |
| `--icon` | `book` | Ionicons icon name (e.g. `code-slash`, `globe`, `bug`) |
| `--color` | `#6366F1` | Hex color for the course accent |

The script will:
1. Parse the markdown file
2. Write `data/courses/<id>.json`
3. Update `data/courses/courses_index.json` with the new course entry

After running the script, restart the Go server to pick up the new course data.

### Example

```bash
python scripts/md_to_course.py overclockdata/discover/testing/performance-testing.md \
  --id testing \
  --icon bug \
  --color "#EF4444"
```

ssh -i "C:\Users\darkm\Downloads\alx-key-pair.pem"   ec2-user@ec2-34-211-23-81.us-west-2.compute.amazonaws.com

### ALX(TODO):
Remove HTTP restriction on `app.json` otherwise you will fail APPL review:
```
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
```

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/overclock.buildbreak.net/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/overclock.buildbreak.net/privkey.pem
This certificate expires on 2026-05-30.
These files will be updated when the certificate renews.
```