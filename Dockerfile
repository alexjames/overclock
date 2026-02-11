FROM golang:1.22-alpine AS build

WORKDIR /src
COPY go.mod main.go ./
RUN go build -o /server .

FROM alpine:3.19

COPY --from=build /server /server
COPY data/ /data/

EXPOSE 8080

CMD ["/server"]
