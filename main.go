package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
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

	// Parse into structured data so we can look up courses by ID.
	var courses []map[string]interface{}
	if err := json.Unmarshal(raw, &courses); err != nil {
		log.Fatalf("failed to parse data file %s: %v", dataFile, err)
	}

	// Build a lookup map by course ID.
	courseByID := make(map[string]map[string]interface{})
	for _, c := range courses {
		if id, ok := c["id"].(string); ok {
			courseByID[id] = c
		}
	}

	http.HandleFunc("/beta/v1/courses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(raw)
	})

	http.HandleFunc("/beta/v1/courses/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse: /beta/v1/courses/{courseId}/sections
		path := strings.TrimPrefix(r.URL.Path, "/beta/v1/courses/")
		parts := strings.Split(path, "/")

		if len(parts) != 2 || parts[1] != "sections" {
			http.NotFound(w, r)
			return
		}

		courseID := parts[0]
		course, ok := courseByID[courseID]
		if !ok {
			http.NotFound(w, r)
			return
		}

		sections, ok := course["sections"]
		if !ok {
			sections = []interface{}{}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(sections)
	})

	log.Println("server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
