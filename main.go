package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "/data"
	}
	coursesDir := filepath.Join(dataDir, "courses")

	// Load the courses index (returned by /beta/v1/courses).
	indexPath := filepath.Join(coursesDir, "courses_index.json")
	indexRaw, err := os.ReadFile(indexPath)
	if err != nil {
		log.Fatalf("failed to read %s: %v", indexPath, err)
	}

	// Validate it's valid JSON.
	var indexCheck []map[string]interface{}
	if err := json.Unmarshal(indexRaw, &indexCheck); err != nil {
		log.Fatalf("failed to parse %s: %v", indexPath, err)
	}
	coursesJSON := indexRaw

	// Load all other JSON files in the data directory as individual course files.
	courseByID := make(map[string]map[string]interface{})

	entries, err := os.ReadDir(coursesDir)
	if err != nil {
		log.Fatalf("failed to read courses directory %s: %v", coursesDir, err)
	}

	for _, entry := range entries {
		name := entry.Name()
		if entry.IsDir() || !strings.HasSuffix(name, ".json") || name == "courses_index.json" {
			continue
		}

		filePath := filepath.Join(coursesDir, name)
		raw, err := os.ReadFile(filePath)
		if err != nil {
			log.Printf("warning: failed to read %s: %v", filePath, err)
			continue
		}

		var course map[string]interface{}
		if err := json.Unmarshal(raw, &course); err != nil {
			log.Printf("warning: failed to parse %s: %v", filePath, err)
			continue
		}

		id, ok := course["id"].(string)
		if !ok {
			log.Printf("warning: %s has no string 'id' field, skipping", filePath)
			continue
		}

		courseByID[id] = course
		log.Printf("loaded course: %s from %s", id, name)
	}

	// Load review flashcards (returned by /beta/v1/review).
	reviewPath := filepath.Join(dataDir, "review", "flashcards.json")
	reviewRaw, err := os.ReadFile(reviewPath)
	if err != nil {
		log.Fatalf("failed to read %s: %v", reviewPath, err)
	}
	// Validate it's valid JSON.
	var reviewCheck []interface{}
	if err := json.Unmarshal(reviewRaw, &reviewCheck); err != nil {
		log.Fatalf("failed to parse %s: %v", reviewPath, err)
	}
	reviewJSON := reviewRaw
	log.Printf("loaded %d flashcards", len(reviewCheck))

	// Build quiz data: one quiz per course, aggregating questions from all sections.
	type quizSummary struct {
		ID            string `json:"id"`
		Title         string `json:"title"`
		Color         string `json:"color"`
		Icon          string `json:"icon"`
		QuestionCount int    `json:"questionCount"`
	}

	var quizSummaries []quizSummary
	quizQuestions := make(map[string][]interface{}) // quizId -> questions

	for id, course := range courseByID {
		title, _ := course["title"].(string)
		color, _ := course["color"].(string)
		icon, _ := course["icon"].(string)

		rawSections, _ := course["sections"].([]interface{})
		var allQuestions []interface{}
		for _, s := range rawSections {
			sec, ok := s.(map[string]interface{})
			if !ok {
				continue
			}
			quiz, ok := sec["quiz"].(map[string]interface{})
			if !ok {
				continue
			}
			questions, ok := quiz["questions"].([]interface{})
			if !ok {
				continue
			}
			allQuestions = append(allQuestions, questions...)
		}

		if len(allQuestions) == 0 {
			continue
		}

		quizSummaries = append(quizSummaries, quizSummary{
			ID:            id,
			Title:         title,
			Color:         color,
			Icon:          icon,
			QuestionCount: len(allQuestions),
		})
		quizQuestions[id] = allQuestions
	}

	quizListJSON, err := json.Marshal(quizSummaries)
	if err != nil {
		log.Fatalf("failed to marshal quiz summaries: %v", err)
	}
	log.Printf("built %d quizzes", len(quizSummaries))

	http.HandleFunc("/beta/v1/quiz", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(quizListJSON)
	})

	http.HandleFunc("/beta/v1/quiz/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		quizID := strings.TrimPrefix(r.URL.Path, "/beta/v1/quiz/")
		questions, ok := quizQuestions[quizID]
		if !ok {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":        quizID,
			"questions": questions,
		})
	})

	http.HandleFunc("/beta/v1/review", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(reviewJSON)
	})

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

	log.Printf("loaded %d courses", len(courseByID))
	log.Println("server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
