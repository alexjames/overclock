package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func main() {
	dataFile := os.Getenv("DATA_FILE_PATH")
	if dataFile == "" {
		dataFile = "/data/courses.json"
	}

	raw, err := os.ReadFile(dataFile)
	if err != nil {
		log.Fatalf("failed to read data file %s: %v", dataFile, err)
	}

	// Validate that the file contains valid JSON.
	if !json.Valid(raw) {
		log.Fatalf("data file %s does not contain valid JSON", dataFile)
	}

	http.HandleFunc("/beta/v1/courses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(raw)
	})

	log.Println("server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
