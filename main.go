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

	// Build a lookup map by course ID and a sections-stripped list for the courses endpoint.
	courseByID := make(map[string]map[string]interface{})
	var courseSummaries []map[string]interface{}
	for _, c := range courses {
		if id, ok := c["id"].(string); ok {
			courseByID[id] = c
		}
		summary := make(map[string]interface{})
		for k, v := range c {
			if k != "sections" {
				summary[k] = v
			}
		}
		courseSummaries = append(courseSummaries, summary)
	}

	coursesJSON, err := json.Marshal(courseSummaries)
	if err != nil {
		log.Fatalf("failed to marshal course summaries: %v", err)
	}

	http.HandleFunc("/beta/v1/courses", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(coursesJSON)
	})

	http.HandleFunc("/beta/v1/courses/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/beta/v1/courses/")
		parts := strings.Split(path, "/")

		// GET /beta/v1/courses/{courseId}/sections
		if len(parts) == 2 && parts[1] == "sections" {
			courseID := parts[0]
			course, ok := courseByID[courseID]
			if !ok {
				http.NotFound(w, r)
				return
			}

			rawSections, _ := course["sections"].([]interface{})
			var summaries []map[string]interface{}
			for _, s := range rawSections {
				sec, ok := s.(map[string]interface{})
				if !ok {
					continue
				}
				summary := make(map[string]interface{})
				for k, v := range sec {
					if k != "pages" && k != "slides" && k != "quiz" && k != "spanningImages" {
						summary[k] = v
					}
				}
				summaries = append(summaries, summary)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(summaries)
			return
		}

		// GET /beta/v1/courses/{courseId}/sections/{sectionId}/pages
		if len(parts) == 4 && parts[1] == "sections" && parts[3] == "pages" {
			courseID := parts[0]
			sectionID := parts[2]

			course, ok := courseByID[courseID]
			if !ok {
				http.NotFound(w, r)
				return
			}

			rawSections, _ := course["sections"].([]interface{})
			for _, s := range rawSections {
				sec, ok := s.(map[string]interface{})
				if !ok {
					continue
				}
				if sec["id"] == sectionID {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(sec)
					return
				}
			}

			http.NotFound(w, r)
			return
		}

		http.NotFound(w, r)
	})

	log.Println("server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
